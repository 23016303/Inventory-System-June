// Profile API endpoints - converts profile.php to JavaScript
const express = require('express');
const router = express.Router();
const db = require('./includes/database');
const bcrypt = require('bcryptjs');
const { authenticate, requireLevel } = require('./includes/session');
const multer = require('multer');
const path = require('path');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/users/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get user profile
router.get('/:id?', authenticate, requireLevel(3), async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.username,
                u.email,
                u.user_level,
                u.image,
                u.status,
                u.last_login,
                ug.group_name
            FROM users u
            LEFT JOIN user_groups ug ON u.user_level = ug.group_level
            WHERE u.id = ?
        `;
        
        const [users] = await db.execute(query, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const user = users[0];
        
        // Remove sensitive data if not own profile
        if (parseInt(userId) !== req.user.id && req.user.user_level > 1) {
            delete user.email;
        }
        
        res.json({
            success: true,
            user,
            canEdit: parseInt(userId) === req.user.id || req.user.user_level === 1
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile' 
        });
    }
});

// Update user profile
router.put('/:id?', authenticate, requireLevel(3), async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        const { name, username, email } = req.body;
        
        // Check if user can edit this profile
        if (parseInt(userId) !== req.user.id && req.user.user_level > 1) {
            return res.status(403).json({ 
                success: false, 
                message: 'Permission denied' 
            });
        }
        
        // Validate required fields
        if (!name || !username) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and username are required' 
            });
        }
        
        // Check if username is unique (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?', 
            [username, userId]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }
        
        const query = `
            UPDATE users 
            SET name = ?, username = ?, email = ?
            WHERE id = ?
        `;
        
        await db.execute(query, [name, username, email || null, userId]);
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile' 
        });
    }
});

// Change password
router.post('/:id/change-password', authenticate, requireLevel(3), async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Check if user can change this password
        if (parseInt(userId) !== req.user.id && req.user.user_level > 1) {
            return res.status(403).json({ 
                success: false, 
                message: 'Permission denied' 
            });
        }
        
        // Validate required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All password fields are required' 
            });
        }
        
        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New passwords do not match' 
            });
        }
        
        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }
        
        // Get current password hash
        const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValidPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password' 
        });
    }
});

// Upload profile image
router.post('/:id/upload-image', authenticate, requireLevel(3), upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        
        // Check if user can upload image for this profile
        if (parseInt(userId) !== req.user.id && req.user.user_level > 1) {
            return res.status(403).json({ 
                success: false, 
                message: 'Permission denied' 
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }
        
        const imagePath = req.file.filename;
        
        // Update user's image in database
        await db.execute('UPDATE users SET image = ? WHERE id = ?', [imagePath, userId]);
        
        res.json({
            success: true,
            message: 'Profile image updated successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload image' 
        });
    }
});

// Get profile image
router.get('/:id/image', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [users] = await db.execute('SELECT image FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0 || !users[0].image) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile image not found' 
            });
        }
        
        const imagePath = path.join(__dirname, 'uploads', 'users', users[0].image);
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Image fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch image' 
        });
    }
});

module.exports = router;

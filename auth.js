// Authentication endpoints
const express = require('express');
const { sql, session, Functions } = require('./includes/load');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        const validationErrors = Functions.validateFields(['username', 'password'], req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Check login attempts
        const loginCheck = session.checkLoginAttempts(username);
        if (loginCheck.locked) {
            return res.status(429).json({
                success: false,
                message: `Too many failed attempts. Try again in ${loginCheck.timeRemaining} minutes.`
            });
        }

        // Find user
        const users = await sql.findBySql('SELECT * FROM users WHERE username = ? AND status = 1', [username]);
        
        if (users.length === 0) {
            session.recordFailedLogin(username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        // Verify password
        const validPassword = await session.comparePassword(password, user.password);
        if (!validPassword) {
            session.recordFailedLogin(username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Clear login attempts on successful login
        session.clearLoginAttempts(username);

        // Update last login
        await sql.updateById('users', user.id, {
            last_login: new Date()
        });

        // Generate token
        const token = session.generateToken(user);
        const sessionData = session.generateSessionData(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: sessionData.user,
            permissions: sessionData.permissions
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint
router.post('/logout', session.isUserLoggedIn(), (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user profile
router.get('/profile', session.isUserLoggedIn(), async (req, res) => {
    try {
        const user = await sql.findById('users', req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const sessionData = session.generateSessionData(user);
        res.json({
            success: true,
            user: sessionData.user,
            permissions: sessionData.permissions
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Change password
router.post('/change-password', session.isUserLoggedIn(), async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        const validationErrors = Functions.validateFields(['currentPassword', 'newPassword', 'confirmPassword'], req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        // Get current user
        const user = await sql.findById('users', req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const validPassword = await session.comparePassword(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await session.hashPassword(newPassword);

        // Update password
        await sql.updateById('users', req.user.id, {
            password: hashedPassword
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;

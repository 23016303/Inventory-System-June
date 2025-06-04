const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Database } = require('./includes/database');
const { SQL } = require('./includes/sql');
const { Functions } = require('./includes/functions');
const { Session } = require('./includes/session');

const db = new Database();
const sql = new SQL();
const functions = new Functions();
const session = new Session();

// GET /api/users - Get all users with group information
router.get('/', async (req, res) => {
  try {
    // Check user permission level (equivalent to page_require_level(1))
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all users with joined group data (equivalent to find_all_user())
    const query = `
      SELECT u.id, u.name, u.username, u.user_level, u.status, u.last_login,
             g.group_name
      FROM users u
      LEFT JOIN user_groups g ON g.group_level = u.user_level
      ORDER BY u.name ASC
    `;
    
    const users = await db.query(query);
    
    res.json({
      success: true,
      users: users,
      message: session.getMsg()
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const userId = parseInt(req.params.id);
    const query = `
      SELECT u.*, g.group_name
      FROM users u
      LEFT JOIN user_groups g ON g.group_level = u.user_level
      WHERE u.id = ?
    `;
    
    const users = await db.query(query, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't return password
    delete users[0].password;
    
    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user' 
    });
  }
});

// GET /api/users/groups/all - Get all user groups
router.get('/groups/all', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const query = 'SELECT * FROM user_groups ORDER BY group_level ASC';
    const groups = await db.query(query);
    
    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user groups' 
    });
  }
});

// POST /api/users - Add new user
router.post('/', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, username, password, user_level } = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'username', 'password', 'user_level'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Clean and validate data
    const cleanName = functions.removeJunk(name);
    const cleanUsername = functions.removeJunk(username);
    const cleanUserLevel = parseInt(user_level);
    
    if (!cleanName || !cleanUsername || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if username already exists
    const existingUser = await db.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (name, username, password, user_level, status)
      VALUES (?, ?, ?, ?, 1)
    `;
    
    await db.query(query, [cleanName, cleanUsername, hashedPassword, cleanUserLevel]);
    
    session.setMsg('s', 'User account has been created');
    res.json({
      success: true,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error adding user:', error);
    session.setMsg('d', 'Sorry, failed to create account');
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user' 
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const userId = parseInt(req.params.id);
    const { name, username, password, user_level, status } = req.body;
    
    // Check if user exists
    const existingUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate required fields (password is optional for updates)
    const requiredFields = ['name', 'username', 'user_level'];
    const errors = functions.validateFields(req.body, requiredFields);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors 
      });
    }

    // Clean and validate data
    const cleanName = functions.removeJunk(name);
    const cleanUsername = functions.removeJunk(username);
    const cleanUserLevel = parseInt(user_level);
    const cleanStatus = status !== undefined ? parseInt(status) : 1;
    
    if (!cleanName || !cleanUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and username are required' 
      });
    }

    // Check if username already exists for another user
    const duplicateUser = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [cleanUsername, userId]);
    if (duplicateUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    let query, params;
    
    if (password && password.trim() !== '') {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 12);
      query = `
        UPDATE users 
        SET name = ?, username = ?, password = ?, user_level = ?, status = ?
        WHERE id = ?
      `;
      params = [cleanName, cleanUsername, hashedPassword, cleanUserLevel, cleanStatus, userId];
    } else {
      // Update without changing password
      query = `
        UPDATE users 
        SET name = ?, username = ?, user_level = ?, status = ?
        WHERE id = ?
      `;
      params = [cleanName, cleanUsername, cleanUserLevel, cleanStatus, userId];
    }
    
    await db.query(query, params);
    
    session.setMsg('s', 'User updated successfully');
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    session.setMsg('d', 'Sorry, failed to update user');
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user' 
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const userId = parseInt(req.params.id);
    
    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }
    
    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete the user
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    session.setMsg('s', 'User deleted successfully');
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    session.setMsg('d', 'Sorry, failed to delete user');
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});

// PUT /api/users/:id/status - Toggle user status
router.put('/:id/status', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const userId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Prevent deactivating yourself
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot change your own status' 
      });
    }
    
    // Check if user exists
    const existingUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const newStatus = status !== undefined ? parseInt(status) : (existingUser[0].status === 1 ? 0 : 1);
    
    await db.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);
    
    const statusText = newStatus === 1 ? 'activated' : 'deactivated';
    session.setMsg('s', `User ${statusText} successfully`);
    res.json({
      success: true,
      message: `User ${statusText} successfully`,
      status: newStatus
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    session.setMsg('d', 'Sorry, failed to update user status');
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user status' 
    });
  }
});

module.exports = router;

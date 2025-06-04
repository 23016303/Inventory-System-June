const express = require('express');
const router = express.Router();
const { verifyToken } = require('./includes/session');

/**
 * Logout Route - replaces logout.php
 * Handles user logout by clearing JWT token
 */
router.post('/', verifyToken, (req, res) => {
    try {
        // In JWT-based auth, logout is handled client-side by removing the token
        // Server-side logout can be implemented with token blacklisting if needed
        
        res.json({
            success: true,
            message: 'Logged out successfully',
            redirect: '/login'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
});

// Alternative GET route for direct logout access
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
        redirect: '/login'
    });
});

module.exports = router;

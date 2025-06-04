const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('Starting simple test server...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Simple auth test route
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password });
    
    // Simple test login
    if (username === 'admin' && password === 'admin') {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'test-token-123',
            user: {
                id: 1,
                username: 'admin',
                name: 'Administrator'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('You can now test the login with admin/admin');
});

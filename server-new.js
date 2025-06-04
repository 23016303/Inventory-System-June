const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import route modules
const authRoutes = require('./auth');
const homeRoutes = require('./home');
const productRoutes = require('./product');
const salesRoutes = require('./sales');
const categorieRoutes = require('./categorie');
const usersRoutes = require('./users');
const mediaRoutes = require('./media');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// JWT middleware for protected routes
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Apply authentication middleware to all API routes except auth
app.use('/api', (req, res, next) => {
  // Skip authentication for login route
  if (req.path === '/auth/login' || req.path === '/auth/register') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/media', mediaRoutes);

// Default route to serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=== Inventory Management System ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`====================================`);
});

module.exports = app;

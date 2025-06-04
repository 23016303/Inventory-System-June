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
const reportsRoutes = require('./reports');
const profileRoutes = require('./profile');

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
  if (req.path === '/login' || req.path === '/auth/login' || req.path === '/auth/register') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Route handlers
app.use('/api', authRoutes); // Handle /api/login directly
app.use('/api/dashboard', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);

// Additional routes (converted from PHP)
app.use('/api/logout', require('./logout'));
app.use('/api/monthly-sales', require('./monthly-sales'));
app.use('/api/sales-report', require('./sales-report'));
app.use('/api/admin', require('./admin'));
app.use('/api/groups', require('./groups'));
app.use('/api/daily-sales', require('./daily-sales'));

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

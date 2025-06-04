// Session management with JWT
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class Session {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
    }

    // Generate JWT token
    generateToken(userData) {
        return jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                user_level: userData.user_level,
                name: userData.name
            },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }

    // Hash password
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Compare password
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Middleware to check if user is logged in
    isUserLoggedIn() {
        return (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access token required' 
                });
            }

            const user = this.verifyToken(token);
            if (!user) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Invalid or expired token' 
                });
            }

            req.user = user;
            next();
        };
    }

    // Check user permission level
    checkPermission(requiredLevel) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Authentication required' 
                });
            }

            if (req.user.user_level > requiredLevel) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Insufficient permissions' 
                });
            }

            next();
        };
    }

    // Admin only middleware
    adminOnly() {
        return this.checkPermission(1);
    }

    // Special user and admin middleware
    specialAndAdmin() {
        return this.checkPermission(2);
    }

    // Get current user from token
    getCurrentUser(token) {
        return this.verifyToken(token);
    }

    // Login attempt counter (in-memory, could be moved to database)
    static loginAttempts = new Map();

    // Check if user has too many failed login attempts
    checkLoginAttempts(username) {
        const attempts = Session.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        const lockoutTime = 15 * 60 * 1000; // 15 minutes

        // Reset if last attempt was more than lockout time ago
        if (now - attempts.lastAttempt > lockoutTime) {
            Session.loginAttempts.delete(username);
            return { locked: false, remaining: 5 };
        }

        // Check if locked out
        if (attempts.count >= 5) {
            const timeRemaining = lockoutTime - (now - attempts.lastAttempt);
            return { 
                locked: true, 
                timeRemaining: Math.ceil(timeRemaining / 1000 / 60) 
            };
        }

        return { locked: false, remaining: 5 - attempts.count };
    }

    // Record failed login attempt
    recordFailedLogin(username) {
        const attempts = Session.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        Session.loginAttempts.set(username, attempts);
    }

    // Clear login attempts on successful login
    clearLoginAttempts(username) {
        Session.loginAttempts.delete(username);
    }

    // Generate session data for frontend
    generateSessionData(user) {
        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                user_level: user.user_level,
                image: user.image || 'no_image.jpg'
            },
            permissions: this.getUserPermissions(user.user_level)
        };
    }

    // Get user permissions based on level
    getUserPermissions(userLevel) {
        const permissions = {
            1: { // Admin
                canManageUsers: true,
                canManageProducts: true,
                canManageCategories: true,
                canViewReports: true,
                canManageSettings: true,
                canDeleteRecords: true
            },
            2: { // Special
                canManageUsers: false,
                canManageProducts: true,
                canManageCategories: true,
                canViewReports: true,
                canManageSettings: false,
                canDeleteRecords: true
            },
            3: { // User
                canManageUsers: false,
                canManageProducts: true,
                canManageCategories: false,
                canViewReports: false,
                canManageSettings: false,
                canDeleteRecords: false
            }
        };

        return permissions[userLevel] || permissions[3];
    }
}

module.exports = Session;

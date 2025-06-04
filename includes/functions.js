// Utility functions converted from PHP
const validator = require('express-validator');

class Functions {
    // Remove special characters and sanitize input
    static removeJunk(str) {
        if (!str) return '';
        return str.toString().replace(/<[^>]*>/g, '').trim();
    }

    // Escape HTML characters
    static escapeHtml(str) {
        if (!str) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, (m) => map[m]);
    }

    // Uppercase first character
    static firstCharacter(str) {
        if (!str) return '';
        const val = str.replace(/-/g, ' ');
        return val.charAt(0).toUpperCase() + val.slice(1);
    }

    // Validate required fields
    static validateFields(fields, data) {
        const errors = [];
        fields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`${field} can't be blank.`);
            }
        });
        return errors;
    }

    // Format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Generate random string
    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Check if date is valid
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Format date
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch(format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            default:
                return d.toDateString();
        }
    }

    // Pagination helper
    static paginate(totalItems, currentPage = 1, itemsPerPage = 10) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const offset = (currentPage - 1) * itemsPerPage;
        
        return {
            totalItems,
            currentPage,
            itemsPerPage,
            totalPages,
            offset,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        };
    }

    // Image upload validation
    static validateImageUpload(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Invalid file type. Only JPEG, PNG and GIF are allowed.' };
        }
        
        if (file.size > maxSize) {
            return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
        }
        
        return { valid: true };
    }

    // Generate file name
    static generateFileName(originalName) {
        const ext = originalName.split('.').pop();
        const timestamp = Date.now();
        const random = this.generateRandomString(8);
        return `${timestamp}-${random}.${ext}`;
    }
}

module.exports = Functions;

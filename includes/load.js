// Main loader - equivalent to load.php
const Database = require('./database');
const Functions = require('./functions');
const SQL = require('./sql');
const Session = require('./session');
const Upload = require('./upload');

// Configuration
require('dotenv').config();

// Global instances
const db = new Database();
const sql = new SQL();
const session = new Session();
const upload = new Upload();

// Constants
const UPLOAD_PATH = './public/uploads/';
const PRODUCTS_UPLOAD_PATH = UPLOAD_PATH + 'products/';
const USERS_UPLOAD_PATH = UPLOAD_PATH + 'users/';

// Error handling
const errors = [];

// Helper function to add errors
function addError(message) {
    errors.push(message);
}

// Helper function to get errors
function getErrors() {
    return errors;
}

// Helper function to clear errors
function clearErrors() {
    errors.length = 0;
}

// Display messages helper
function displayMsg(messages = []) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    
    return messages.map(msg => {
        if (typeof msg === 'object') {
            return Object.entries(msg).map(([type, message]) => 
                `<div class="alert alert-${type}">${message}</div>`
            ).join('');
        }
        return `<div class="alert alert-info">${msg}</div>`;
    }).join('');
}

// Redirect helper
function redirect(url, permanent = false) {
    const status = permanent ? 301 : 302;
    return { redirect: true, url, status };
}

// Page title helper
let pageTitle = 'Inventory Management System';

function setPageTitle(title) {
    pageTitle = title;
}

function getPageTitle() {
    return pageTitle;
}

// User level constants
const USER_LEVELS = {
    ADMIN: 1,
    SPECIAL: 2,
    USER: 3
};

// Status constants
const STATUS = {
    ACTIVE: 1,
    INACTIVE: 0
};

// Export everything
module.exports = {
    // Classes
    Database,
    Functions,
    SQL,
    Session,
    Upload,
    
    // Instances
    db,
    sql,
    session,
    upload,
    
    // Constants
    UPLOAD_PATH,
    PRODUCTS_UPLOAD_PATH,
    USERS_UPLOAD_PATH,
    USER_LEVELS,
    STATUS,
    
    // Helper functions
    addError,
    getErrors,
    clearErrors,
    displayMsg,
    redirect,
    setPageTitle,
    getPageTitle
};

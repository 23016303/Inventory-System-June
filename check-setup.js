console.log('🚀 Inventory Management System');
console.log('================================');
console.log('');
console.log('✅ Node.js application ready!');
console.log('');
console.log('📋 Quick Start Instructions:');
console.log('');
console.log('1. Make sure MySQL is running on your system');
console.log('2. Initialize database: npm run init-db');
console.log('3. Start server: npm start');
console.log('4. Open browser: http://localhost:3000');
console.log('');
console.log('🔐 Default Login Credentials:');
console.log('   Username: admin');
console.log('   Password: admin');
console.log('');
console.log('📁 Application Features:');
console.log('   • Dashboard with real-time stats');
console.log('   • Product management with images');
console.log('   • Category management');
console.log('   • Sales tracking');
console.log('   • User authentication');
console.log('   • Responsive design');
console.log('');
console.log('💡 Tip: Use start.bat for easy launching!');
console.log('');

// Test basic functionality
try {
    require('express');
    require('mysql2');
    require('dotenv');
    console.log('✅ All required packages are installed');
} catch (error) {
    console.log('❌ Missing packages. Run: npm install');
}

// Check if .env exists
const fs = require('fs');
if (fs.existsSync('.env')) {
    console.log('✅ Environment configuration found');
} else {
    console.log('❌ Missing .env file');
}

// Check if server.js exists
if (fs.existsSync('server.js')) {
    console.log('✅ Server file ready');
} else {
    console.log('❌ Server file missing');
}

console.log('');
console.log('🎯 Ready to go! Run the following commands:');
console.log('   npm run init-db  (first time only)');
console.log('   npm start        (start the server)');

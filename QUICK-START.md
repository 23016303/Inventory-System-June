# 🚀 Quick Start Guide - Inventory Management System

## Fix the "Unexpected token" Error

The error you're seeing means the server isn't running. Here's how to fix it and get logged in:

## Method 1: Quick Test (Recommended)

1. **Double-click** `start-test.bat` in the project folder
2. This will start a simple test server
3. Open your browser to `http://localhost:3000`
4. Login with:
   - **Username:** `admin`
   - **Password:** `admin`

## Method 2: Full Setup (Complete System)

### Step 1: Initialize Database
1. Make sure MySQL server is running
2. Double-click `setup.bat` in the project folder
3. Wait for "Database setup completed!" message

### Step 2: Start Full Server
1. Double-click `start.bat` in the project folder
2. Wait for "Server running on http://localhost:3000"

### Step 3: Login
1. Open `http://localhost:3000` in your browser
2. Use credentials: `admin` / `admin`

## Troubleshooting

### If you get "Cannot connect to server":
- Make sure you ran one of the start scripts above
- Check that nothing else is using port 3000
- Look for error messages in the command window

### If you get "Database connection error":
- Ensure MySQL is installed and running
- Check that MySQL is running on localhost with no password for root user
- Try the test server first (Method 1) which doesn't need database

### If login fails:
- Use exactly: `admin` and `admin` (case-sensitive)
- Clear your browser cache and try again
- Check the browser's developer console for error messages

## What Each File Does:

- `start-test.bat` - Simple test server (no database needed)
- `setup.bat` - Initialize the database with sample data
- `start.bat` - Start the full application server
- `test-server.js` - Simple server for testing login functionality

## Next Steps After Login:

Once logged in successfully, you'll have access to:
- Dashboard with statistics
- Product management
- Sales tracking
- User management
- Reports and analytics
- Media file management

The system is fully converted from PHP to JavaScript and ready to use!

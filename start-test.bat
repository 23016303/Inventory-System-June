@echo off
echo Starting Test Server for Inventory Management System...
echo.
echo This will start a simple test server to verify the login functionality.
echo.
echo Test Credentials:
echo Username: admin
echo Password: admin
echo.
echo Server will be available at: http://localhost:3000
echo.
pause
echo.
echo Starting test server...
node test-server.js

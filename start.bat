@echo off
echo Starting Inventory Management System...
echo.
echo Make sure MySQL is running before starting the server.
echo.
echo Default login credentials:
echo Username: admin
echo Password: admin
echo.
echo The application will be available at: http://localhost:3000
echo.
pause
echo.
echo Starting server...
node server.js

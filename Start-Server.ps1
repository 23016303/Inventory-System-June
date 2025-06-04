# Inventory Management System - Server Startup Script
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    Inventory Management System Startup      " -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Change to the project directory
$ProjectPath = "c:\Users\23016303\Downloads\C300\Inventory-System-June"
Set-Location $ProjectPath

Write-Host "Current Directory: $PWD" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
try {
    $NodeVersion = node --version
    Write-Host "Node.js Version: $NodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "1. Start Test Server (Simple, no database needed)" -ForegroundColor Cyan
Write-Host "2. Start Full Server (Requires database setup)" -ForegroundColor Cyan
Write-Host "3. Initialize Database First" -ForegroundColor Cyan
Write-Host ""

$Choice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($Choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Test Server..." -ForegroundColor Yellow
        Write-Host "Login with: admin / admin" -ForegroundColor Green
        Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        node test-server.js
    }
    "2" {
        Write-Host ""
        Write-Host "Starting Full Server..." -ForegroundColor Yellow
        Write-Host "Make sure database is initialized first!" -ForegroundColor Red
        Write-Host "Login with: admin / admin" -ForegroundColor Green
        Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        node server.js
    }
    "3" {
        Write-Host ""
        Write-Host "Initializing Database..." -ForegroundColor Yellow
        Write-Host "Make sure MySQL is running!" -ForegroundColor Red
        Write-Host ""
        node scripts\init-db.js
        Write-Host ""
        Write-Host "Database initialization completed!" -ForegroundColor Green
        Write-Host "Now you can start the full server (option 2)" -ForegroundColor Yellow
        Read-Host "Press Enter to continue"
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Script completed." -ForegroundColor Green

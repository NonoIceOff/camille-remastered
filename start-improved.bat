@echo off
title Camille Bot - Launcher
color 0A

echo ========================================
echo    CAMILLE BOT - LAUNCHER v2.0
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [!] node_modules not found!
    echo [*] Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [!] .env file not found!
    echo [*] Please create a .env file from .env.example
    echo [*] Copy .env.example to .env and fill in your values
    echo.
    pause
    exit /b 1
)

REM Check if config.js exists
if not exist "config.js" (
    echo [!] config.js not found!
    echo [*] Creating default config.js...
    (
        echo module.exports = {
        echo   TOKEN: process.env.DISCORD_TOKEN ^|^| "YOUR_TOKEN_HERE",
        echo   guildId: process.env.GUILD_ID ^|^| "YOUR_GUILD_ID",
        echo   clientId: process.env.CLIENT_ID ^|^| "YOUR_CLIENT_ID",
        echo   test: process.env.TEST_MODE === "true"
        echo };
    ) > config.js
    echo [*] config.js created. Please edit it with your values.
    echo.
)

echo [*] Starting bot...
echo ========================================
echo.

node main.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Bot crashed with error code %ERRORLEVEL%
    echo ========================================
    echo.
    pause
)

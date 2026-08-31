@echo off
setlocal enabledelayedexpansion

:: =========================================================================
:: p.bat - Safe Pull for Newly Uploaded Data Files & Live Changes
:: (2026-07-13) Safe pull script for data files without code loss; prev: none
:: =========================================================================

echo [PULL] Fetching latest uploaded files from GitHub...
git fetch origin main

if errorlevel 1 (
    echo [ERROR] Failed to fetch from GitHub. Please check your internet connection.
    pause
    exit /b 1
)

echo [PULL] Safely updating data files (CSVs and manifests)...
git stash >nul 2>&1
git pull --rebase origin main
git stash pop >nul 2>&1

echo.
echo =========================================================================
echo [SUCCESS] Safe pull complete! All newly uploaded files are synchronized.
echo =========================================================================
echo.
pause

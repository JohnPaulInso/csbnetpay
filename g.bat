@echo off
:: =============================================
:: g.bat - Quick GitHub Upload Script
:: Created: 2026-07-07
:: Usage: .\g  (from the SEARCH directory in PowerShell)
:: Function: Stages all changes, commits with a timestamped
::           message, and pushes to the main branch on GitHub.
:: Remote: https://github.com/JohnPaulInso/csbnetpay.git
:: =============================================

:: -- Element: commit message builder (auto-timestamp) --
:: Generates a commit message using the current date and time
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set TODAY=%%a %%b %%c %%d
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b

echo.
echo ============================================
echo  CSB NetPay - GitHub Auto-Upload
echo  %TODAY% %NOW%
echo ============================================
echo.

:: -- Step 1: Stage all changes --
echo [1/3] Staging all changes...
git add .

:: -- Step 2: Commit with auto-generated timestamp message --
echo [2/3] Committing...
git commit -m "Update: %TODAY% %NOW%"

:: -- Step 3: Push to GitHub main branch --
echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ============================================
echo  Done! Changes pushed to GitHub.
echo  https://github.com/JohnPaulInso/csbnetpay
echo ============================================
echo.
pause

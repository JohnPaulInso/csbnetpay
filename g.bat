@echo off
:: =============================================
:: g.bat - Quick GitHub Upload Script
:: Created: 2026-07-07
:: Updated: 2026-07-07 - Added optional custom commit message via %1 argument
:: Usage:
::   .\g                        -> commits with auto-timestamp
::   .\g "your commit message"  -> commits with your custom message
:: Function: Stages all changes, commits, and pushes to main branch on GitHub.
:: Remote: https://github.com/JohnPaulInso/csbnetpay.git
:: =============================================

:: -- Element: commit message builder --
:: Generates a fallback timestamp in case no message is passed
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set TODAY=%%a %%b %%c %%d
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b

:: -- Element: commitMsg - uses %~1 (first argument stripped of quotes) if provided --
:: Falls back to auto-timestamp if no argument was passed
if "%~1"=="" (
    set "commitMsg=Update: %TODAY% %NOW%"
) else (
    set "commitMsg=%~1"
)

echo.
echo ============================================
echo  CSB NetPay - GitHub Auto-Upload
echo  %TODAY% %NOW%
echo ============================================
echo.
echo  Commit: "%commitMsg%"
echo.

:: -- Step 1: Stage all changes --
echo [1/3] Generating available_files.json manifest...
node -e "const fs=require('fs'); const files=fs.readdirSync('.').filter(f => (f.startsWith('onq_') || f.startsWith('pli_')) && f.endsWith('.csv.gz')).map(f => f.slice(0, -3)); fs.writeFileSync('available_files.json', JSON.stringify(files));"

echo [1/3] Staging all changes...
git add .

:: -- Step 2: Commit with chosen message --
echo [2/3] Committing...
git commit -m "%commitMsg%"

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

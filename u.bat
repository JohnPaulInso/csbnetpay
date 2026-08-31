@echo off
:: =============================================
:: u.bat - Fast Automated Abstract Converter & GitHub Auto-Uploader
:: (2026-07-13) Automated abstract splitter and GitHub auto-uploader script
:: Usage:
::   .\u Abstract-8
::   .\u "Abstract 8-2026.xlsx"
::   .\u "7-2026 Abstract.xlsx"
::   .\u
:: =============================================

node "%~dp0convert_abstract.js" %*
pause

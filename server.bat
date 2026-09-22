@echo off
echo Starting local web server on http://localhost:8000
echo.
echo Open your browser to:
echo   http://localhost:8000/index6.html
echo   or
echo   http://localhost:8000/index6%%20backup.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000

@echo off
echo =======================================================
echo   Starting ChronoLog History Timeline Local Server
echo =======================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting ChronoLog Node server with Data Entry API on port 8000...
    start "" "http://localhost:8000/modern.html"
    echo.
    echo   Public Timeline:      http://localhost:8000/modern.html
    echo   Private Data Studio:  http://localhost:8000/editor.html
    echo.
    node server.js
    exit /b
)

:: Check for Python fallback
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Python HTTP server on port 8000...
    start "" "http://localhost:8000/modern.html"
    python -m http.server 8000
    exit /b
)

echo Opening directly in browser...
start "" "modern.html"
pause

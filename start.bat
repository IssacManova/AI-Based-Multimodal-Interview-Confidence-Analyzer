@echo off
echo ============================================
echo   Interview Analyzer - Starting Servers
echo ============================================

echo.
echo [1/2] Starting FastAPI Backend (port 8000)...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0Interview-Emotion-Analyzer" && python api_server.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Frontend (port 5173)...
start "Frontend - Vite" cmd /k "cd /d "%~dp0interview-analyzer-ui" && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
pause

@echo off
REM ============================================================
REM Panaceon Development Startup Script
REM Starts backend with venv and frontend together
REM ============================================================

echo.
echo ============================================================
echo   Panaceon Development Environment Startup
echo ============================================================
echo.

REM Check if Docker is running and postgres container exists
echo [1/4] Checking Docker PostgreSQL...
docker ps --filter "name=multitenant-postgres" --format "{{.Status}}" 2>nul | findstr /i "Up" >nul
if %ERRORLEVEL% neq 0 (
    echo      Starting PostgreSQL container...
    cd /d "%~dp0"
    docker-compose up -d multitenant-postgres
    timeout /t 5 /nobreak >nul
) else (
    echo      PostgreSQL is running
)

REM Activate venv and check if reseed needed
echo.
echo [2/4] Preparing Backend...
cd /d "%~dp0Backend"

REM Kill any existing Python processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo      Using virtual environment: %~dp0Backend\venv

REM Optionally reseed (uncomment if you want to reseed on every start)
REM echo      Reseeding database...
REM echo yes | "%~dp0Backend\venv\Scripts\python.exe" seed_data.py

echo.
echo [3/4] Starting Backend Server...
start "Panaceon Backend" cmd /k "cd /d %~dp0Backend && %~dp0Backend\venv\Scripts\python.exe -m uvicorn main:app --reload --host localhost --port 8000"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Frontend Server...
cd /d "%~dp0Frontend"
start "Panaceon Frontend" cmd /k "cd /d %~dp0Frontend && pnpm dev"

echo.
echo ============================================================
echo   Servers Started Successfully!
echo ============================================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Sample Login Credentials:
echo   -------------------------
echo   Username: admin       Password: Admin123
echo   Username: coder1      Password: Coder123
echo   Username: billing1    Password: Billing123
echo.
echo   Press any key to exit this window...
pause >nul

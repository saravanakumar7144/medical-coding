@echo off
echo ========================================
echo Starting Panaceon Backend Server
echo ========================================

cd Backend

echo.
echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Checking environment file...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    echo Command: copy .env.example .env
    pause
    exit /b 1
)

echo.
echo Starting Uvicorn server...
echo Backend will run on http://localhost:8000
echo Press CTRL+C to stop
echo.

uvicorn main:app --reload --host localhost --port 8000

pause

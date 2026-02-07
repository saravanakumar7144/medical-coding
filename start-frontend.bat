@echo off
echo ========================================
echo Starting Panaceon Frontend Server
echo ========================================

cd Frontend

echo.
echo Checking environment file...
if not exist .env (
    echo Creating .env file...
    echo VITE_API_URL=http://localhost:8000 > .env
    echo .env file created with default settings
)

echo.
echo Installing dependencies (if needed)...
call npm install

echo.
echo Starting Vite development server...
echo Frontend will run on http://localhost:3000
echo Press CTRL+C to stop
echo.

call npm run dev

pause

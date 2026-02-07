@echo off
echo ========================================
echo Panaceon Environment Setup
echo ========================================

echo.
echo Setting up Backend environment file...
cd Backend

if exist .env (
    echo .env already exists in Backend folder
    echo Do you want to overwrite it? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        copy .env.example .env
        echo Backend .env file created from template
    ) else (
        echo Keeping existing .env file
    )
) else (
    copy .env.example .env
    echo Backend .env file created from template
)

echo.
echo IMPORTANT: Edit Backend\.env and configure:
echo  1. DATABASE_URL (PostgreSQL connection)
echo  2. JWT_SECRET_KEY (generate new random key)
echo  3. ENCRYPTION_KEY (generate new random key)
echo  4. SMTP_USER and SMTP_PASSWORD (Gmail credentials)
echo.

cd ..

echo.
echo Setting up Frontend environment file...
cd Frontend

if exist .env (
    echo .env already exists in Frontend folder
) else (
    echo VITE_API_URL=http://localhost:8000 > .env
    echo Frontend .env file created
)

cd ..

echo.
echo ========================================
echo Environment setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit Backend\.env with your configuration
echo 2. Run start-backend.bat
echo 3. Run start-frontend.bat (in a new terminal)
echo.

pause

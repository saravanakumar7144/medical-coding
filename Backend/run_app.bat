@echo off
echo Medical Coding AI Assistant - Starting Application
echo ================================================

cd /d "j:\Company\amasQIS\AI\Medical Coding AI implementation"

echo Running environment check and fix...
python fix_environment.py

echo Checking if Ollama is running...
curl -s http://localhost:11434/api/tags > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Ollama server not detected on localhost:11434
    echo Please start Ollama and pull the llama3.2:3b-instruct-q4_0 model first:
    echo.
    echo   ollama serve
    echo   ollama pull llama3.2:3b-instruct-q4_0
    echo.
    echo Press any key to continue anyway...
    pause > nul
)

echo Starting Streamlit application...
echo.
echo Access the application at: http://localhost:8501
echo.

streamlit run medical_coding_ai\ui\streamlit_app.py --server.port=8501 --server.address=localhost

echo.
echo Application stopped. Press any key to exit...
pause > nul

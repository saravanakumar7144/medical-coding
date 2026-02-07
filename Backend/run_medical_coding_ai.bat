@echo off
echo Starting Medical Coding AI System...
cd /d "%~dp0"
streamlit run medical_coding_ai/ui/streamlit_app.py --server.port 8501
pause

#!/usr/bin/env python3
"""
Medical Coding AI - Application Launcher
Proper production launcher for the Medical Coding AI system.
"""

import os
import sys
import subprocess
import logging

def setup_logging():
    """Setup logging for the launcher"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def check_environment():
    """Check if the environment is properly set up"""
    logger = logging.getLogger(__name__)
    
    # Check if we're in a virtual environment
    venv_path = os.path.join(os.getcwd(), '.venv')
    if not os.path.exists(venv_path):
        logger.error("Virtual environment not found. Please run setup.py first.")
        return False
    
    # Check Python executable
    if sys.platform == "win32":
        python_exe = os.path.join(venv_path, 'Scripts', 'python.exe')
    else:
        python_exe = os.path.join(venv_path, 'bin', 'python')
    
    if not os.path.exists(python_exe):
        logger.error(f"Python executable not found at {python_exe}")
        return False
    
    return True

def test_imports():
    """Test critical imports"""
    logger = logging.getLogger(__name__)
    
    try:
        # Test pdfplumber specifically since it was causing issues
        import pdfplumber
        logger.info("✓ pdfplumber imported successfully")
        
        # Test other critical imports
        import streamlit
        import pandas
        import plotly
        logger.info("✓ All critical imports successful")
        
        return True
    except ImportError as e:
        logger.error(f"✗ Import error: {e}")
        return False

def launch_streamlit():
    """Launch the Streamlit application"""
    logger = logging.getLogger(__name__)
    
    app_path = os.path.join('medical_coding_ai', 'ui', 'streamlit_app.py')
    
    if not os.path.exists(app_path):
        logger.error(f"Streamlit app not found at {app_path}")
        return False
    
    try:
        # Get Python executable path
        if sys.platform == "win32":
            python_exe = os.path.join('.venv', 'Scripts', 'python.exe')
        else:
            python_exe = os.path.join('.venv', 'bin', 'python')
        
        # Launch Streamlit
        cmd = [python_exe, '-m', 'streamlit', 'run', app_path, '--server.port', '8501']
        
        logger.info("Starting Medical Coding AI application...")
        logger.info(f"Command: {' '.join(cmd)}")
        logger.info("The application will open in your browser at http://localhost:8501")
        
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start application: {e}")
        return False
    except KeyboardInterrupt:
        logger.info("Application stopped by user")
        return True
    
    return True

def main():
    """Main application launcher"""
    logger = setup_logging()
    
    logger.info("=== Medical Coding AI Launcher ===")
    
    # Check environment
    if not check_environment():
        logger.error("Environment check failed. Exiting.")
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        logger.error("Import test failed. Please check your installation.")
        sys.exit(1)
    
    # Launch the application
    success = launch_streamlit()
    
    if not success:
        logger.error("Failed to launch application")
        sys.exit(1)
    
    logger.info("Application launched successfully")

if __name__ == "__main__":
    main()

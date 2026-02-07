#!/usr/bin/env python3
"""
Medical Coding AI - Setup and Installation Script
This script helps set up the medical coding AI system with all necessary components.
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

def print_header():
    """Print setup header"""
    print("=" * 60)
    print("🏥 MEDICAL CODING AI SYSTEM SETUP")
    print("=" * 60)
    print()

def check_python_version():
    """Check if Python version is compatible"""
    print("🔍 Checking Python version...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required!")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} - Compatible")
    return True

def install_requirements():
    """Install Python requirements"""
    print("\n📦 Installing Python packages...")
    
    requirements_file = "requirements.txt"
    if not os.path.exists(requirements_file):
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", requirements_file
        ])
        print("✅ All packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False

def check_ollama():
    """Check if Ollama is installed and running"""
    print("\n🤖 Checking Ollama installation...")
    
    # Check if ollama command exists
    if shutil.which("ollama") is None:
        print("❌ Ollama not found!")
        print("   Please install Ollama from: https://ollama.ai/")
        print("   After installation, run: ollama pull llama3.1:8b")
        return False
    
    print("✅ Ollama found")
    
    # Check if service is running
    try:
        subprocess.check_output(["ollama", "list"], stderr=subprocess.STDOUT)
        print("✅ Ollama service is running")
        
        # Check for recommended model
        try:
            result = subprocess.check_output(["ollama", "list"], text=True)
            if "llama3.1:8b" in result:
                print("✅ Llama 3.1 8B model is available")
            else:
                print("⚠️ Recommended model not found")
                print("   Run: ollama pull llama3.1:8b")
        except:
            pass
            
        return True
    except subprocess.CalledProcessError:
        print("❌ Ollama service not running")
        print("   Start Ollama service and try again")
        return False

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating directory structure...")
    
    directories = [
        "medical_coding_ai/data/knowledge_base",
        "medical_coding_ai/data/vector_stores",
        "medical_coding_ai/logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")
    
    return True

def create_sample_knowledge_files():
    """Create sample knowledge base files if PDFs don't exist"""
    print("\n📚 Checking knowledge base files...")
    
    kb_dir = Path("medical_coding_ai/data/knowledge_base")
    
    files_to_check = ["icd10.pdf", "cpt.pdf", "hcpcs.pdf"]
    missing_files = []
    
    for file in files_to_check:
        file_path = kb_dir / file
        if not file_path.exists():
            missing_files.append(file)
        else:
            print(f"✅ Found: {file}")
    
    if missing_files:
        print("\n⚠️ Missing knowledge base files:")
        for file in missing_files:
            print(f"   - {file}")
        
        print("\n📝 The system will use sample data for missing files.")
        print("   To use full functionality, place your PDF files in:")
        print(f"   {kb_dir.absolute()}")
    else:
        print("✅ All knowledge base files found")
    
    return True

def test_imports():
    """Test if all modules can be imported"""
    print("\n🔧 Testing module imports...")
    
    try:
        sys.path.append("medical_coding_ai")
        
        from agents.base_agent import BaseAgent
        print("✅ Base agent imported")
        
        from agents.icd10_agent import ICD10Agent
        print("✅ ICD-10 agent imported")
        
        from agents.cpt_agent import CPTAgent
        print("✅ CPT agent imported")
        
        from agents.hcpcs_agent import HCPCSAgent
        print("✅ HCPCS agent imported")
        
        from agents.master_agent import MasterAgent
        print("✅ Master agent imported")
        
        from utils.document_processor import DocumentProcessor
        print("✅ Document processor imported")
        
        from utils.code_searcher import CodeSearcher
        print("✅ Code searcher imported")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def create_run_script():
    """Create a run script for easy startup"""
    print("\n📜 Creating run script...")
    
    if platform.system() == "Windows":
        script_content = """@echo off
echo Starting Medical Coding AI System...
cd /d "%~dp0"
streamlit run medical_coding_ai/ui/streamlit_app.py --server.port 8501
pause
"""
        script_name = "run_medical_coding_ai.bat"
    else:
        script_content = """#!/bin/bash
echo "Starting Medical Coding AI System..."
cd "$(dirname "$0")"
streamlit run medical_coding_ai/ui/streamlit_app.py --server.port 8501
"""
        script_name = "run_medical_coding_ai.sh"
    
    try:
        with open(script_name, "w") as f:
            f.write(script_content)
        
        if platform.system() != "Windows":
            os.chmod(script_name, 0o755)
        
        print(f"✅ Created: {script_name}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating run script: {e}")
        return False

def run_setup():
    """Run the complete setup process"""
    print_header()
    
    success = True
    
    # Check Python version
    if not check_python_version():
        success = False
    
    # Install requirements
    if success and not install_requirements():
        success = False
    
    # Check Ollama
    if success and not check_ollama():
        print("⚠️ Ollama issues detected - some AI features may not work")
    
    # Create directories
    if success and not create_directories():
        success = False
    
    # Check knowledge base files
    if success and not create_sample_knowledge_files():
        success = False
    
    # Test imports
    if success and not test_imports():
        success = False
    
    # Create run script
    if success and not create_run_script():
        success = False
    
    # Final message
    print("\n" + "=" * 60)
    if success:
        print("🎉 SETUP COMPLETED SUCCESSFULLY!")
        print("\n📋 Next steps:")
        print("1. Ensure Ollama is running: ollama serve")
        print("2. Pull the AI model: ollama pull llama3.1:8b")
        print("3. Place your PDF knowledge bases in: medical_coding_ai/data/knowledge_base/")
        print("4. Run the system:")
        
        if platform.system() == "Windows":
            print("   - Double-click: run_medical_coding_ai.bat")
        else:
            print("   - Run: ./run_medical_coding_ai.sh")
        
        print("   - Or manually: streamlit run medical_coding_ai/ui/streamlit_app.py")
        print("\n🌐 The system will open in your browser at: http://localhost:8501")
    else:
        print("❌ SETUP FAILED!")
        print("Please resolve the issues above and run setup again.")
    
    print("=" * 60)

if __name__ == "__main__":
    run_setup()

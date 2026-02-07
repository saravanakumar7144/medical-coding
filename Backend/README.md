# 🏥 Medical Coding AI Assistant

## Recent Improvements

### Code Search Enhancements

- **🔄 Latest Knowledge Base**: Code search now uses the latest processed knowledge base
- **🧠 Smart Reloading**: System automatically detects and uses newly processed PDFs
- **🧪 Comprehensive Testing**: Added dedicated test scripts for code search validation
- See [CODE_SEARCH_IMPROVEMENTS.md](CODE_SEARCH_IMPROVEMENTS.md) for details

## 🚀 Features

### Core Functionality

- **📄 Document Processing**: Upload and process medical documents (PDF)
- **🤖 AI-Powered Analysis**: Multi-agent system for specialized coding
- **🔍 Code Suggestions**: Top 3 suggestions per coding system with confidence scores
- **✅ Code Verification**: Master agent validates code appropriateness
- **❌ Error Analysis**: Identifies conflicts and provides recommendations
- **📊 Interactive Dashboard**: Comprehensive analytics and insights
- **💾 Export Options**: CSV, Excel, and detailed reports

### Technical Features

- **Multi-Agent Architecture**: Specialized agents for ICD-10, CPT, and HCPCS
- **RAG Integration**: Vector search across medical knowledge bases
- **Data Anonymization**: Automatic PII masking and protection
- **Local AI Processing**: Uses Ollama for privacy and control
- **Modern UI**: Streamlit-based interface with real-time updates

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Medical Coding AI System                 │
├─────────────────────────────────────────────────────────────┤
│                     Streamlit UI Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Master Agent  │  ICD-10 Agent  │  CPT Agent  │ HCPCS Agent │
├─────────────────────────────────────────────────────────────┤
│              Document Processor & Anonymizer               │
├─────────────────────────────────────────────────────────────┤
│                 Vector Store (FAISS)                       │
├─────────────────────────────────────────────────────────────┤
│                Knowledge Base (PDFs)                       │
├─────────────────────────────────────────────────────────────┤
│                   Ollama (Local LLM)                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux

### Required Software

1. **Python 3.8+** with pip
2. **Ollama** - Local LLM runtime
3. **Git** (optional, for cloning)

## 🛠️ Installation

### Option 1: Automated Setup (Recommended)

1. **Clone or Download the Project**

   ```bash
   git clone <repository-url>
   cd "Medical Coding AI implementation"
   ```
2. **Run the Setup Script**

   ```bash
   python setup.py
   ```

   The setup script will:

   - Check Python version compatibility
   - Install all required packages
   - Verify Ollama installation
   - Create necessary directories
   - Test all modules
   - Create run scripts
3. **Follow Setup Instructions**
   The setup will guide you through any additional steps needed.

### Option 2: Manual Setup

1. **Install Python Dependencies**

   ```bash
   pip install -r requirements.txt
   ```
2. **Install and Configure Ollama**

   **Windows:**

   - Download from: https://ollama.ai/
   - Install and run the installer
   - Open Command Prompt and run:
     ```bash
     ollama serve
     ollama pull llama3.2:3b-instruct-q4_0
     ```

   **macOS:**

   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh

   # Start service and pull model
   ollama serve
   ollama pull llama3.2:3b-instruct-q4_0
   ```

   **Linux:**

   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh

   # Start service and pull model
   ollama serve
   ollama pull llama3.2:3b-instruct-q4_0
   ```
3. **Verify Installation**

   ```bash
   ollama list
   ```

   You should see `llama3.1:8b` in the list.

## 📚 Knowledge Base Setup

### Option 1: Using Your Own PDFs (Recommended for Production)

1. **Obtain Medical Coding PDFs**

   - ICD-10-CM Official Guidelines
   - CPT Professional Edition
   - HCPCS Level II Codes
2. **Place PDFs in Knowledge Base Directory**

   ```
   medical_coding_ai/
   └── data/
       └── knowledge_base/
           ├── icd10.pdf    # ICD-10 codes and descriptions
           ├── cpt.pdf      # CPT codes and descriptions
           └── hcpcs.pdf    # HCPCS codes and descriptions
   ```
3. **Update Configuration** (if needed)
   Edit `medical_coding_ai/config.yaml` to point to your PDF files.

### Option 2: Using Sample Data (For Testing)

The system includes sample codes for testing. No additional setup required.

## 🚀 Running the System

### Option 1: Using Run Scripts (Easiest)

**Windows:**

```bash
# Double-click the file or run in Command Prompt
start_medical_coding_ai.bat
```

**macOS/Linux:**

```bash
./run_app.sh
```

### Option 2: Manual Startup

1. **Start Ollama** (if not running)

   ```bash
   ollama serve
   ```
2. **Start the Application**

   ```bash
   streamlit run medical_coding_ai/ui/streamlit_app.py
   ```
3. **Open Your Browser**
   Navigate to: http://localhost:8501

## 📖 User Guide

### Step 1: Document Upload

1. Click **"📤 Upload"** tab
2. Select a PDF medical document
3. Click **"🔍 Process Document"**
4. Review the anonymized patient summary

### Step 2: AI Analysis

1. Click **"🤖 Analysis"** tab
2. Click **"Run AI Analysis"**
3. Review analysis results and code suggestions
4. Add suggested codes to your selection

### Step 3: Code Search & Management

1. Click **"🔍 Search"** tab
2. Search for additional codes by:
   - Code number (e.g., "Z96669")
   - Description (e.g., "artificial ankle joint")
3. Add relevant codes to your selection
4. Manage selected codes

### Step 4: Verification

1. Click **"✅ Verify"** tab
2. Click **"Verify All Codes"**
3. Review verification results
4. Address any flagged issues

### Step 5: Dashboard & Analytics

1. Click **"📊 Dashboard"** tab
2. Review coding session analytics
3. Check quality metrics and recommendations

### Step 6: Export Results

1. Click **"💾 Export"** tab
2. Review final code list
3. Download as CSV or Excel
4. Generate summary reports

## ⚙️ Configuration

### Main Configuration File: `medical_coding_ai/config.yaml`

```yaml
# Ollama Configuration
ollama:
  model_name: "llama3.1:8b"
  base_url: "http://localhost:11434"
  timeout: 120

# Vector Store Settings
vector_store:
  dimension: 384
  similarity_threshold: 0.7
  max_results: 15

# Knowledge Base Paths
knowledge_base:
  icd10_path: "data/knowledge_base/icd10.pdf"
  cpt_path: "data/knowledge_base/cpt.pdf"
  hcpcs_path: "data/knowledge_base/hcpcs.pdf"
  chunk_size: 1000
  chunk_overlap: 200

# Data Anonymization
anonymization:
  mask_names: true
  mask_contacts: true
  mask_addresses: true
  mask_ids: true

# Agent Settings
agents:
  confidence_threshold: 60
  max_suggestions: 3
  context_window: 2000
```

## 🛟 Troubleshooting

### Common Issues

**1. "Import Error" when starting**

- **Solution**: Run `python setup.py` to verify all dependencies
- Check Python version: `python --version` (must be 3.8+)

**2. "Ollama not found" error**

- **Solution**: Install Ollama from https://ollama.ai/
- Verify installation: `ollama --version`

**3. "Model not found" error**

- **Solution**: Pull the required model: `ollama pull llama3.1:8b`
- Check available models: `ollama list`

**4. Slow processing or timeouts**

- **Solution**: Ensure sufficient RAM (8GB+)
- Try smaller document chunks in config
- Use a smaller model if needed: `ollama pull llama3.1:7b`

**5. PDF processing errors**

- **Solution**: Ensure PDFs contain readable text (not just images)
- Try converting scanned PDFs to text-searchable format

**6. Knowledge base not loading**

- **Solution**: Check PDF file paths in `config.yaml`
- Ensure PDF files are in correct directory
- System will use sample data if PDFs not found

### Getting Help

1. **Check Logs**: Look for detailed error messages in the console
2. **Verify Setup**: Run `python setup.py` again
3. **Test Components**: Try each module individually
4. **Check System Resources**: Ensure adequate RAM and storage

## 🔧 Development

### Project Structure

```
medical_coding_ai/
├── agents/                 # AI agents for different coding systems
│   ├── base_agent.py      # Base agent class with RAG functionality
│   ├── icd10_agent.py     # ICD-10 specialist agent
│   ├── cpt_agent.py       # CPT specialist agent
│   ├── hcpcs_agent.py     # HCPCS specialist agent
│   └── master_agent.py    # Master orchestration agent
├── utils/                  # Utility modules
│   ├── document_processor.py    # PDF processing and data extraction
│   ├── data_anonymizer.py       # PII anonymization
│   ├── vector_store.py          # FAISS vector store management
│   ├── pdf_processor.py         # PDF knowledge base processing
│   └── code_searcher.py         # Code search functionality
├── ui/                     # User interface
│   └── streamlit_app.py    # Main Streamlit application
├── data/                   # Data storage
│   ├── knowledge_base/     # PDF knowledge bases
│   └── vector_stores/      # Vector embeddings
├── config.yaml            # System configuration
└── requirements.txt       # Python dependencies
```

### Key Components

**1. Multi-Agent System**

- Each agent specializes in one coding system (ICD-10, CPT, HCPCS)
- Master agent orchestrates and validates across systems
- RAG integration for knowledge-based suggestions

**2. Document Processing Pipeline**

- PDF text extraction with pdfplumber
- Automatic PII anonymization
- Medical information extraction using regex patterns
- Document type classification

**3. Vector Store Integration**

- FAISS for fast similarity search
- Sentence transformers for embeddings
- Metadata-aware search and retrieval

**4. Code Verification System**

- Cross-validation between coding systems
- Conflict detection and resolution
- Confidence scoring and quality assessment

## 🧪 Testing

### System Tests

To verify the system is working properly:

```bash
python test_system.py
```

This checks all imports, configurations, and key components.

### Code Search Tests

To verify code search functionality:

```bash
python test_code_search.py
```

This tests the code search with different queries and verifies it uses the latest knowledge base.

## 📊 Sample Data

The system includes sample medical codes for testing:

**ICD-10 Samples:**

- Z96.669: Presence of unspecified artificial ankle joint
- E11.9: Type 2 diabetes mellitus without complications
- I10: Essential hypertension

**CPT Samples:**

- 99213: Office visit, established patient, level 3
- 12001: Simple repair of superficial wounds
- 71020: Chest X-ray, 2 views

**HCPCS Samples:**

- L3000: Foot insert, removable, molded to patient model
- K0001: Standard wheelchair
- A4206: Syringe with needle, sterile, 1 cc or less

## 🔒 Privacy & Security

### Data Protection

- **Local Processing**: All AI processing happens locally via Ollama
- **Automatic Anonymization**: PII is masked before processing
- **No External APIs**: No data sent to third-party services
- **Secure Storage**: Local file system storage only

### Anonymization Process

- **Names**: Replaced with `[PATIENT_NAME]`
- **Contact Numbers**: Replaced with `[CONTACT_XXX]`
- **IDs**: Replaced with `[ID_XXX]`
- **Addresses**: Replaced with `[ADDRESS]`

## 📈 Performance Tips

### Optimization

1. **Use adequate RAM** (16GB recommended for large documents)
2. **Place PDFs on SSD** for faster knowledge base loading
3. **Adjust chunk size** in config for large documents
4. **Use GPU acceleration** if available with Ollama

### Scaling

- **Batch Processing**: Process multiple documents in sequence
- **Model Selection**: Use larger models for better accuracy
- **Knowledge Base Updates**: Replace PDFs to update knowledge
- **Configuration Tuning**: Adjust thresholds based on accuracy needs

## 📝 License

This project is for educational and research purposes. Ensure compliance with medical coding guidelines and regulations in your jurisdiction.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:

1. Check this README for common solutions
2. Review the troubleshooting section
3. Check system logs for error details
4. Verify all prerequisites are met

---

**🏥 Medical Coding AI Assistant** - Empowering accurate medical coding with AI technology.

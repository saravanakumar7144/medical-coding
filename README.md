# 🏥 Medical Coding AI Assistant

An intelligent medical coding platform that combines AI-powered analysis with multi-agent systems to provide accurate ICD-10, CPT, and HCPCS code suggestions from medical documents.

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
- **Dual Interface**: Both Streamlit UI and FastAPI backend

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Medical Coding AI System                 │
├─────────────────────────────────────────────────────────────┤
│           Frontend (Next.js) + Backend (FastAPI)           │
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
- **Node.js**: 18+ (for frontend)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux

### Required Software

1. **Python 3.8+** with pip
2. **Ollama** - Local LLM runtime
3. **Node.js 18+** (for frontend)
4. **Git** (optional, for cloning)

## 🛠️ Installation

### Step 1: Install Ollama

**Windows:**

```bash
# Download from: https://ollama.ai/
# Install and run the installer
# Open Command Prompt and run:
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

### Step 2: Setup Backend

1. **Navigate to Backend Directory**

   ```bash
   cd "Medical Coding/Backend"
   ```
2. **Install Python Dependencies create a venv** 

   ```bash
   pip install -r requirements.txt
   ```
3. **Run Setup Script (Optional)**

   ```bash
   python setup.py
   ```

### Step 3: Setup Frontend 

1. **Navigate to Frontend Directory**

   ```bash
   cd "Medical Coding/Frontend"
   ```
2. **Install Dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

## 🚀 Running the System

### Option 1: Backend Only (Streamlit Interface)

**Windows:**

```bash
# Double-click the file or run in Command Prompt
start_medical_coding_ai.bat
```

**Manual Start:**

```bash
cd Backend
streamlit run medical_coding_ai/ui/app.py --server.port=8501
```

Access at: **http://localhost:8501**

### Option 2: FastAPI Backend + Next.js Frontend

**Start Backend:**

```bash
cd Backend
python main.py
# or
uvicorn main:app --port 8000
```

**Start Frontend:**

```bash
cd Frontend
npm run dev
# or
pnpm dev
```

**Access Points:**

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8000**
- API Docs: **http://localhost:8000/docs**

## ⚙️ Configuration

### Main Configuration Files

**Backend Configuration: `Backend/config.yaml`**

```yaml
# Ollama Configuration
ollama:
  model_name: "llama3.2:3b-instruct-q4_0"  # Change AI model here
  base_url: "http://localhost:11434"
  timeout: 120

# Vector Store Settings
vector_store:
  dimension: 384
  similarity_threshold: 0.7
  max_results: 15

# Knowledge Base Paths
knowledge_base:
  pdf_source_directory: "knowledge_base_pdfs"
  icd10_path: "knowledge_base_pdfs/icd10.pdf"
  cpt_path: "knowledge_base_pdfs/cpt.pdf"
  hcpcs_path: "knowledge_base_pdfs/hcpcs.pdf"
  chunk_size: 1000
  chunk_overlap: 200
  update_on_startup: false
  auto_process_on_startup: false

# Data Anonymization
anonymization:
  mask_names: true
  mask_contacts: true
  mask_addresses: true
  mask_ids: true
  placeholder_name: "[PATIENT_NAME]"
  placeholder_contact: "[CONTACT_XXX]"
  placeholder_id: "[ID_XXX]"
  placeholder_address: "[ADDRESS]"

# Agent Settings
agents:
  confidence_threshold: 60
  max_suggestions: 3
  context_window: 2000

# UI Settings
ui:
  theme: "light"
  page_title: "Medical Coding AI Assistant"
  page_icon: "🏥"
  layout: "wide"
```

### 🔄 Changing the AI Model

To use a different AI model:

1. **Pull the new model with Ollama: - Based on your system configuration**

   ```bash
   ollama pull llama3.1:8b
   # or
   ollama pull codellama:13b
   # or
   ollama pull mistral:7b
   ```
2. **Update configuration files:**

   - `Backend/config.yaml`
   - `Backend/medical_coding_ai/config.yaml`

   Change the `model_name` field:

   ```yaml
   ollama:
     model_name: "llama3.1:8b"  # Your new model
   ```
3. **Restart the application**

**Available Models:**

- `llama3.2:3b-instruct-q4_0` (Default - Fast, lower resource)
- `llama3.1:8b` (Better accuracy, more resources)
- `codellama:13b` (Code-focused model)
- `mistral:7b` (Alternative general model)

## 📚 Knowledge Base Setup

### Using Your Own PDFs (Recommended for Production)

1. **Obtain Medical Coding PDFs:**

   - ICD-10-CM Official Guidelines
   - CPT Professional Edition
   - HCPCS Level II Codes
2. **Place PDFs in Knowledge Base Directory:**

   ```
   Backend/knowledge_base_pdfs/
   ├── icd10.pdf
   ├── cpt.pdf
   └── hcpcs.pdf
   ```
3. **Update Configuration** (if needed):
   Edit `Backend/config.yaml` to point to your PDF files.

## 🧠 AI Prompt Templates

The system uses specialized prompt templates for each coding agent. These can be found and modified in:

### ICD-10 Agent Prompts

**Location:** `Backend/medical_coding_ai/agents/icd10_agent.py`

**Document Analysis Prompt (Lines 44-69):**

```python
prompt = f"""
Analyze this medical document for ICD-10 coding opportunities. Focus on:

1. PRIMARY DIAGNOSIS - The main condition requiring treatment
2. SECONDARY DIAGNOSES - Additional conditions affecting care
3. COMPLICATIONS - Any complications that arose
4. COMORBIDITIES - Existing conditions affecting treatment
5. SIGNS AND SYMPTOMS - Clinical presentations requiring coding

Document excerpt: {document_excerpt}

Extracted conditions: {conditions}
Extracted symptoms: {symptoms}
Extracted diagnoses: {diagnoses}

Provide a structured analysis focusing on:
- Most significant diagnostic findings
- Conditions that would impact medical coding
- Any chronic vs acute conditions
- Severity indicators

Be specific about which conditions require ICD-10 codes and why.
"""
```

### CPT Agent Prompts

**Location:** `Backend/medical_coding_ai/agents/cpt_agent.py`

**Document Analysis Prompt (Lines 45-72):**

```python
prompt = f"""
Analyze this medical document for CPT coding opportunities. Focus on:

1. PROCEDURES PERFORMED - Surgical or diagnostic procedures
2. SERVICES PROVIDED - Medical services and consultations
3. TREATMENTS ADMINISTERED - Therapeutic interventions
4. OFFICE VISITS - Evaluation and management services
5. DIAGNOSTIC TESTS - Laboratory, imaging, or other tests

Document excerpt: {document_excerpt}

Extracted procedures: {procedures}
Extracted services: {services}
Extracted treatments: {treatments}
Extracted visits: {visits}

Provide a structured analysis focusing on:
- Billable procedures and services
- Level of complexity for E&M codes
- Any surgical interventions
- Diagnostic procedures performed
- Time-based services

Be specific about which procedures/services require CPT codes and their complexity level.
"""
```

### HCPCS Agent Prompts

**Location:** `Backend/medical_coding_ai/agents/hcpcs_agent.py`

**Document Analysis Prompt (Lines 46-74):**

```python
prompt = f"""
Analyze this medical document for HCPCS coding opportunities. Focus on:

1. DURABLE MEDICAL EQUIPMENT (DME) - Wheelchairs, walkers, oxygen equipment
2. PROSTHETICS AND ORTHOTICS - Artificial limbs, braces, supports
3. MEDICAL SUPPLIES - Disposable items, wound care supplies
4. AMBULANCE SERVICES - Emergency transport
5. NON-PHYSICIAN SERVICES - Physical therapy, social services
6. DRUGS AND BIOLOGICALS - Injectable medications, vaccines

Document excerpt: {document_excerpt}

Extracted equipment: {equipment}
Extracted supplies: {supplies}
Extracted prosthetics: {prosthetics}
Extracted ambulance services: {ambulance}
Extracted other services: {other_services}

Provide a structured analysis focusing on:
- Items requiring HCPCS codes
- Equipment rentals vs purchases
- Medical necessity documentation
- Supplier requirements

Be specific about which items/services require HCPCS codes and their medical necessity.
"""
```

### Master Agent Verification Prompt

**Location:** `Backend/medical_coding_ai/agents/master_agent.py`

**Code Verification Prompt (Lines 365-395):**

```python
prompt = f"""
As a medical coding expert, verify if this code is appropriate for the patient document.

CODE DETAILS:
- Code: {code_value}
- Description: {code_description}
- Type: {agent_type}
- AI Confidence: {original_confidence:.0%}
- Reasoning: {code.get('reasoning', 'Not provided')}

PATIENT DOCUMENT:
{anonymized_text}

VERIFICATION CRITERIA:
1. Is the code clinically appropriate for the documented condition/procedure?
2. Is there sufficient documentation to support this code?
3. Does the code accurately represent what is documented?
4. Are there any coding conflicts or contraindications?

Based on your expert analysis, provide:
- APPROPRIATE: Yes or No
- CONFIDENCE: Rate 0-100 (how confident you are in this verification)
- CONCERNS: Any specific concerns or issues (or "None" if no concerns)
- RECOMMENDATIONS: Specific recommendations (or "Code approved as documented")

Respond in this exact format:
APPROPRIATE: [Yes/No]
CONFIDENCE: [0-100]
CONCERNS: [Your concerns or "None"]
RECOMMENDATIONS: [Your recommendations]
"""
```

### Base Agent System Prompt

**Location:** `Backend/medical_coding_ai/agents/base_agent.py`

**System Message (Lines 106-110):**

```python
{
    'role': 'system', 
    'content': f'You are a medical coding specialist focusing on {self.agent_type} codes. Provide accurate, evidence-based coding suggestions with confidence scores.'
}
```

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

### Step 5: Export

1. Click **"📊 Export"** tab
2. Choose format (CSV, Excel, JSON)
3. Download your coding report

## 🔧 Development

### Project Structure

```
Medical Coding/
├── Backend/
│   ├── medical_coding_ai/
│   │   ├── agents/                 # AI agents for different coding systems
│   │   │   ├── base_agent.py      # Base agent class with RAG functionality
│   │   │   ├── icd10_agent.py     # ICD-10 specialist agent
│   │   │   ├── cpt_agent.py       # CPT specialist agent
│   │   │   ├── hcpcs_agent.py     # HCPCS specialist agent
│   │   │   └── master_agent.py    # Master orchestration agent
│   │   ├── utils/                  # Utility modules
│   │   │   ├── document_processor.py    # PDF processing and data extraction
│   │   │   ├── data_anonymizer.py       # PII anonymization
│   │   │   ├── vector_store.py          # FAISS vector store management
│   │   │   ├── pdf_processor.py         # PDF knowledge base processing
│   │   │   └── code_searcher.py         # Code search functionality
│   │   ├── ui/                     # Streamlit interface
│   │   │   └── app.py             # Main Streamlit application
│   │   ├── data/                   # Data storage
│   │   │   ├── knowledge_base/    # Processed knowledge base
│   │   │   └── vector_stores/     # Vector store files
│   │   └── config.yaml            # Configuration file
│   ├── knowledge_base_pdfs/       # Source PDF files
│   ├── main.py                    # FastAPI backend
│   ├── requirements.txt           # Python dependencies
│   └── setup.py                   # Setup script
└── Frontend/
    ├── app/                       # Next.js pages
    ├── components/                # React components
    ├── hooks/                     # Custom hooks
    ├── lib/                       # Utilities
    └── package.json               # Node.js dependencies
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

## 🔍 Troubleshooting

### Common Issues

**1. "Import Error" on Startup**

```bash
# Ensure all dependencies are installed
pip install -r Backend/requirements.txt
```

**2. "Ollama Connection Failed"**

```bash
# Start Ollama service
ollama serve

# Check if model is available
ollama list
```

**3. "Knowledge Base Not Found"**

- Place PDF files in `Backend/knowledge_base_pdfs/`
- Update paths in `Backend/config.yaml`

**4. "Frontend API Connection Issues"**

- Ensure backend is running on port 8000
- Check CORS settings in `Backend/main.py`

### Logs and Debugging

**Backend Logs:**

- Check console output when running the application
- Logs are configured in each module

**Frontend Logs:**

- Open browser developer tools
- Check console for API errors
- Network tab for failed requests

## 📄 License

This project is for educational and research purposes. Please ensure compliance with medical coding guidelines and regulations in your jurisdiction.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all prerequisites are met
4. Verify configuration files are correct

---

**Note:** This system is designed to assist medical coding professionals and should not replace human expertise and judgment in medical coding decisions.


***DOCKER***
1. docker-compose ps
2. docker exec -i multitenant-postgres psql -U admin -d multitenant_db < Medical_coding/tenant.sql
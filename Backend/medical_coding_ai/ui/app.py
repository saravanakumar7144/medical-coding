import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import sys
import os
import yaml
from datetime import datetime
import json
from io import BytesIO
import logging

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import project modules
try:
    from agents.master_agent import MasterAgent
    from agents.icd10_agent import ICD10Agent
    from agents.cpt_agent import CPTAgent
    from agents.hcpcs_agent import HCPCSAgent
    from utils.document_processor import DocumentProcessor
    from utils.code_searcher import CodeSearcher
    from utils.kb_manager import KnowledgeBaseManager
    logger.info("All project modules imported successfully")
except ImportError as e:
    st.error(f"Import error: {e}")
    st.error("Please ensure all dependencies are installed and the project structure is correct.")
    st.stop()

# Page configuration - Clean minimal UI
st.set_page_config(
    page_title="Medical Coding AI",
    page_icon=":hospital:",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for minimal clean UI
st.markdown("""
<style>
    .main-header {
        font-size: 2rem;
        font-weight: 600;
        color: #0e1117;
        margin-bottom: 1.5rem;
    }
    
    .section-header {
        font-size: 1.5rem;
        font-weight: 500;
        color: #0e1117;
        margin: 1rem 0;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid #f0f2f6;
    }
    
    .code-card {
        border: 1px solid #f0f2f6;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 0.5rem 0;
        background-color: white;
    }
    
    .code-approved {
        border-left: 4px solid #09ab3b;
    }
    
    .code-warning {
        border-left: 4px solid #f9a825;
    }
    
    .code-error {
        border-left: 4px solid #f44336;
    }
    
    .stButton>button {
        border-radius: 4px;
        padding: 0.5rem 1rem;
    }
    
    div.block-container {
        padding-top: 2rem;
    }
    
    .st-emotion-cache-1r6slb0 {
        width: 100%;
    }
    
    .status-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
    }
    
    .status-success { background-color: #09ab3b; }
    .status-warning { background-color: #f9a825; }
    .status-error { background-color: #f44336; }
</style>
""", unsafe_allow_html=True)

class MedicalCodingApp:
    def __init__(self):
        self.initialize_session_state()
        self.load_config()
        self.initialize_components()
        
    def load_config(self):
        """Load configuration"""
        config_path = os.path.join(project_root, 'config.yaml')
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                self.config = yaml.safe_load(file)
        except FileNotFoundError:
            st.error("⚠️ Configuration file not found. Please create config.yaml")
            st.info("Creating default configuration...")
            self.config = self._create_default_config()
            self._save_default_config(config_path)
    
    def _create_default_config(self):
        """Create default configuration"""
        return {
            'ollama': {
                'model_name': 'llama3.2:3b-instruct-q4_0',
                'base_url': 'http://localhost:11434'
            },
            'vector_store': {
                'dimension': 384,
                'similarity_threshold': 0.7
            },
            'knowledge_base': {
                'pdf_source_directory': 'knowledge_base_pdfs',
                'icd10_path': 'knowledge_base_pdfs/icd10.pdf',
                'cpt_path': 'knowledge_base_pdfs/cpt.pdf',
                'hcpcs_path': 'knowledge_base_pdfs/hcpcs.pdf',
                'chunk_size': 1000,
                'chunk_overlap': 200,
                'update_on_startup': False,
                'auto_process_on_startup': True
            },
            'agents': {
                'confidence_threshold': 60,
                'max_suggestions': 5
            }
        }
    
    def _save_default_config(self, config_path):
        """Save default configuration"""
        try:
            with open(config_path, 'w', encoding='utf-8') as file:
                yaml.dump(self.config, file, default_flow_style=False)
            st.success("✅ Default configuration created")
        except Exception as e:
            st.error(f"Error saving configuration: {e}")
    
    def initialize_session_state(self):
        """Initialize session state variables"""
        defaults = {
            'document_processed': False,
            'patient_data': None,
            'analysis_results': None,
            'suggested_codes': [],
            'selected_codes': [],
            'verification_results': [],
            'knowledge_loaded': False,
            'processing_status': {},
            'session_id': datetime.now().strftime("%Y%m%d_%H%M%S"),
            'agents_initialized': False,
            'current_page': 'Upload',
            'main_navigation': 'Upload',
            'master_agent': None,
            'kb_processed': False
        }
        
        for key, value in defaults.items():
            if key not in st.session_state:
                st.session_state[key] = value
                
        # Ensure selected_codes is always a list
        if not isinstance(st.session_state.get('selected_codes'), list):
            st.session_state.selected_codes = []
    
    def initialize_components(self):
        """Initialize components"""
        self.document_processor = DocumentProcessor()
        # PDF processing handled by document processor
        # self.pdf_processor = PDFKnowledgeProcessor()
        self.code_searcher = CodeSearcher()
        
        # Set up paths
        self.processed_dir = os.path.join(project_root, 'data', 'knowledge_base')
        self.knowledge_base_pdfs_dir = os.path.join(project_root, '..', 'knowledge_base_pdfs')
        
        # Initialize knowledge base manager
        try:
            self.kb_manager = KnowledgeBaseManager()
            logger.info("Knowledge base manager initialized")
            
            # Process knowledge base if auto_process is enabled
            auto_process = self.config.get('knowledge_base', {}).get('auto_process_on_startup', False)
            if auto_process and not st.session_state.kb_processed:
                self.check_and_process_knowledge_base()
                st.session_state.kb_processed = True
                
        except Exception as e:
            logger.error(f"Error initializing knowledge base manager: {e}")
            self.kb_manager = None
        
        # Initialize agents only if not already done
        if not st.session_state.agents_initialized:
            self.initialize_agents()
    
    def check_and_process_knowledge_base(self):
        """Check and process knowledge base if needed"""
        if self.kb_manager is None:
            return
            
        need_processing = []
        kb_types = ["icd10", "cpt", "hcpcs"]
        
        # Check which knowledge bases need processing
        for kb_type in kb_types:
            pdf_path = os.path.join(self.knowledge_base_pdfs_dir, f"{kb_type}.pdf")
            if os.path.exists(pdf_path) and self.kb_manager.needs_reprocessing(kb_type):
                need_processing.append(kb_type)
        
        # Process if needed
        if need_processing:
            logger.info(f"Knowledge bases needing processing: {need_processing}")
            for kb_type in need_processing:
                self.kb_manager.process_pdf_to_json(kb_type)
    
    def initialize_agents(self):
        """Initialize AI agents with knowledge bases"""
        try:
            # Initialize agents
            model_name = self.config.get('ollama', {}).get('model_name', 'llama3.2:3b-instruct-q4_0')
            
            # Initialize the master agent which now creates all specialized agents internally
            try:
                st.session_state.master_agent = MasterAgent(model_name)
                logger.info("Master agent initialized successfully with all specialized agents")
                
                # Verify agents are available
                if st.session_state.master_agent.icd10_agent:
                    logger.info("ICD-10 agent available in master agent")
                if st.session_state.master_agent.cpt_agent:
                    logger.info("CPT agent available in master agent")
                if st.session_state.master_agent.hcpcs_agent:
                    logger.info("HCPCS agent available in master agent")
                    
            except Exception as e:
                logger.error(f"Error initializing master agent: {e}")
                st.error(f"Error initializing master agent: {str(e)}")
                st.session_state.master_agent = None
                return
            
            # Set processing status
            if 'processing_status' not in st.session_state:
                st.session_state.processing_status = {}
            
            # Load knowledge bases - check for processed JSON first, then PDFs, then sample data
            knowledge_base_config = self.config.get('knowledge_base', {})
            
            # Try to load ICD-10 knowledge base
            processed_icd10_path = os.path.join(self.processed_dir, 'icd10_processed.json')
            icd10_path = os.path.join(self.knowledge_base_pdfs_dir, 'icd10.pdf')
            
            if os.path.exists(processed_icd10_path):
                with st.spinner("📚 Loading processed ICD-10 knowledge base..."):
                    icd10_codes = self.kb_manager.load_processed_codes('icd10') if self.kb_manager else []
                    if icd10_codes and st.session_state.master_agent.icd10_agent:
                        st.session_state.master_agent.icd10_agent.load_knowledge_base(icd10_codes)
                        st.session_state.processing_status['icd10'] = f"✅ Loaded {len(icd10_codes)} processed codes"
                    else:
                        st.session_state.processing_status['icd10'] = "⚠️ Using sample data"
            elif os.path.exists(icd10_path):
                with st.spinner("📚 Loading ICD-10 PDF knowledge base..."):
                    icd10_codes = self.pdf_processor.process_icd10_pdf(icd10_path)
                    icd10_codes = self.pdf_processor.generate_embeddings(icd10_codes)
                    if st.session_state.master_agent.icd10_agent:
                        st.session_state.master_agent.icd10_agent.load_knowledge_base(icd10_codes)
                        st.session_state.processing_status['icd10'] = f"✅ Loaded {len(icd10_codes)} codes from PDF"
            else:
                st.session_state.processing_status['icd10'] = "⚠️ Using sample data"
            
            # Try to load CPT knowledge base
            processed_cpt_path = os.path.join(self.processed_dir, 'cpt_processed.json')
            cpt_path = os.path.join(self.knowledge_base_pdfs_dir, 'cpt.pdf')
            
            if os.path.exists(processed_cpt_path):
                with st.spinner("📚 Loading processed CPT knowledge base..."):
                    cpt_codes = self.kb_manager.load_processed_codes('cpt') if self.kb_manager else []
                    if cpt_codes and st.session_state.master_agent.cpt_agent:
                        st.session_state.master_agent.cpt_agent.load_knowledge_base(cpt_codes)
                        st.session_state.processing_status['cpt'] = f"✅ Loaded {len(cpt_codes)} processed codes"
                    else:
                        st.session_state.processing_status['cpt'] = "⚠️ Using sample data"
            elif os.path.exists(cpt_path):
                with st.spinner("📚 Loading CPT PDF knowledge base..."):
                    cpt_codes = self.pdf_processor.process_cpt_pdf(cpt_path)
                    cpt_codes = self.pdf_processor.generate_embeddings(cpt_codes)
                    if st.session_state.master_agent.cpt_agent:
                        st.session_state.master_agent.cpt_agent.load_knowledge_base(cpt_codes)
                        st.session_state.processing_status['cpt'] = f"✅ Loaded {len(cpt_codes)} codes from PDF"
            else:
                st.session_state.processing_status['cpt'] = "⚠️ Using sample data"
            
            # Try to load HCPCS knowledge base
            processed_hcpcs_path = os.path.join(self.processed_dir, 'hcpcs_processed.json')
            hcpcs_path = os.path.join(self.knowledge_base_pdfs_dir, 'hcpcs.pdf')
            
            if os.path.exists(processed_hcpcs_path):
                with st.spinner("📚 Loading processed HCPCS knowledge base..."):
                    hcpcs_codes = self.kb_manager.load_processed_codes('hcpcs') if self.kb_manager else []
                    if hcpcs_codes and st.session_state.master_agent.hcpcs_agent:
                        st.session_state.master_agent.hcpcs_agent.load_knowledge_base(hcpcs_codes)
                        st.session_state.processing_status['hcpcs'] = f"✅ Loaded {len(hcpcs_codes)} processed codes"
                    else:
                        st.session_state.processing_status['hcpcs'] = "⚠️ Using sample data"
            elif os.path.exists(hcpcs_path):
                with st.spinner("📚 Loading HCPCS PDF knowledge base..."):
                    hcpcs_codes = self.pdf_processor.process_hcpcs_pdf(hcpcs_path)
                    hcpcs_codes = self.pdf_processor.generate_embeddings(hcpcs_codes)
                    if st.session_state.master_agent.hcpcs_agent:
                        st.session_state.master_agent.hcpcs_agent.load_knowledge_base(hcpcs_codes)
                        st.session_state.processing_status['hcpcs'] = f"✅ Loaded {len(hcpcs_codes)} codes from PDF"
            else:
                st.session_state.processing_status['hcpcs'] = "⚠️ Using sample data"
            
            st.session_state.knowledge_loaded = True
            st.session_state.agents_initialized = True
            logger.info("Agents initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing agents: {e}")
            st.session_state.agents_initialized = False
    
    def run(self):
        """Main application runner"""
        # Sidebar with minimal system status
        self.render_sidebar()
        
        # Main header
        st.markdown("<h1 class='main-header'>Medical Coding AI</h1>", 
                   unsafe_allow_html=True)
        
        # Navigation menu using standard Streamlit radio buttons
        # Initialize navigation state if not set
        if 'main_navigation' not in st.session_state:
            st.session_state.main_navigation = "Upload"
        
        # Use current_page to set the default value if available
        if 'current_page' in st.session_state:
            default_index = ["Upload", "AI Analysis", "Code Search", "Verification", "Knowledge Base", "Export"].index(
                st.session_state.current_page) if st.session_state.current_page in ["Upload", "AI Analysis", "Code Search", "Verification", "Knowledge Base", "Export"] else 0
        else:
            default_index = 0
            
        selected = st.radio(
            "Navigation",
            options=["Upload", "AI Analysis", "Code Search", "Verification", "Knowledge Base", "Export"],
            horizontal=True,
            key="main_navigation", 
            index=default_index
        )
        
        # Route to appropriate page
        if selected == "Upload":
            self.document_upload_page()
        elif selected == "AI Analysis":
            self.ai_analysis_page()
        elif selected == "Code Search":
            self.code_search_page()
        elif selected == "Verification":
            self.verification_page()
        elif selected == "Knowledge Base":
            self.knowledge_base_page()
        elif selected == "Export":
            self.export_page()
    
    def render_sidebar(self):
        """Render sidebar with system information"""
        with st.sidebar:
            st.markdown("### System Status")
            
            # Connection status
            try:
                import ollama
                st.markdown('<span class="status-indicator status-success"></span>**Ollama:** Connected', unsafe_allow_html=True)
            except Exception:
                st.markdown('<span class="status-indicator status-error"></span>**Ollama:** Disconnected', unsafe_allow_html=True)
            
            # Knowledge base status
            if st.session_state.get('processing_status'):
                st.markdown("#### Knowledge Bases")
                for agent, status in st.session_state.processing_status.items():
                    st.markdown(f"**{agent.upper()}:** {status}")
            
            # Session information
            st.markdown("#### Current Session")
            st.markdown(f"**Session ID:** `{st.session_state.session_id}`")
            
            if st.session_state.document_processed:
                st.markdown('<span class="status-indicator status-success"></span>**Document:** Loaded', unsafe_allow_html=True)
            else:
                st.markdown('<span class="status-indicator status-info"></span>**Document:** None', unsafe_allow_html=True)
            
            if st.session_state.selected_codes:
                st.markdown(f'<span class="status-indicator status-success"></span>**Codes:** {len(st.session_state.selected_codes)} selected', unsafe_allow_html=True)
            else:
                st.markdown('<span class="status-indicator status-info"></span>**Codes:** None selected', unsafe_allow_html=True)
            
            # Quick actions
            st.markdown("#### Actions")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("🔄 Refresh", help="Reload system", use_container_width=True):
                    st.session_state.agents_initialized = False
                    st.rerun()
            
            with col2:
                if st.button("🗑️ Clear", help="Clear medical record data", use_container_width=True):
                    self.clear_session()
                    st.rerun()
            
            # System info
            st.markdown("#### AI Model")
            model_name = self.config.get('ollama', {}).get('model_name', 'Unknown')
            st.markdown(f"**Model:** `{model_name}`")
    
    def clear_session(self):
        """Clear medical record session data (preserves knowledge base data)"""
        keys_to_clear = [
            'document_processed', 'patient_data', 'analysis_results',
            'suggested_codes', 'selected_codes', 'verification_results'
        ]
        for key in keys_to_clear:
            if key in st.session_state:
                if 'codes' in key:
                    st.session_state[key] = []
                elif key == 'document_processed':
                    st.session_state[key] = False
                else:
                    st.session_state[key] = None
        
        # Generate new session ID
        st.session_state.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Show confirmation
        st.success("🗑️ Medical record session cleared! Knowledge base data preserved.")
    
    def document_upload_page(self):
        """Document upload page"""
        st.markdown("<h2 class='section-header'>Document Upload & Processing</h2>", 
                   unsafe_allow_html=True)
        
        col1, col2 = st.columns([3, 2])
        
        with col1:
            uploaded_file = st.file_uploader(
                "Upload medical document (PDF/TXT)",
                type=['pdf', 'txt'],
                help="Upload medical reports, notes, or summaries"
            )
            
            if uploaded_file is not None:
                # Show file information
                file_details = f"File: {uploaded_file.name} ({uploaded_file.size:,} bytes)"
                st.info(file_details)
                
                process_btn = st.button("Process Document", type="primary", use_container_width=True)
                
                if process_btn:
                    self.process_uploaded_document(uploaded_file)
        
        with col2:
            st.markdown("""
            ### Sample Documents
            Don't have a medical document? Try one of our sample documents:
            """)
            
            sample_options = [
                "None",
                "Comprehensive Medical Record",
                "Sample Medical Record"
            ]
            
            selected_sample = st.selectbox("Select a sample:", sample_options)
            
            if selected_sample != "None":
                sample_btn = st.button("Use Sample", use_container_width=True)
                
                if sample_btn:
                    self.load_sample_document(selected_sample)
                    
        # Show processed document if available
        if st.session_state.document_processed and st.session_state.patient_data:
            st.markdown("<h3 class='section-header'>Processed Document</h3>", unsafe_allow_html=True)
            
            with st.expander("View Processed Text", expanded=False):
                st.text_area("Medical Record Text", st.session_state.patient_data.get('text', ''), height=300)
            
            # Next steps guidance
            st.markdown("""
            #### Next Steps
            Now that your document is processed, you can:
            1. Go to **AI Analysis** to get code suggestions
            2. Go to **Code Search** to manually search for codes
            3. Go to **Verification** to review selected codes
            """)
            
            st.button("Go to AI Analysis", on_click=self.set_page, args=["AI Analysis"])
    
    def set_page(self, page):
        """Set the current page and sync with navigation"""
        # Only set current_page, which will be used on the next rerun
        # Don't directly modify main_navigation as it's bound to a widget
        st.session_state.current_page = page
        
        # Use rerun to refresh the page, the navigation will be updated
        # based on current_page on next render
        st.rerun()
    
    def process_uploaded_document(self, uploaded_file):
        """Process an uploaded document"""
        try:
            with st.spinner("Processing document..."):
                # Extract text based on file type
                file_extension = uploaded_file.name.split('.')[-1].lower()
                
                if file_extension == 'pdf':
                    text = self.document_processor.extract_text_from_pdf(uploaded_file)
                else:
                    # For text files
                    text = uploaded_file.getvalue().decode('utf-8')
                
                # Process and anonymize
                processed_data = self.document_processor.process_medical_text(text)
                
                # Store in session state
                st.session_state.patient_data = processed_data
                st.session_state.document_processed = True
                
                st.success(f"✅ Document processed successfully!")
                
        except Exception as e:
            st.error(f"Error processing document: {str(e)}")
            logger.error(f"Document processing error: {e}")
    
    def load_sample_document(self, sample_name):
        """Load a sample document"""
        try:
            with st.spinner("Loading sample document..."):
                if sample_name == "Comprehensive Medical Record":
                    sample_path = os.path.join(project_root, "..", "sample_documents", "comprehensive_medical_record.txt")
                else:
                    sample_path = os.path.join(project_root, "..", "sample_documents", "sample_medical_record.txt")
                
                if os.path.exists(sample_path):
                    with open(sample_path, 'r', encoding='utf-8') as f:
                        text = f.read()
                    
                    # Process and anonymize
                    processed_data = self.document_processor.process_medical_text(text)
                    
                    # Store in session state
                    st.session_state.patient_data = processed_data
                    st.session_state.document_processed = True
                    
                    st.success(f"✅ Sample document loaded successfully!")
                else:
                    st.error(f"Sample document not found: {sample_path}")
                
        except Exception as e:
            st.error(f"Error loading sample: {str(e)}")
            logger.error(f"Sample loading error: {e}")
    
    def ai_analysis_page(self):
        """AI analysis page"""
        st.markdown("<h2 class='section-header'>AI-Powered Medical Coding</h2>", 
                   unsafe_allow_html=True)
        
        # Debug info
        if st.checkbox("Show Debug Info", key="debug_analysis"):
            st.write(f"**Debug - Selected codes count:** {len(st.session_state.selected_codes)}")
            st.write(f"**Debug - Selected codes:** {st.session_state.selected_codes}")
            st.write(f"**Debug - Agents initialized:** {st.session_state.agents_initialized}")
            st.write(f"**Debug - Document processed:** {st.session_state.document_processed}")
        
        if not st.session_state.document_processed:
            st.warning("⚠️ Please upload and process a medical document first.")
            st.button("Go to Upload Page", on_click=self.set_page, args=["Upload"])
            return
        
        if not st.session_state.agents_initialized:
            st.warning("⚠️ AI Agents are not initialized. Please refresh the system.")
            if st.button("Initialize Agents", type="primary"):
                self.initialize_agents()
                st.rerun()
            return
            
        # Analysis options section
        st.markdown("### Select Analysis Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            run_icd10 = st.checkbox("ICD-10 Diagnosis Codes", value=True)
        
        with col2:
            run_cpt = st.checkbox("CPT Procedure Codes", value=True)
        
        with col3:
            run_hcpcs = st.checkbox("HCPCS Supply/Equipment", value=False)
        
        # Run analysis button
        analyze_btn = st.button("Analyze Document", type="primary", use_container_width=True)
        
        if analyze_btn:
            self.run_ai_analysis(run_icd10, run_cpt, run_hcpcs)
        
        # Display previously suggested codes if available
        if st.session_state.suggested_codes:
            self.display_suggested_codes()
    
    def run_ai_analysis(self, run_icd10, run_cpt, run_hcpcs):
        """Run AI analysis based on selected options with enhanced error handling"""
        if not st.session_state.master_agent:
            st.error("❌ Master agent not initialized. Please refresh the system.")
            self.initialize_agents()
            st.rerun()
            return
            
        try:
            with st.spinner("🤖 AI analyzing medical document..."):
                # Get document text
                document_text = st.session_state.patient_data.get('text', '')
                
                if not document_text:
                    st.error("❌ No document text found. Please upload or enter a medical document first.")
                    return
                
                # Check if any analysis options are selected
                if not any([run_icd10, run_cpt, run_hcpcs]):
                    st.warning("⚠️ Please select at least one analysis option.")
                    return
                
                # Show progress indicators
                progress_container = st.empty()
                progress_text = st.empty()
                
                # Update progress
                progress_container.progress(0.1)
                progress_text.text("Analyzing document...")
                
                # Run analysis
                results = st.session_state.master_agent.analyze_document(
                    document_text, 
                    run_icd10=run_icd10, 
                    run_cpt=run_cpt, 
                    run_hcpcs=run_hcpcs
                )
                
                # Update progress
                progress_container.progress(0.7)
                progress_text.text("Extracting code suggestions...")
                
                # Get suggested codes
                suggested_codes = st.session_state.master_agent.get_code_suggestions(results)
                
                # Store results
                st.session_state.analysis_results = results
                st.session_state.suggested_codes = suggested_codes
                
                # Update progress
                progress_container.progress(1.0)
                progress_text.empty()
                
                # Create a meaningful message based on results
                if suggested_codes:
                    # Count codes by type
                    code_types = {}
                    for code in suggested_codes:
                        code_type = code.get('type', code.get('agent', 'Unknown')).upper()
                        if code_type not in code_types:
                            code_types[code_type] = 0
                        code_types[code_type] += 1
                    
                    # Create a detailed message
                    details = ", ".join([f"{count} {type_name}" for type_name, count in code_types.items()])
                    st.success(f"✅ Analysis complete! Found {len(suggested_codes)} potential codes ({details}).")
                    
                    # Log for debugging
                    logger.info(f"Analysis complete with {len(suggested_codes)} codes: {details}")
                else:
                    # Create a helpful message based on what was attempted
                    attempted = []
                    if run_icd10:
                        attempted.append("ICD-10")
                    if run_cpt:
                        attempted.append("CPT")
                    if run_hcpcs:
                        attempted.append("HCPCS")
                    
                    attempted_str = ", ".join(attempted)
                    st.warning(f"⚠️ No codes found for {attempted_str}. Try adjusting analysis options or document content.")
                    
                    logger.warning(f"No codes found from analysis. Attempted: {attempted_str}")
                
        except Exception as e:
            st.error(f"❌ Analysis failed: {str(e)}")
            logger.error(f"AI analysis error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Provide user with recovery options
            st.info("💡 You can still search for codes manually using the Search page.")
            if st.button("Go to Code Search"):
                self.set_page("Search")
                st.rerun()
    
    def display_suggested_codes(self):
        """Display suggested codes from AI analysis"""
        st.markdown("<h3 class='section-header'>AI Code Suggestions</h3>", 
                   unsafe_allow_html=True)
        
        # Log the number of suggested codes for debugging
        logger.info(f"Displaying suggested codes: {len(st.session_state.suggested_codes)} codes found")
        
        # Group by code type
        code_types = {}
        for code in st.session_state.suggested_codes:
            # Ensure each code has a type
            code_type = code.get('type', code.get('agent', 'Unknown')).upper()
            if code_type not in code_types:
                code_types[code_type] = []
            code_types[code_type].append(code)
        
        # Display tabs for each code type
        if code_types:
            tab_labels = list(code_types.keys())
            tabs = st.tabs(tab_labels)
            
            for i, (code_type, codes) in enumerate(code_types.items()):
                with tabs[i]:
                    # Display the number of codes found for this type
                    st.info(f"Found {len(codes)} potential {code_type} codes")
                    
                    for idx, code in enumerate(codes):
                        # Format confidence as percentage with sanity check
                        confidence_value = code.get('confidence', 0)
                        # Ensure confidence is a number between 0 and 1
                        if isinstance(confidence_value, str):
                            try:
                                confidence_value = float(confidence_value)
                            except ValueError:
                                confidence_value = 0.5
                        confidence_value = max(0, min(1, confidence_value))
                        confidence = int(confidence_value * 100)
                        confidence_color = "green" if confidence >= 80 else "orange" if confidence >= 60 else "red"
                        
                        # Check if already selected - use normalized comparison
                        code_value = str(code.get('code', '')).upper().strip()
                        already_selected = any(
                            str(sc.get('code', '')).upper().strip() == code_value
                            for sc in st.session_state.selected_codes
                        )
                        
                        # Create a card for each code with improved visual separation
                        with st.container():
                            cols = st.columns([8, 2])
                            with cols[0]:
                                st.markdown(f"""
                                <div class="code-card" style="margin-bottom:10px; padding:10px; border-radius:5px; border:1px solid #ddd;">
                                    <h4>{code.get('code')} - {code.get('description')}</h4>
                                    <p><strong>Confidence:</strong> <span style="color:{confidence_color}">{confidence}%</span></p>
                                    <p><strong>Evidence:</strong> {code.get('evidence', code.get('reasoning', 'N/A'))}</p>
                                </div>
                                """, unsafe_allow_html=True)
                            
                            with cols[1]:
                                # Create a unique key for each button
                                unique_key = f"suggested_{code_type}_{idx}_{hash(code_value) % 10000}"
                                
                                # Only show add button if not already selected
                                if not already_selected:
                                    if st.button(f"Select", key=unique_key, type="primary"):
                                        # Create a complete code object
                                        selected_code = {
                                            'code': code_value,
                                            'description': code.get('description', 'No description'),
                                            'type': code_type,
                                            'agent': code.get('agent', code_type),
                                            'confidence': confidence_value,
                                            'reasoning': code.get('reasoning', code.get('evidence', 'AI suggested')),
                                            'source': 'ai_analysis'
                                        }
                                        
                                        # Double-check to prevent duplicates
                                        if not any(str(sc.get('code', '')).upper().strip() == code_value 
                                                for sc in st.session_state.selected_codes):
                                            st.session_state.selected_codes.append(selected_code)
                                            logger.info(f"Added code {code_value} to selected codes")
                                            st.success(f"✅ Added {code_value}")
                                        
                                        # Force update and rerun
                                        st.session_state.selected_codes = st.session_state.selected_codes.copy()
                                        st.rerun()
                                else:
                                    st.success("✅ Selected")
            
            # Show all selected codes
            if st.session_state.selected_codes:
                st.markdown("<h3 class='section-header'>Selected Codes</h3>", 
                           unsafe_allow_html=True)
                
                # Display code count and navigation options
                st.info(f"Currently selected: **{len(st.session_state.selected_codes)}** codes")
                
                for idx, code in enumerate(st.session_state.selected_codes):
                    # Get code details with fallbacks for missing values
                    code_val = str(code.get('code', '')).upper().strip()
                    code_desc = code.get('description', 'No description')
                    code_type = code.get('type', code.get('agent', 'Unknown'))
                    
                    # Create columns for layout
                    cols = st.columns([8, 2])
                    
                    with cols[0]:
                        st.markdown(f"""
                        <div class="code-card code-approved" style="margin-bottom:8px; padding:10px; border-radius:5px; border:1px solid #8bc53f; background-color:#f9fdf5;">
                            <h4>{code_val} - {code_desc}</h4>
                            <p><strong>Type:</strong> {code_type}</p>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    with cols[1]:
                        # Create unique key for remove button using code value and index
                        import hashlib
                        remove_id = f"remove_{code_val}_{idx}"
                        hash_obj = hashlib.md5(remove_id.encode())
                        remove_key = f"remove_{hash_obj.hexdigest()[:8]}"
                        
                        if st.button("🗑️ Remove", key=remove_key):
                            st.session_state.selected_codes.pop(idx)
                            # Force session state update
                            st.session_state.selected_codes = st.session_state.selected_codes.copy()
                            logger.info(f"Removed code {code_val} from selected codes")
                            st.rerun()
                
                # Verification and navigation buttons
                col1, col2 = st.columns(2)
                with col1:
                    st.button("✓ Go to Verification", type="primary", on_click=self.set_page, args=["Verification"], 
                             use_container_width=True)
                with col2:
                    st.button("🔍 Go to Code Search", on_click=self.set_page, args=["Search"], 
                             use_container_width=True)
    
    def code_search_page(self):
        """Code search page"""
        st.markdown("<h2 class='section-header'>Medical Code Search</h2>", 
                   unsafe_allow_html=True)
        
        if not st.session_state.agents_initialized:
            st.warning("⚠️ AI Agents are not initialized. Please refresh the system.")
            if st.button("Initialize Agents", type="primary"):
                self.initialize_agents()
                st.rerun()
            return
        
        # Show current selection summary
        st.info(f"Currently selected: **{len(st.session_state.selected_codes)}** codes")
        
        # Create tabs for different search methods
        tab1, tab2 = st.tabs(["🔍 Search Codes", "✏️ Manual Entry"])
        
        with tab1:
            # Search section
            col1, col2 = st.columns([3, 1])
            
            with col1:
                search_query = st.text_input("Enter medical condition, procedure, or code", 
                                           placeholder="e.g., 'diabetes', 'amputation', 'Z89.221'")
            
            with col2:
                code_type = st.selectbox(
                    "Code Type", 
                    ["all", "icd10", "cpt", "hcpcs"],
                    format_func=lambda x: {"all": "All Codes", "icd10": "ICD-10", "cpt": "CPT", "hcpcs": "HCPCS"}[x]
                )
            
            search_btn = st.button("🔍 Search", type="primary", use_container_width=True)
            
            if search_query and search_btn:
                self.search_codes(search_query, code_type)
        
        with tab2:
            # Manual code entry section
            st.markdown("### Add Code Manually")
            st.info("💡 Use this to add specific codes you know are needed.")
            
            col1, col2 = st.columns([2, 1])
            
            with col1:
                manual_code = st.text_input("Code", placeholder="e.g., Z89.221, 99214, L6000")
                manual_description = st.text_input("Description", placeholder="Enter code description")
            
            with col2:
                manual_type = st.selectbox(
                    "Code Type",
                    ["ICD-10", "CPT", "HCPCS"],
                    key="manual_type"
                )
                manual_confidence = st.slider("Confidence", 0, 100, 90, key="manual_confidence")
            
            add_manual_btn = st.button("➕ Add Manual Code", type="primary", use_container_width=True)
            
            if add_manual_btn:
                if manual_code and manual_description:
                    # Check if code already exists
                    already_selected = any(
                        sc.get('code', '').upper() == manual_code.upper() 
                        for sc in st.session_state.selected_codes
                    )
                    
                    if not already_selected:
                        new_code = {
                            'code': manual_code.upper(),
                            'description': manual_description,
                            'type': manual_type,
                            'agent': manual_type,
                            'confidence': manual_confidence / 100.0,
                            'reasoning': 'Manually added by user',
                            'source': 'manual_entry'
                        }
                        st.session_state.selected_codes.append(new_code)
                        st.success(f"✅ Added {manual_code.upper()} - {manual_description}")
                        st.rerun()
                    else:
                        st.warning(f"⚠️ Code {manual_code.upper()} is already selected!")
                else:
                    st.error("❌ Please enter both code and description!")
        
        # Current selection management
        if st.session_state.selected_codes:
            st.markdown("---")
            st.markdown("### Currently Selected Codes")
            
            # Bulk actions
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("🔍 Verify All Codes", use_container_width=True):
                    self.set_page("Verification")
                    st.rerun()
            
            with col2:
                if st.button("🗑️ Clear All", key="clear_all_search", use_container_width=True):
                    if st.session_state.get('confirm_clear', False):
                        st.session_state.selected_codes = []
                        st.session_state.verification_results = []
                        st.session_state.confirm_clear = False
                        st.success("All codes cleared!")
                        st.rerun()
                    else:
                        st.session_state.confirm_clear = True
                        st.warning("Click again to confirm clearing all codes")
            
            with col3:
                st.write(f"**Total:** {len(st.session_state.selected_codes)} codes")
            
            # Show selected codes with management options
            for idx, code in enumerate(st.session_state.selected_codes):
                cols = st.columns([7, 1, 1, 1])
                
                with cols[0]:
                    confidence = code.get('confidence', 0)
                    if isinstance(confidence, (int, float)):
                        confidence_pct = int(confidence * 100) if confidence <= 1 else int(confidence)
                    else:
                        confidence_pct = 0
                    
                    source_badge = ""
                    if code.get('source') == 'manual_entry':
                        source_badge = "🖊️ Manual"
                    elif code.get('source') == 'manual_search':
                        source_badge = "🔍 Search"
                    else:
                        source_badge = "🤖 AI"
                    
                    st.markdown(f"""
                    <div class="code-card">
                        <h4>{code.get('code')} - {code.get('description', 'No description')}</h4>
                        <p><strong>Type:</strong> {code.get('type', 'Unknown')} | 
                           <strong>Confidence:</strong> {confidence_pct}% | 
                           <strong>Source:</strong> {source_badge}</p>
                    </div>
                    """, unsafe_allow_html=True)
                
                with cols[1]:
                    if st.button("✏️", key=f"edit_selected_{idx}", help="Edit"):
                        st.session_state[f'edit_mode_{idx}'] = True
                        st.rerun()
                
                with cols[2]:
                    if st.button("📋", key=f"duplicate_{idx}", help="Duplicate"):
                        duplicate_code = code.copy()
                        duplicate_code['code'] = f"{code.get('code')}_copy"
                        duplicate_code['source'] = 'duplicated'
                        st.session_state.selected_codes.append(duplicate_code)
                        st.success(f"Duplicated {code.get('code')}")
                        st.rerun()
                
                with cols[3]:
                    if st.button("🗑️", key=f"remove_selected_{idx}", help="Remove"):
                        removed_code = st.session_state.selected_codes.pop(idx)
                        st.success(f"Removed {removed_code.get('code')}")
                        st.rerun()
                
                # Edit mode
                if st.session_state.get(f'edit_mode_{idx}', False):
                    with st.expander(f"Edit {code.get('code')}", expanded=True):
                        new_code = st.text_input("Code", value=code.get('code', ''), key=f"edit_code_{idx}")
                        new_desc = st.text_input("Description", value=code.get('description', ''), key=f"edit_desc_{idx}")
                        new_type = st.selectbox("Type", ['ICD-10', 'CPT', 'HCPCS'], 
                                              index=['ICD-10', 'CPT', 'HCPCS'].index(code.get('type', 'ICD-10')), 
                                              key=f"edit_type_{idx}")
                        new_conf = st.slider("Confidence", 0, 100, 
                                           int((code.get('confidence', 0.8) * 100) if code.get('confidence', 0.8) <= 1 else code.get('confidence', 80)),
                                           key=f"edit_conf_{idx}")
                        
                        edit_col1, edit_col2 = st.columns(2)
                        with edit_col1:
                            if st.button("💾 Save", key=f"save_{idx}"):
                                st.session_state.selected_codes[idx].update({
                                    'code': new_code,
                                    'description': new_desc,
                                    'type': new_type,
                                    'agent': new_type,
                                    'confidence': new_conf / 100.0,
                                    'source': 'manual_edit'
                                })
                                st.session_state[f'edit_mode_{idx}'] = False
                                st.success(f"Updated {new_code}")
                                st.rerun()
                        
                        with edit_col2:
                            if st.button("❌ Cancel", key=f"cancel_{idx}"):
                                st.session_state[f'edit_mode_{idx}'] = False
                                st.rerun()
        
        if search_query and search_btn:
            self.search_codes(search_query, code_type)
    
    def search_codes(self, query, code_type):
        """Search for medical codes with enhanced functionality and improved Select button"""
        try:
            with st.spinner(f"🔍 Searching for '{query}'..."):
                if not st.session_state.master_agent:
                    st.error("❌ Master agent not initialized. Please refresh the system.")
                    return
                
                # Get search results
                results = st.session_state.master_agent.search_codes(query, code_type)
                
                if results:
                    st.success(f"Found {len(results)} results")
                    
                    # Display selected codes count
                    st.info(f"Currently selected: {len(st.session_state.selected_codes)} codes")
                    
                    # Store search results in session state for persistence
                    st.session_state.search_results = results
                    st.session_state.last_search_query = query
                    
                    for idx, code in enumerate(results):
                        relevance = int(code.get('relevance_score', 0) * 100)
                        
                        # Create columns for layout
                        cols = st.columns([7, 2, 1])
                        
                        with cols[0]:
                            st.markdown(f"""
                            <div class="code-card">
                                <h4>{code.get('code')} - {code.get('description', 'No description')}</h4>
                                <p><strong>Type:</strong> {code.get('type', 'Unknown')} | <strong>Relevance:</strong> {relevance}%</p>
                            </div>
                            """, unsafe_allow_html=True)
                        
                        with cols[1]:
                            # Check if already selected - use normalized comparison
                            already_selected = any(
                                str(sc.get('code', '')).upper().strip() == str(code.get('code', '')).upper().strip()
                                for sc in st.session_state.selected_codes
                            )
                            
                            # Create truly unique key for each button based on multiple factors
                            code_value = str(code.get('code', '')).upper().strip()
                            # Use a combination of code value, index, and code type to ensure uniqueness
                            # Add a random component to make it absolutely unique across reruns
                            import random
                            random_id = random.randint(1000, 9999)
                            search_id = f"{code_type}_{code_value}_{idx}_{random_id}"
                            button_key = f"search_select_{search_id}"
                            
                            if not already_selected:
                                if st.button("🔗 Select", key=button_key, type="primary", 
                                           help=f"Add {code.get('code')} to selected codes",
                                           use_container_width=True):
                                    
                                    # Create proper code structure with all required fields
                                    selected_code = {
                                        'code': str(code.get('code', '')).upper().strip(),
                                        'description': str(code.get('description', 'No description')),
                                        'type': str(code.get('type', 'Unknown')),
                                        'agent': str(code.get('type', 'Unknown')),
                                        'confidence': float(code.get('relevance_score', 0.8)),
                                        'reasoning': f"Manual selection from search results for '{query}'",
                                        'source': 'manual_search',
                                        'search_query': query,
                                        'selected_at': datetime.now().isoformat()
                                    }
                                    
                                    # Ensure selected_codes list exists and add to it
                                    if 'selected_codes' not in st.session_state:
                                        st.session_state.selected_codes = []
                                    
                                    # Double-check for duplicates before adding
                                    duplicate_check = any(
                                        str(sc.get('code', '')).upper().strip() == selected_code['code']
                                        for sc in st.session_state.selected_codes
                                    )
                                    
                                    if not duplicate_check:
                                        st.session_state.selected_codes.append(selected_code)
                                        
                                        # Force session state update
                                        st.session_state.selected_codes = st.session_state.selected_codes.copy()
                                        
                                        st.success(f"✅ Added {selected_code['code']} to selected codes")
                                        logger.info(f"Added code {selected_code['code']} to selected codes")
                                        
                                        # Small delay to ensure state update
                                        import time
                                        time.sleep(0.1)
                                        
                                        st.rerun()
                                    else:
                                        st.warning(f"⚠️ Code {selected_code['code']} is already selected!")
                            else:
                                # Create a distinct key for the "already selected" button
                                already_key = f"already_{search_id}"
                                st.button("✅ Selected", key=already_key, 
                                        disabled=True, use_container_width=True,
                                        help="This code is already in your selected codes")
                        
                        with cols[2]:
                            # Show additional info button with unique key
                            info_key = f"info_{search_id}"
                            if st.button("ℹ️", key=info_key, help="More info"):
                                with st.expander(f"Details for {code.get('code')}", expanded=True):
                                    st.write(f"**Code:** {code.get('code')}")
                                    st.write(f"**Description:** {code.get('description')}")
                                    st.write(f"**Type:** {code.get('type')}")
                                    st.write(f"**Relevance:** {relevance}%")
                                    if code.get('category'):
                                        st.write(f"**Category:** {code.get('category')}")
                else:
                    st.warning(f"No results found for '{query}' in {code_type} codes")
                    st.info("Try different search terms or broaden your search to 'all' code types")
                    
        except Exception as e:
            logger.error(f"Error in code search: {e}")
            st.error(f"❌ Error searching codes: {e}")
            st.info("Please try again or contact support if the issue persists")
    
    def verification_page(self):
        """Code verification page"""
        st.markdown("<h2 class='section-header'>Code Verification</h2>", 
                   unsafe_allow_html=True)
        
        # Debug info
        if st.checkbox("Show Debug Info", key="debug_verification"):
            st.write(f"**Debug - Selected codes count:** {len(st.session_state.selected_codes)}")
            st.write(f"**Debug - Selected codes:** {st.session_state.selected_codes}")
        
        if not st.session_state.agents_initialized:
            st.warning("⚠️ AI Agents are not initialized. Please refresh the system.")
            if st.button("Initialize Agents", type="primary"):
                self.initialize_agents()
                st.rerun()
            return
            
        if not st.session_state.selected_codes:
            st.warning("⚠️ No codes have been selected. Please select codes first.")
            col1, col2 = st.columns(2)
            with col1:
                st.button("Go to AI Analysis", on_click=self.set_page, args=["AI Analysis"])
            with col2:
                st.button("Go to Code Search", on_click=self.set_page, args=["Code Search"])
            return
        
        # Code Management Section
        st.markdown("### Code Management")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔍 Search & Add More Codes", use_container_width=True):
                self.set_page("Code Search")
                st.rerun()
        
        with col2:
            if st.button("🗑️ Clear All Codes", use_container_width=True):
                st.session_state.selected_codes = []
                st.session_state.verification_results = []
                st.success("All codes cleared!")
                st.rerun()
        
        with col3:
            st.write(f"**Total Selected:** {len(st.session_state.selected_codes)} codes")
        
        # Show selected codes with enhanced management
        st.markdown("### Selected Codes")
        
        if st.session_state.selected_codes:
            # Bulk actions
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("📤 Export Selected Codes", use_container_width=True):
                    # Create CSV export
                    import pandas as pd
                    df = pd.DataFrame(st.session_state.selected_codes)
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv,
                        file_name=f"selected_codes_{st.session_state.session_id}.csv",
                        mime="text/csv"
                    )
            
            with col2:
                if st.button("🔄 Reset All Confidence", use_container_width=True):
                    for code in st.session_state.selected_codes:
                        code['confidence'] = 0.8  # Reset to 80%
                    st.success("All confidence scores reset to 80%")
                    st.rerun()
            
            with col3:
                if st.button("🗑️ Clear All Codes", key="clear_all_verification", use_container_width=True):
                    if st.session_state.get('confirm_clear_verification', False):
                        st.session_state.selected_codes = []
                        st.session_state.verification_results = []
                        st.session_state.confirm_clear_verification = False
                        st.success("All codes cleared!")
                        st.rerun()
                    else:
                        st.session_state.confirm_clear_verification = True
                        st.warning("Click again to confirm clearing all codes!")
                        st.rerun()
        
        codes_to_remove = []
        for idx, code in enumerate(st.session_state.selected_codes):
            # Enhanced code display with editing capabilities
            with st.container():
                cols = st.columns([6, 1, 1, 1, 1])
                
                with cols[0]:
                    # Show verification status if available
                    verification_status = ""
                    verification_color = ""
                    if st.session_state.verification_results:
                        for vr in st.session_state.verification_results:
                            if vr.get('code') == code.get('code'):
                                status = vr.get('status', 'unknown')
                                if status == 'approved':
                                    verification_status = "✅ Approved"
                                    verification_color = "color: green;"
                                elif status == 'approved_with_review':
                                    verification_status = "⚠️ Approved with Review"
                                    verification_color = "color: orange;"
                                elif status == 'needs_review':
                                    verification_status = "📋 Needs Review"
                                    verification_color = "color: blue;"
                                else:
                                    verification_status = "❌ Error"
                                    verification_color = "color: red;"
                                break
                    
                    confidence = code.get('confidence', 0)
                    if isinstance(confidence, (int, float)):
                        confidence_pct = int(confidence * 100) if confidence <= 1 else int(confidence)
                    else:
                        confidence_pct = 0
                    
                    st.markdown(f"""
                    <div class="code-card">
                        <h4>{code.get('code')} - {code.get('description', 'No description')}</h4>
                        <p><strong>Type:</strong> {code.get('type', 'Unknown')} | 
                           <strong>Confidence:</strong> {confidence_pct}% | 
                           <strong>Source:</strong> {code.get('source', 'AI Analysis')}</p>
                        {f"<p style='{verification_color}'><strong>Status:</strong> {verification_status}</p>" if verification_status else ""}
                    </div>
                    """, unsafe_allow_html=True)
                
                with cols[1]:
                    if st.button("✏️", key=f"edit_code_{idx}", help="Edit this code"):
                        st.session_state[f'editing_code_{idx}'] = True
                        st.rerun()
                
                with cols[2]:
                    if st.button("�", key=f"duplicate_code_{idx}", help="Duplicate this code"):
                        new_code = code.copy()
                        new_code['code'] = f"{new_code['code']}_copy"
                        new_code['source'] = 'duplicated'
                        st.session_state.selected_codes.append(new_code)
                        st.success(f"Duplicated {code.get('code')}")
                        st.rerun()
                
                with cols[3]:
                    # Confidence adjustment
                    new_confidence = st.slider(
                        "Conf%", 
                        0, 100, 
                        confidence_pct, 
                        key=f"conf_slider_{idx}",
                        help="Adjust confidence"
                    )
                    if new_confidence != confidence_pct:
                        st.session_state.selected_codes[idx]['confidence'] = new_confidence / 100.0
                        st.rerun()
                
                with cols[4]:
                    if st.button("�🗑️", key=f"remove_code_{idx}", help="Remove this code"):
                        codes_to_remove.append(idx)
        
        # Remove selected codes
        if codes_to_remove:
            for idx in sorted(codes_to_remove, reverse=True):
                removed_code = st.session_state.selected_codes.pop(idx)
                st.success(f"Removed {removed_code.get('code')}")
            st.rerun()
        
        # Handle code editing
        for idx, code in enumerate(st.session_state.selected_codes):
            if st.session_state.get(f'editing_code_{idx}', False):
                with st.expander(f"Edit {code.get('code')}", expanded=True):
                    new_description = st.text_input("Description", value=code.get('description', ''), key=f"edit_desc_{idx}")
                    new_type = st.selectbox("Type", ['ICD-10', 'CPT', 'HCPCS'], 
                                          index=['ICD-10', 'CPT', 'HCPCS'].index(code.get('type', 'ICD-10')), 
                                          key=f"edit_type_{idx}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("💾 Save Changes", key=f"save_edit_{idx}"):
                            st.session_state.selected_codes[idx]['description'] = new_description
                            st.session_state.selected_codes[idx]['type'] = new_type
                            st.session_state.selected_codes[idx]['agent'] = new_type
                            st.session_state[f'editing_code_{idx}'] = False
                            st.success(f"Updated {code.get('code')}")
                            st.rerun()
                    
                    with col2:
                        if st.button("❌ Cancel", key=f"cancel_edit_{idx}"):
                            st.session_state[f'editing_code_{idx}'] = False
                            st.rerun()
        
        # Verification button
        st.markdown("---")
        verify_btn = st.button("🔍 Verify All Codes", type="primary", use_container_width=True)
        
        if verify_btn:
            self.run_code_verification()
    
    def run_code_verification(self):
        """Run code verification"""
        try:
            with st.spinner("✅ Verifying selected codes..."):
                if not st.session_state.master_agent:
                    st.error("❌ Master agent not initialized. Please refresh the system.")
                    return
                
                if not st.session_state.document_processed:
                    st.error("❌ No document available for verification context.")
                    return
                
                # Prepare document data structure for verification
                document_data = {
                    'anonymized_text': st.session_state.patient_data.get('text', ''),
                    'patient_data': st.session_state.patient_data,
                    'processed': True
                }
                
                # Verify codes
                verification_results = st.session_state.master_agent.verify_codes(
                    st.session_state.selected_codes,
                    document_data
                )
                
                # Store results
                st.session_state.verification_results = verification_results
                
                if verification_results:
                    st.success("✅ Verification complete!")
                    # Show summary
                    approved_count = sum(1 for r in verification_results if r.get('status') in ['approved', 'approved_with_review'])
                    total_count = len(verification_results)
                    st.info(f"📊 Results: {approved_count}/{total_count} codes approved")
                else:
                    st.warning("⚠️ Verification completed with no results.")
                
        except Exception as e:
            st.error(f"❌ Verification failed: {str(e)}")
            logger.error(f"Code verification error: {e}")
            import traceback
            logger.error(traceback.format_exc())
        
        # Display results
        if st.session_state.verification_results:
            st.markdown("<h3 class='section-header'>Verification Results</h3>", 
                       unsafe_allow_html=True)
            
            # Summary statistics
            total_codes = len(st.session_state.verification_results)
            approved_codes = sum(1 for r in st.session_state.verification_results if r.get('status') == 'approved')
            review_codes = sum(1 for r in st.session_state.verification_results if r.get('status') == 'approved_with_review')
            needs_review = sum(1 for r in st.session_state.verification_results if r.get('status') == 'needs_review')
            rejected_codes = sum(1 for r in st.session_state.verification_results if r.get('status') in ['rejected', 'error'])
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("✅ Approved", approved_codes)
            with col2:
                st.metric("⚠️ Review Suggested", review_codes)
            with col3:
                st.metric("📋 Needs Review", needs_review)
            with col4:
                st.metric("❌ Issues Found", rejected_codes)
            
            # Filter options
            status_filter = st.selectbox(
                "Filter by status:",
                ["All", "Approved", "Approved with Review", "Needs Review", "Issues Found"],
                key="verification_filter"
            )
            
            # Filter results based on selection
            filtered_results = st.session_state.verification_results
            if status_filter != "All":
                if status_filter == "Approved":
                    filtered_results = [r for r in filtered_results if r.get('status') == 'approved']
                elif status_filter == "Approved with Review":
                    filtered_results = [r for r in filtered_results if r.get('status') == 'approved_with_review']
                elif status_filter == "Needs Review":
                    filtered_results = [r for r in filtered_results if r.get('status') == 'needs_review']
                elif status_filter == "Issues Found":
                    filtered_results = [r for r in filtered_results if r.get('status') in ['rejected', 'error']]
            
            # Display filtered results with enhanced error handling
            for idx, result in enumerate(filtered_results):
                try:
                    # Safely extract result data with error handling
                    status = result.get('status', 'unknown') if isinstance(result, dict) else 'error'
                    code = result.get('code', 'Unknown') if isinstance(result, dict) else str(result)
                    description = result.get('description', 'No description') if isinstance(result, dict) else 'Error processing result'
                    agent = result.get('agent', 'Unknown') if isinstance(result, dict) else 'Unknown'
                    confidence = result.get('verification_confidence', 0) if isinstance(result, dict) else 0
                    concerns = result.get('concerns', 'No concerns') if isinstance(result, dict) else 'Error in verification'
                    recommendations = result.get('recommendations', 'No recommendations') if isinstance(result, dict) else 'Manual review required'
                    
                    # Safely convert confidence to percentage
                    try:
                        if isinstance(confidence, (int, float)):
                            confidence_pct = int(confidence) if confidence > 1 else int(confidence * 100)
                        else:
                            confidence_pct = 0
                    except (ValueError, TypeError):
                        confidence_pct = 0
                    
                    # Enhanced status mapping
                    if status == 'approved':
                        css_class = "code-approved"
                        status_icon = "✅"
                        status_text = "Approved"
                        status_color = "color: green;"
                    elif status == 'approved_with_review':
                        css_class = "code-warning"
                        status_icon = "⚠️"
                        status_text = "Approved with Review"
                        status_color = "color: orange;"
                    elif status == 'needs_review':
                        css_class = "code-warning"
                        status_icon = "📋"
                        status_text = "Needs Review"
                        status_color = "color: blue;"
                    elif status == 'rejected':
                        css_class = "code-error"
                        status_icon = "❌"
                        status_text = "Rejected"
                        status_color = "color: red;"
                    elif status == 'error':
                        css_class = "code-error"
                        status_icon = "❌"
                        status_text = "Error"
                        status_color = "color: red;"
                    else:
                        css_class = "code-warning"
                        status_icon = "❓"
                        status_text = "Unknown"
                        status_color = "color: gray;"
                    
                    # Display result card
                    st.markdown(f"""
                    <div class="code-card {css_class}">
                        <h4>{status_icon} {code} - {description}</h4>
                        <p><strong>Status:</strong> <span style="{status_color}">{status_text}</span></p>
                        <p><strong>Agent:</strong> {agent} | <strong>Score:</strong> {confidence_pct}%</p>
                        <p><strong>Concerns:</strong> {concerns}</p>
                        <p><strong>Recommendations:</strong> {recommendations}</p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                except Exception as e:
                    logger.error(f"Error displaying verification result {idx}: {e}")
                    # Fallback display for problematic results
                    st.error(f"❌ Error displaying result {idx + 1}: {str(e)}")
                    st.write(f"**Raw result:** {result}")
            
            if not filtered_results:
                st.info("No results match the selected filter.")
        else:
            st.info("No codes have been verified yet. Please select codes and run verification.")
    # This is intentionally left empty - using the primary display_suggested_codes method above
            
        st.markdown("<h3 class='section-header'>AI Code Suggestions</h3>", 
                   unsafe_allow_html=True)
        
        # Log the number of suggested codes for debugging
        logger.info(f"Displaying suggested codes: {len(st.session_state.suggested_codes)} codes found")
        
        # Group by code type
        code_types = {}
        for code in st.session_state.suggested_codes:
            # Ensure each code has a type
            code_type = code.get('type', code.get('agent', 'Unknown')).upper()
            if code_type not in code_types:
                code_types[code_type] = []
            code_types[code_type].append(code)
        
        # Display tabs for each code type
        if code_types:
            tab_labels = list(code_types.keys())
            tabs = st.tabs(tab_labels)
            
            for i, (code_type, codes) in enumerate(code_types.items()):
                with tabs[i]:
                    # Display the number of codes found for this type
                    st.info(f"Found {len(codes)} potential {code_type} codes")
                    
                    for idx, code in enumerate(codes):
                        # Format confidence as percentage with sanity check
                        confidence_value = code.get('confidence', 0)
                        # Ensure confidence is a number between 0 and 1
                        if isinstance(confidence_value, str):
                            try:
                                confidence_value = float(confidence_value)
                            except ValueError:
                                confidence_value = 0.5
                        confidence_value = max(0, min(1, confidence_value))
                        confidence = int(confidence_value * 100)
                        confidence_color = "green" if confidence >= 80 else "orange" if confidence >= 60 else "red"
                        
                        # Check if already selected - use normalized comparison
                        code_value = str(code.get('code', '')).upper().strip()
                        already_selected = any(
                            str(sc.get('code', '')).upper().strip() == code_value
                            for sc in st.session_state.selected_codes
                        )
                        
                        # Create a card for each code with improved visual separation
                        with st.container():
                            cols = st.columns([8, 2])
                            with cols[0]:
                                st.markdown(f"""
                                <div class="code-card" style="margin-bottom:10px; padding:10px; border-radius:5px; border:1px solid #ddd;">
                                    <h4>{code.get('code')} - {code.get('description')}</h4>
                                    <p><strong>Confidence:</strong> <span style="color:{confidence_color}">{confidence}%</span></p>
                                    <p><strong>Evidence:</strong> {code.get('evidence', code.get('reasoning', 'N/A'))}</p>
                                </div>
                                """, unsafe_allow_html=True)
                            
                            with cols[1]:
                                # Create a unique key for each button based on a combination of factors
                                unique_key = f"suggested_{code_type}_{code_value}_{idx}"
                                
                                # Only show add button if not already selected
                                if not already_selected:
                                    if st.button(f"Select", key=unique_key, type="primary"):
                                        # Create a complete code object
                                        selected_code = {
                                            'code': code_value,
                                            'description': code.get('description', 'No description'),
                                            'type': code_type,
                                            'agent': code.get('agent', code_type),
                                            'confidence': confidence_value,
                                            'reasoning': code.get('reasoning', code.get('evidence', 'AI suggested')),
                                            'source': 'ai_analysis'
                                        }
                                        
                                        # Double-check to prevent duplicates
                                        if not any(str(sc.get('code', '')).upper().strip() == code_value 
                                                for sc in st.session_state.selected_codes):
                                            st.session_state.selected_codes.append(selected_code)
                                            logger.info(f"Added code {code_value} to selected codes")
                                            st.success(f"✅ Added {code_value}")
                                        
                                        # Force update and rerun
                                        st.session_state.selected_codes = st.session_state.selected_codes.copy()
                                        st.rerun()
                                else:
                                    st.success("✅ Selected")
    
    def knowledge_base_page(self):
        """Knowledge base management page"""
        st.markdown("<h2 class='section-header'>Knowledge Base Management</h2>", 
                   unsafe_allow_html=True)
        
        if self.kb_manager is None:
            st.error("❌ Knowledge Base Manager not available. Please check your configuration.")
            return
        
        # Knowledge base status section
        st.markdown("### Knowledge Base Status")
        
        col1, col2, col3 = st.columns(3)
        
        # Check status for each knowledge base type
        kb_types = ["icd10", "cpt", "hcpcs"]
        kb_names = {"icd10": "ICD-10", "cpt": "CPT", "hcpcs": "HCPCS"}
        
        for i, kb_type in enumerate(kb_types):
            col = [col1, col2, col3][i]
            with col:
                # Check if PDF exists
                pdf_path = os.path.join(self.knowledge_base_pdfs_dir, f"{kb_type}.pdf")
                pdf_exists = os.path.exists(pdf_path)
                
                # Check if processed JSON exists
                json_path = os.path.join(self.processed_dir, f"{kb_type}_processed.json")
                json_exists = os.path.exists(json_path)
                
                # Determine status
                if pdf_exists and json_exists:
                    status_color = "success"
                    status_icon = "✅"
                    status_text = "Ready"
                elif pdf_exists:
                    status_color = "warning"
                    status_icon = "⚠️"
                    status_text = "Needs Processing"
                else:
                    status_color = "error"
                    status_icon = "❌"
                    status_text = "PDF Missing"
                
                st.markdown(f"""
                <div class="code-card">
                    <h4>{status_icon} {kb_names[kb_type]}</h4>
                    <p><strong>Status:</strong> {status_text}</p>
                    <p><strong>PDF:</strong> {'Found' if pdf_exists else 'Missing'}</p>
                    <p><strong>Processed:</strong> {'Yes' if json_exists else 'No'}</p>
                </div>
                """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # PDF Upload and Processing Section
        st.markdown("### PDF Management")
        
        st.info("""
        📋 **Instructions:**
        - Place your knowledge base PDFs in the `knowledge_base_pdfs/` folder
        - Supported files: `icd10.pdf`, `cpt.pdf`, `hcpcs.pdf`
        - Large PDFs (4000+ pages) are supported
        - Processing may take several minutes for large files
        """)
        
        # Manual upload option
        upload_type = st.selectbox(
            "Select knowledge base type to process:",
            ["icd10", "cpt", "hcpcs"],
            format_func=lambda x: kb_names[x]
        )
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button(f"Process {kb_names[upload_type]}", type="primary", use_container_width=True):
                self.process_knowledge_base(upload_type)
        
        with col2:
            if st.button("Process All Available PDFs", use_container_width=True):
                self.process_all_knowledge_bases()
        
        # Clear processed data option
        if st.button("🗑️ Clear Processed Data", type="secondary"):
            self.clear_processed_knowledge_bases()
    
    def process_knowledge_base(self, kb_type):
        """Process a single knowledge base"""
        if self.kb_manager is None:
            st.error("❌ Knowledge Base Manager not available.")
            return
        
        try:
            # Show processing message
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            status_text.text(f"🔄 Processing {kb_type.upper()} knowledge base...")
            
            # Process the knowledge base
            pdf_path = os.path.join(self.knowledge_base_pdfs_dir, f"{kb_type}.pdf")
            
            if not os.path.exists(pdf_path):
                st.error(f"❌ {kb_type.upper()} PDF not found at {pdf_path}")
                return
            
            # Update progress
            progress_bar.progress(0.2)
            status_text.text(f"📖 Reading {kb_type.upper()} PDF...")
            
            # Process with the knowledge base manager
            success = self.kb_manager.process_pdf_to_json(kb_type)
            
            progress_bar.progress(1.0)
            
            if success:
                status_text.text("")
                progress_bar.empty()
                st.success(f"✅ {kb_type.upper()} knowledge base processed successfully!")
                
                # Refresh agents to load new knowledge base
                st.session_state.agents_initialized = False
                
                # Make sure the agents will load the newly processed knowledge
                if st.session_state.master_agent:
                    if hasattr(st.session_state.master_agent, 'code_searcher') and st.session_state.master_agent.code_searcher:
                        st.session_state.master_agent.code_searcher.load_latest_knowledge_base()
                        status_text.text("🔄 Reloading knowledge base data...")
                
                self.initialize_agents()
                
            else:
                status_text.text("")
                progress_bar.empty()
                st.error(f"❌ Failed to process {kb_type.upper()} knowledge base")
                
        except Exception as e:
            st.error(f"❌ Error processing {kb_type.upper()}: {str(e)}")
    
    def process_all_knowledge_bases(self):
        """Process all available knowledge base PDFs"""
        if self.kb_manager is None:
            st.error("❌ Knowledge Base Manager not available.")
            return
        
        try:
            st.info("🔄 Processing all available knowledge base PDFs...")
            
            # Use the knowledge base manager's process_all_pdfs method
            results = self.kb_manager.process_all_pdfs()
            
            # Display results
            for kb_type, success in results.items():
                if success:
                    st.success(f"✅ {kb_type.upper()} processed successfully!")
                else:
                    st.error(f"❌ Failed to process {kb_type.upper()}")
            
            # Reset agent initialization to reload with new data
            st.session_state.agents_initialized = False
            
            # Force the code searcher to reload the latest knowledge base
            if st.session_state.master_agent:
                if hasattr(st.session_state.master_agent, 'code_searcher') and st.session_state.master_agent.code_searcher:
                    st.session_state.master_agent.code_searcher.load_latest_knowledge_base()
                    st.info("🔄 Reloading knowledge base data...")
            
            self.initialize_agents()
            
        except Exception as e:
            st.error(f"❌ Error processing knowledge bases: {str(e)}")
    
    def clear_processed_knowledge_bases(self):
        """Clear all processed knowledge base data"""
        try:
            kb_data_dir = os.path.join(project_root, 'data', 'knowledge_base')
            
            if os.path.exists(kb_data_dir):
                # Only delete processed files, not sample files
                for kb_type in ["icd10", "cpt", "hcpcs"]:
                    processed_file = os.path.join(kb_data_dir, f"{kb_type}_processed.json")
                    if os.path.exists(processed_file):
                        os.remove(processed_file)
                
            # Clear vector stores
            vector_store_dir = os.path.join(project_root, 'data', 'vector_stores')
            if os.path.exists(vector_store_dir):
                import shutil
                shutil.rmtree(vector_store_dir)
                os.makedirs(vector_store_dir, exist_ok=True)
            
            # Reset agent initialization
            st.session_state.agents_initialized = False
            st.session_state.processing_status = {}
            
            st.success("✅ All processed knowledge base data cleared!")
            st.rerun()
            
        except Exception as e:
            st.error(f"❌ Error clearing data: {str(e)}")
    
    def export_page(self):
        """Export page"""
        st.markdown("<h2 class='section-header'>Export Results</h2>", 
                   unsafe_allow_html=True)
        
        # Debug info
        if st.checkbox("Show Debug Info", key="debug_export"):
            st.write(f"**Debug - Selected codes count:** {len(st.session_state.selected_codes)}")
            st.write(f"**Debug - Selected codes:** {st.session_state.selected_codes}")
        
        if not st.session_state.selected_codes:
            st.warning("⚠️ No codes have been selected to export.")
            st.button("Go to AI Analysis", on_click=self.set_page, args=["AI Analysis"])
            return
        
        # Show selected codes
        st.markdown("### Selected Codes for Export")
        
        for code in st.session_state.selected_codes:
            st.markdown(f"""
            <div class="code-card">
                <h4>{code.get('code')} - {code.get('description')}</h4>
                <p><strong>Type:</strong> {code.get('type', 'Unknown')}</p>
            </div>
            """, unsafe_allow_html=True)
        
        # Export options
        st.markdown("### Export Format")
        
        export_format = st.selectbox(
            "Select export format",
            ["CSV", "Excel", "JSON"]
        )
        
        include_verification = st.checkbox("Include verification results", value=True)
        include_confidence = st.checkbox("Include confidence scores", value=True)
        
        # Export button
        export_btn = st.button("Export Now", type="primary", use_container_width=True)
        
        if export_btn:
            self.export_results(export_format, include_verification, include_confidence)
    
    def export_results(self, export_format, include_verification, include_confidence):
        """Export results to selected format"""
        try:
            # Prepare data for export
            export_data = []
            for code in st.session_state.selected_codes:
                code_data = {
                    'Code': code.get('code'),
                    'Description': code.get('description'),
                    'Type': code.get('type', 'Unknown')
                }
                
                if include_confidence and 'confidence' in code:
                    code_data['Confidence'] = f"{int(code.get('confidence', 0) * 100)}%"
                
                if include_verification and st.session_state.verification_results:
                    # Find verification result for this code
                    for verification in st.session_state.verification_results:
                        if verification.get('code') == code.get('code'):
                            code_data['Verification Status'] = verification.get('status', 'Unknown').title()
                            code_data['Verification Score'] = f"{verification.get('final_score', 0):.0f}%"
                            code_data['Concerns'] = verification.get('concerns', 'None')
                            code_data['Recommendations'] = verification.get('recommendations', 'None')
                            break
                
                export_data.append(code_data)
            
            # Generate file based on format
            if export_format == "CSV":
                df = pd.DataFrame(export_data)
                csv_data = df.to_csv(index=False)
                
                # Create download button
                st.download_button(
                    label="Download CSV",
                    data=csv_data,
                    file_name=f"medical_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
                
            elif export_format == "Excel":
                df = pd.DataFrame(export_data)
                excel_data = BytesIO()
                df.to_excel(excel_data, index=False)
                excel_data.seek(0)
                
                # Create download button
                st.download_button(
                    label="Download Excel",
                    data=excel_data,
                    file_name=f"medical_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                
            else:  # JSON
                json_data = json.dumps(export_data, indent=4)
                
                # Create download button
                st.download_button(
                    label="Download JSON",
                    data=json_data,
                    file_name=f"medical_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json"
                )
            
            st.success("✅ Export prepared successfully! Click the download button above.")
            
        except Exception as e:
            st.error(f"❌ Export failed: {str(e)}")
            logger.error(f"Export error: {e}")

# Run the app
if __name__ == "__main__":
    app = MedicalCodingApp()
    app.run()

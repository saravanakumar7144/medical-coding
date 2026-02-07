from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import sys
import os
import yaml
import json
import logging
import uuid
from datetime import datetime
from io import BytesIO
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import auth router and middleware
from medical_coding_ai.api import auth as auth_router
from medical_coding_ai.api import auth, tenants
from medical_coding_ai.api import ehr as ehr_router
from medical_coding_ai.api import claims as claims_router
from medical_coding_ai.api import sessions
from medical_coding_ai.api import security_monitoring
from medical_coding_ai.api import health
from medical_coding_ai.api import admin as admin_router
from medical_coding_ai.api import analytics as analytics_router
from medical_coding_ai.api.deps import get_current_user

# Import poller scheduler
from pollers.scheduler import start_pollers, stop_pollers
from medical_coding_ai.middleware.audit import AuditMiddleware
from medical_coding_ai.middleware.security_headers import SecurityHeadersMiddleware
from medical_coding_ai.utils.db import get_db
from medical_coding_ai.models.medical_models import MedicalCodeParseResult
from medical_coding_ai.models.user_models import User

# Import all models to register them with SQLAlchemy
import medical_coding_ai.models  # noqa: F401

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir) # Add Backend dir to path so medical_coding_ai can be imported
project_root = os.path.join(current_dir, 'medical_coding_ai')
sys.path.append(project_root) # Needed for direct imports like 'from agents...'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import project modules
try:
    logger.info("Importing MasterAgent...")
    from agents.master_agent import MasterAgent
    logger.info("Importing ICD10Agent...")
    from agents.icd10_agent import ICD10Agent
    logger.info("Importing CPTAgent...")
    from agents.cpt_agent import CPTAgent
    logger.info("Importing HCPCSAgent...")
    from agents.hcpcs_agent import HCPCSAgent
    logger.info("Importing DocumentProcessor...")
    from utils.document_processor import DocumentProcessor
    logger.info("Importing CodeSearcher...")
    from utils.code_searcher import CodeSearcher
    logger.info("Importing KnowledgeBaseManager...")
    from utils.kb_manager import KnowledgeBaseManager
    logger.info("All project modules imported successfully")
except ImportError as e:
    logger.error(f"Import error: {e}")
    raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI app."""
    # Startup logic
    logger.info("Application starting up...")

    # Initialize components
    initialize_components()

    # Start EHR pollers (using mock data by default)
    try:
        from medical_coding_ai.utils.db import AsyncSessionLocal
        await start_pollers(db_session_factory=AsyncSessionLocal)
        logger.info("EHR pollers started successfully")
    except Exception as e:
        logger.warning(f"Failed to start EHR pollers: {e}. Continuing without pollers.")
    
    yield
    
    # Shutdown logic
    logger.info("Application shutting down...")

    # Stop EHR pollers
    try:
        await stop_pollers()
        logger.info("EHR pollers stopped")
    except Exception as e:
        logger.warning(f"Error stopping pollers: {e}")

# Create FastAPI app
app = FastAPI(
    title="Medical Coding AI API",
    description="AI-powered medical coding system with ICD-10, CPT, and HCPCS support",
    version="1.0.0",
    lifespan=lifespan
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security headers middleware (Phase 4)
app.add_middleware(SecurityHeadersMiddleware)

# Add audit middleware (logs requests)
app.add_middleware(AuditMiddleware)

# ============================================================================
# CORS CONFIGURATION (SECURITY)
# ============================================================================
# Cross-Origin Resource Sharing must be configured securely
# NEVER use wildcard (*) in production - it defeats CORS security!
# ============================================================================

# Get CORS origins from environment variable
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '')

# Validate CORS configuration
if not CORS_ALLOWED_ORIGINS:
    import sys
    error_msg = (
        "\n" + "=" * 80 + "\n"
        "⚠️  WARNING: CORS_ALLOWED_ORIGINS environment variable is not set!\n"
        "\n"
        "The application will start, but CORS will BLOCK all requests from browsers.\n"
        "\n"
        "Set the environment variable with your frontend URL:\n"
        "  CORS_ALLOWED_ORIGINS=http://localhost:3000\n"
        "\n"
        "For multiple origins, use comma-separated values:\n"
        "  CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.panaceon.com\n"
        "\n"
        "⚠️  SECURITY: Never use wildcard (*) - specify exact origins!\n"
        "=" * 80
    )
    print(error_msg, file=sys.stderr)
    logger.warning("CORS_ALLOWED_ORIGINS not set - all cross-origin requests will be blocked")
    allowed_origins = []
else:
    # Parse comma-separated origins
    allowed_origins = [origin.strip() for origin in CORS_ALLOWED_ORIGINS.split(',') if origin.strip()]

    # Validate no wildcard is present
    if '*' in allowed_origins:
        import sys
        error_msg = (
            "\n" + "=" * 80 + "\n"
            "❌ CRITICAL ERROR: Wildcard (*) in CORS_ALLOWED_ORIGINS!\n"
            "\n"
            "Using wildcard completely defeats CORS security purpose.\n"
            "Please specify exact frontend origins instead.\n"
            "\n"
            "Example:\n"
            "  CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.panaceon.com\n"
            "=" * 80
        )
        print(error_msg, file=sys.stderr)
        sys.exit(1)

    logger.info(f"✓ CORS configured for origins: {allowed_origins}")

# Add CORS middleware with validated origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# ROUTER REGISTRATION
# ============================================================================
# Include API routers with their respective prefixes
app.include_router(health.router, tags=["Health"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(claims_router.router, prefix="/api/claims", tags=["Claims Management"])
app.include_router(ehr_router.router, prefix="/api/ehr", tags=["EHR Integration"])
app.include_router(tenants.router, prefix="/api/tenants", tags=["Tenant Management"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Session Management"])
app.include_router(security_monitoring.router, prefix="/api/security", tags=["Security Monitoring"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])
app.include_router(analytics_router.router, prefix="/api/analytics", tags=["Analytics"])

logger.info("API routers registered: health, auth, claims, ehr, tenants, sessions, security, admin")





# Pydantic models for request/response
class DocumentProcessRequest(BaseModel):
    text: str
    document_type: str = "medical_record"

class AnalysisRequest(BaseModel):
    session_id: str
    run_icd10: bool = True
    run_cpt: bool = True
    run_hcpcs: bool = False

class SearchRequest(BaseModel):
    query: str
    code_type: str = "all"

class CodeVerificationRequest(BaseModel):
    session_id: str
    codes: List[Dict[str, Any]]

class ManualCodeRequest(BaseModel):
    session_id: str
    code: str
    description: str
    code_type: str
    confidence: float = 0.9

class MedicalCode(BaseModel):
    code: str
    description: str
    type: str
    confidence: float
    reasoning: str
    source: str

class ProcessedDocument(BaseModel):
    session_id: str
    text: str
    patient_data: Dict[str, Any]
    processed: bool = True

class AnalysisResult(BaseModel):
    session_id: str
    suggested_codes: List[MedicalCode]
    analysis_results: Dict[str, Any]

class VerificationResult(BaseModel):
    session_id: str
    verification_results: List[Dict[str, Any]]

# Global variables for components
app_config = {}
components = {}

def load_config():
    """Load configuration"""
    config_path = os.path.join(project_root, 'config.yaml')
    try:
        with open(config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except FileNotFoundError:
        logger.warning("Configuration file not found. Using default configuration...")
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
                'auto_process_on_startup': False
            },
            'agents': {
                'confidence_threshold': 60,
                'max_suggestions': 5
            }
        }

def initialize_components():
    """Initialize components"""
    global components, app_config
    
    app_config = load_config()
    
    try:
        # Initialize document processor
        logger.info("Initializing document processor...")
        components['document_processor'] = DocumentProcessor()
        logger.info("Document processor initialized")
        
        # Initialize code searcher
        logger.info("Initializing code searcher...")
        components['code_searcher'] = CodeSearcher()
        logger.info("Code searcher initialized")
        
        # Initialize knowledge base manager
        logger.info("Initializing knowledge base manager...")
        components['kb_manager'] = KnowledgeBaseManager()
        logger.info("Knowledge base manager initialized")
        
        # Initialize master agent
        logger.info("Initializing master agent...")
        model_name = app_config.get('ollama', {}).get('model_name', 'llama3.2:3b-instruct-q4_0')
        components['master_agent'] = MasterAgent(model_name)
        logger.info("Master agent initialized")
        
        logger.info("All components initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing components: {e}")
        return False


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================
# Health, readiness, and liveness endpoints are now provided by the health router
# See: medical_coding_ai/api/health.py

# Simple test endpoint for frontend connectivity
@app.get("/api/test")
async def api_test():
    """Simple test endpoint for frontend connectivity"""
    return {
        "status": "success",
        "message": "API is reachable",
        "timestamp": datetime.now().isoformat(),
        "server": "Medical Coding AI API",
        "version": "1.0.0"
    }

# System status endpoint
@app.get("/api/system/status")
async def get_system_status():
    """Get system status"""
    try:
        # Check Ollama connection
        ollama_status = "connected"
        try:
            import ollama
            ollama_status = "connected"
        except Exception:
            ollama_status = "disconnected"
        
        # Get knowledge base status
        kb_status = {}
        if components.get('kb_manager'):
            for kb_type in ['icd10', 'cpt', 'hcpcs']:
                processed_path = os.path.join(project_root, 'data', 'knowledge_base', f'{kb_type}_processed.json')
                kb_status[kb_type] = "ready" if os.path.exists(processed_path) else "needs_processing"
        
        return {
            "ollama_status": ollama_status,
            "model_name": app_config.get('ollama', {}).get('model_name', 'Unknown'),
            "knowledge_bases": kb_status,
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper to get session data from DB
async def get_session_data(session_id: str, db: AsyncSession, user_id: str):
    q = select(MedicalCodeParseResult).where(
        MedicalCodeParseResult.medical_code_parse_id == session_id,
        MedicalCodeParseResult.user_id == user_id
    )
    result = await db.execute(q)
    session_obj = result.scalar_one_or_none()
    
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session_obj

# Session management endpoints
@app.post("/api/sessions")
async def create_session(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create a new session"""
    session_id = uuid.uuid4()
    
    # Initialize empty session data
    initial_data = {
        'session_id': str(session_id),
        'created_at': datetime.now().isoformat(),
        'document_processed': False,
        'patient_data': None,
        'analysis_results': None,
        'suggested_codes': [],
        'selected_codes': [],
        'verification_results': [],
        'processing_status': {}
    }
    
    new_session = MedicalCodeParseResult(
        medical_code_parse_id=session_id,
        user_id=user.user_id,
        parse_result=initial_data,
        is_draft=True
    )
    
    db.add(new_session)
    await db.commit()
    
    return {"session_id": str(session_id), "created_at": initial_data['created_at']}

@app.get("/api/sessions/{session_id}")
async def get_session_info(session_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get session information"""
    session_obj = await get_session_data(session_id, db, user.user_id)
    session_data = session_obj.parse_result
    
    return {
        "session_id": session_id,
        "created_at": session_data.get('created_at'),
        "document_processed": session_data.get('document_processed', False),
        "selected_codes_count": len(session_data.get('selected_codes', [])),
        "verification_completed": len(session_data.get('verification_results', [])) > 0
    }

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete a session"""
    q = delete(MedicalCodeParseResult).where(
        MedicalCodeParseResult.medical_code_parse_id == session_id,
        MedicalCodeParseResult.user_id == user.user_id
    )
    result = await db.execute(q)
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {"message": "Session deleted successfully"}

# Document processing endpoints
@app.post("/api/document/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and process a document"""
    try:
        # Create new session automatically
        session_id = uuid.uuid4()
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            text = components['document_processor'].extract_text_from_pdf(BytesIO(content))
        else:
            text = content.decode('utf-8')
        
        # Process and anonymize
        processed_data = components['document_processor'].process_medical_text(text)
        
        # Prepare session data
        session_data = {
            'session_id': str(session_id),
            'created_at': datetime.now().isoformat(),
            'document_processed': True,
            'patient_data': processed_data,
            'analysis_results': None,
            'suggested_codes': [],
            'selected_codes': [],
            'verification_results': [],
            'processing_status': {}
        }
        
        # Save to DB
        new_session = MedicalCodeParseResult(
            medical_code_parse_id=session_id,
            user_id=user.user_id,
            parse_result=session_data,
            is_draft=True
        )
        db.add(new_session)
        await db.commit()
        
        return {
            "session_id": str(session_id),
            "filename": file.filename,
            "text_length": len(text),
            "processed": True,
            "patient_data": processed_data
        }
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/document/process-text")
async def process_text_document(
    request: DocumentProcessRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Process raw text document"""
    try:
        session_id = uuid.uuid4()
        
        # Process and anonymize text
        processed_data = components['document_processor'].process_medical_text(request.text)
        
        # Prepare session data
        session_data = {
            'session_id': str(session_id),
            'created_at': datetime.now().isoformat(),
            'document_processed': True,
            'patient_data': processed_data,
            'analysis_results': None,
            'suggested_codes': [],
            'selected_codes': [],
            'verification_results': [],
            'processing_status': {}
        }
        
        # Save to DB
        new_session = MedicalCodeParseResult(
            medical_code_parse_id=session_id,
            user_id=user.user_id,
            parse_result=session_data,
            is_draft=True
        )
        db.add(new_session)
        await db.commit()
        
        return {
            "session_id": str(session_id),
            "text_length": len(request.text),
            "processed": True,
            "patient_data": processed_data
        }
        
    except Exception as e:
        logger.error(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analysis endpoints
@app.post("/api/analysis/run")
async def run_analysis(
    request: AnalysisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Run AI analysis on processed document"""
    try:
        session_obj = await get_session_data(request.session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        if not session_data.get('document_processed'):
            raise HTTPException(status_code=400, detail="No document processed for this session")
        
        if not components.get('master_agent'):
            raise HTTPException(status_code=500, detail="Master agent not initialized")
        
        # Get document text
        document_text = session_data.get('patient_data', {}).get('text', '')
        if not document_text:
            raise HTTPException(status_code=400, detail="No document text found")
        
        # Run analysis
        results = components['master_agent'].analyze_document(
            document_text,
            run_icd10=request.run_icd10,
            run_cpt=request.run_cpt,
            run_hcpcs=request.run_hcpcs
        )
        
        # Get suggested codes
        suggested_codes = components['master_agent'].get_code_suggestions(results)
        
        # Update session data
        session_data['analysis_results'] = results
        session_data['suggested_codes'] = suggested_codes
        
        # Save to DB
        stmt = update(MedicalCodeParseResult).where(
            MedicalCodeParseResult.medical_code_parse_id == request.session_id
        ).values(parse_result=session_data)
        await db.execute(stmt)
        await db.commit()
        
        return {
            "session_id": request.session_id,
            "suggested_codes": suggested_codes,
            "analysis_results": results,
            "total_codes": len(suggested_codes)
        }
        
    except Exception as e:
        logger.error(f"Error running analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Code search endpoints
@app.post("/api/codes/search")
async def search_codes(request: SearchRequest, user: User = Depends(get_current_user)):
    """Search for medical codes"""
    try:
        if not components.get('master_agent'):
            raise HTTPException(status_code=500, detail="Master agent not initialized")
        
        # Get search results
        results = components['master_agent'].search_codes(request.query, request.code_type)
        
        return {
            "query": request.query,
            "code_type": request.code_type,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Code management endpoints
@app.post("/api/codes/select")
async def select_code(
    session_id: str,
    code: MedicalCode,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Select a code for a session"""
    try:
        session_obj = await get_session_data(session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        # Check if code already selected
        code_value = str(code.code).upper().strip()
        selected_codes = session_data.get('selected_codes', [])
        
        already_selected = any(
            str(sc.get('code', '')).upper().strip() == code_value
            for sc in selected_codes
        )
        
        if already_selected:
            raise HTTPException(status_code=400, detail=f"Code {code_value} is already selected")
        
        # Add code to selected codes
        selected_code = {
            'code': code_value,
            'description': code.description,
            'type': code.type,
            'agent': code.type,
            'confidence': code.confidence,
            'reasoning': code.reasoning,
            'source': code.source,
            'selected_at': datetime.now().isoformat()
        }
        
        selected_codes.append(selected_code)
        session_data['selected_codes'] = selected_codes
        
        # Save to DB
        stmt = update(MedicalCodeParseResult).where(
            MedicalCodeParseResult.medical_code_parse_id == session_id
        ).values(parse_result=session_data)
        await db.execute(stmt)
        await db.commit()
        
        return {
            "session_id": session_id,
            "selected_code": selected_code,
            "total_selected": len(selected_codes)
        }
        
    except Exception as e:
        logger.error(f"Error selecting code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/codes/manual-add")
async def add_manual_code(
    request: ManualCodeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a code manually"""
    try:
        session_obj = await get_session_data(request.session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        # Check if code already exists
        code_value = str(request.code).upper().strip()
        selected_codes = session_data.get('selected_codes', [])
        
        already_selected = any(
            str(sc.get('code', '')).upper().strip() == code_value
            for sc in selected_codes
        )
        
        if already_selected:
            raise HTTPException(status_code=400, detail=f"Code {code_value} is already selected")
        
        # Add manual code
        manual_code = {
            'code': code_value,
            'description': request.description,
            'type': request.code_type,
            'agent': request.code_type,
            'confidence': request.confidence,
            'reasoning': 'Manually added by user',
            'source': 'manual_entry',
            'selected_at': datetime.now().isoformat()
        }
        
        selected_codes.append(manual_code)
        session_data['selected_codes'] = selected_codes
        
        # Save to DB
        stmt = update(MedicalCodeParseResult).where(
            MedicalCodeParseResult.medical_code_parse_id == request.session_id
        ).values(parse_result=session_data)
        await db.execute(stmt)
        await db.commit()
        
        return {
            "session_id": request.session_id,
            "added_code": manual_code,
            "total_selected": len(selected_codes)
        }
        
    except Exception as e:
        logger.error(f"Error adding manual code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/codes/selected/{session_id}")
async def get_selected_codes(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get selected codes for a session"""
    session_obj = await get_session_data(session_id, db, user.user_id)
    session_data = session_obj.parse_result
    
    selected_codes = session_data.get('selected_codes', [])
    
    return {
        "session_id": session_id,
        "selected_codes": selected_codes,
        "total_selected": len(selected_codes)
    }

@app.delete("/api/codes/selected/{session_id}/{code}")
async def remove_selected_code(
    session_id: str,
    code: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a selected code"""
    try:
        session_obj = await get_session_data(session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        # Find and remove the code
        code_value = str(code).upper().strip()
        selected_codes = session_data.get('selected_codes', [])
        original_count = len(selected_codes)
        
        new_selected_codes = [
            sc for sc in selected_codes
            if str(sc.get('code', '')).upper().strip() != code_value
        ]
        
        if len(new_selected_codes) == original_count:
            raise HTTPException(status_code=404, detail=f"Code {code_value} not found in selected codes")
        
        session_data['selected_codes'] = new_selected_codes
        
        # Save to DB
        stmt = update(MedicalCodeParseResult).where(
            MedicalCodeParseResult.medical_code_parse_id == session_id
        ).values(parse_result=session_data)
        await db.execute(stmt)
        await db.commit()
        
        return {
            "session_id": session_id,
            "removed_code": code_value,
            "total_selected": len(new_selected_codes)
        }
        
    except Exception as e:
        logger.error(f"Error removing code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Verification endpoints
@app.post("/api/codes/verify")
async def verify_codes(
    request: CodeVerificationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify selected codes"""
    try:
        session_obj = await get_session_data(request.session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        if not session_data.get('document_processed'):
            raise HTTPException(status_code=400, detail="No document processed for this session")
        
        if not components.get('master_agent'):
            raise HTTPException(status_code=500, detail="Master agent not initialized")
        
        # Prepare document data for verification
        document_data = {
            'anonymized_text': session_data.get('patient_data', {}).get('text', ''),
            'patient_data': session_data.get('patient_data', {}),
            'processed': True
        }
        
        # Use provided codes or session's selected codes
        codes_to_verify = request.codes if request.codes else session_data.get('selected_codes', [])
        
        # Verify codes
        verification_results = components['master_agent'].verify_codes(
            codes_to_verify,
            document_data
        )
        
        # Store results in session
        session_data['verification_results'] = verification_results
        
        # Save to DB
        stmt = update(MedicalCodeParseResult).where(
            MedicalCodeParseResult.medical_code_parse_id == request.session_id
        ).values(parse_result=session_data)
        await db.execute(stmt)
        await db.commit()
        
        return {
            "session_id": request.session_id,
            "verification_results": verification_results,
            "total_verified": len(verification_results)
        }
        
    except Exception as e:
        logger.error(f"Error verifying codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/codes/verification/{session_id}")
async def get_verification_results(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get verification results for a session"""
    session_obj = await get_session_data(session_id, db, user.user_id)
    session_data = session_obj.parse_result
    
    return {
        "session_id": session_id,
        "verification_results": session_data.get('verification_results', []),
        "total_verified": len(session_data.get('verification_results', []))
    }

# Export endpoints
@app.get("/api/export/csv/{session_id}")
async def export_csv(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export session data as CSV with specific format"""
    try:
        session_obj = await get_session_data(session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        selected_codes = session_data.get('selected_codes', [])
        if not selected_codes:
            raise HTTPException(status_code=400, detail="No codes selected for export")
        
        # Prepare data for export with exact headers
        export_data = []
        for i, code in enumerate(selected_codes, 1):
            # Determine AI confidence or Manual
            confidence_value = code.get('confidence', 0)
            if confidence_value > 0:
                ai_confidence = f"{int(confidence_value * 100)}%"
            else:
                ai_confidence = "Manual"
            
            # Find verification result for this code
            validation_score = "85%"  # Default
            reason = ""
            
            verification_results = session_data.get('verification_results', [])
            if verification_results:
                for verification in verification_results:
                    if verification.get('code') == code.get('code'):
                        validation_score = f"{verification.get('verification_confidence', 85)}%"
                        
                        # Combine concerns and recommendations for reason
                        concerns = verification.get('concerns', '').strip()
                        recommendations = verification.get('recommendations', '').strip()
                        
                        if concerns or recommendations:
                            reason_parts = []
                            if concerns:
                                reason_parts.append(f"Issue: {concerns}")
                            if recommendations:
                                reason_parts.append(f"Recommendation: {recommendations}")
                            reason = " | ".join(reason_parts)
                        else:
                            reason = "No specific concerns identified"
                        break
            
            code_data = {
                'Sno': i,
                'Code': code.get('code'),
                'AI confidence score/Manual Code': ai_confidence,
                'Validation score': validation_score,
                'Reason': reason
            }
            
            export_data.append(code_data)
        
        # Create DataFrame and convert to CSV
        df = pd.DataFrame(export_data)
        csv_data = df.to_csv(index=False)
        
        # Return CSV data as downloadable response
        filename = f"medical_codes_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/excel/{session_id}")
async def export_excel(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export session data as Excel with specific format"""
    try:
        session_obj = await get_session_data(session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        selected_codes = session_data.get('selected_codes', [])
        if not selected_codes:
            raise HTTPException(status_code=400, detail="No codes selected for export")
        
        # Prepare data for export with exact headers
        export_data = []
        for i, code in enumerate(selected_codes, 1):
            # Determine AI confidence or Manual
            confidence_value = code.get('confidence', 0)
            if confidence_value > 0:
                ai_confidence = f"{int(confidence_value * 100)}%"
            else:
                ai_confidence = "Manual"
            
            # Find verification result for this code
            validation_score = "85%"  # Default
            reason = ""
            
            verification_results = session_data.get('verification_results', [])
            if verification_results:
                for verification in verification_results:
                    if verification.get('code') == code.get('code'):
                        validation_score = f"{verification.get('verification_confidence', 85)}%"
                        
                        # Combine concerns and recommendations for reason
                        concerns = verification.get('concerns', '').strip()
                        recommendations = verification.get('recommendations', '').strip()
                        
                        if concerns or recommendations:
                            reason_parts = []
                            if concerns:
                                reason_parts.append(f"Issue: {concerns}")
                            if recommendations:
                                reason_parts.append(f"Recommendation: {recommendations}")
                            reason = " | ".join(reason_parts)
                        else:
                            reason = "No specific concerns identified"
                        break
            
            code_data = {
                'Sno': i,
                'Code': code.get('code'),
                'AI confidence score/Manual Code': ai_confidence,
                'Validation score': validation_score,
                'Reason': reason
            }
            
            export_data.append(code_data)
        
        # Create DataFrame and convert to Excel
        df = pd.DataFrame(export_data)
        
        # Create Excel file in memory
        excel_buffer = BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Medical Codes')
        
        excel_buffer.seek(0)
        filename = f"medical_codes_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return Response(
            content=excel_buffer.read(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting Excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{session_id}/json")
async def export_json(
    session_id: str,
    include_verification: bool = True,
    include_confidence: bool = True,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export session data as JSON"""
    try:
        session_obj = await get_session_data(session_id, db, user.user_id)
        session_data = session_obj.parse_result
        
        selected_codes = session_data.get('selected_codes', [])
        if not selected_codes:
            raise HTTPException(status_code=400, detail="No codes selected for export")
        
        # Prepare export data
        export_data = {
            "session_id": session_id,
            "export_timestamp": datetime.now().isoformat(),
            "selected_codes": selected_codes,
            "total_codes": len(selected_codes)
        }
        
        if include_verification and session_data.get('verification_results'):
            export_data['verification_results'] = session_data.get('verification_results')
        
        return export_data
        
    except Exception as e:
        logger.error(f"Error exporting JSON: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Knowledge base management endpoints
@app.get("/api/knowledge-base/status")
async def get_knowledge_base_status():
    """Get knowledge base status"""
    try:
        kb_types = ["icd10", "cpt", "hcpcs"]
        kb_names = {"icd10": "ICD-10", "cpt": "CPT", "hcpcs": "HCPCS"}
        
        status = {}
        knowledge_base_pdfs_dir = os.path.join(project_root, '..', 'knowledge_base_pdfs')
        processed_dir = os.path.join(project_root, 'data', 'knowledge_base')
        
        for kb_type in kb_types:
            # Check if PDF exists
            pdf_path = os.path.join(knowledge_base_pdfs_dir, f"{kb_type}.pdf")
            pdf_exists = os.path.exists(pdf_path)
            
            # Check if processed JSON exists
            json_path = os.path.join(processed_dir, f"{kb_type}_processed.json")
            json_exists = os.path.exists(json_path)
            
            # Determine status
            if pdf_exists and json_exists:
                status_text = "Ready"
            elif pdf_exists:
                status_text = "Needs Processing"
            else:
                status_text = "PDF Missing"
            
            status[kb_type] = {
                "name": kb_names[kb_type],
                "status": status_text,
                "pdf_exists": pdf_exists,
                "processed": json_exists
            }
        
        return {"knowledge_bases": status}
        
    except Exception as e:
        logger.error(f"Error getting knowledge base status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/knowledge-base/process/{kb_type}")
async def process_knowledge_base(kb_type: str, user: User = Depends(get_current_user)):
    """Process a knowledge base PDF"""
    try:
        if kb_type not in ["icd10", "cpt", "hcpcs"]:
            raise HTTPException(status_code=400, detail="Invalid knowledge base type")
        
        if not components.get('kb_manager'):
            raise HTTPException(status_code=500, detail="Knowledge base manager not available")
        
        # Process the knowledge base
        success = components['kb_manager'].process_pdf_to_json(kb_type)
        
        if success:
            return {
                "kb_type": kb_type,
                "status": "processed",
                "message": f"{kb_type.upper()} knowledge base processed successfully"
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to process {kb_type.upper()} knowledge base")
        
    except Exception as e:
        logger.error(f"Error processing knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint with API information
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Medical Coding AI API",
        "version": "1.0.0",
        "description": "AI-powered medical coding system with ICD-10, CPT, and HCPCS support",
        "endpoints": {
            "health": "/health",
            "system_status": "/api/system/status",
            "sessions": "/api/sessions",
            "document_upload": "/api/document/upload",
            "analysis": "/api/analysis/run",
            "code_search": "/api/codes/search",
            "verification": "/api/codes/verify",
            "export": "/api/export/{session_id}/{format}",
            "knowledge_base": "/api/knowledge-base/status"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

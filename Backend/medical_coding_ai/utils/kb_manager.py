import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
import yaml
from datetime import datetime
import hashlib

try:
    import pdfplumber
    # from sentence_transformers import SentenceTransformer
    import faiss
    import numpy as np
    DEPENDENCIES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Some dependencies not available: {e}")
    DEPENDENCIES_AVAILABLE = False
    pdfplumber = None
    SentenceTransformer = None
    faiss = None
    np = None

logger = logging.getLogger(__name__)

class KnowledgeBaseManager:
    """
    Manages large medical coding PDF knowledge bases.
    Converts PDFs to JSON for efficient processing and creates vector embeddings.
    """
    
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.yaml')
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                self.config = yaml.safe_load(file)
        except FileNotFoundError:
            logger.warning("Config file not found, using defaults")
            self.config = self._default_config()
        
        # Initialize paths
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.pdf_source_dir = os.path.join(self.project_root, 'knowledge_base_pdfs')
        self.processed_dir = os.path.join(self.project_root, 'medical_coding_ai', 'data', 'knowledge_base')
        self.embeddings_dir = os.path.join(self.processed_dir, 'embeddings')
        
        # Create directories if they don't exist
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.embeddings_dir, exist_ok=True)
        
        # Initialize sentence transformer lazily
        self._encoder = None

    @property
    def encoder(self):
        if self._encoder is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Sentence transformer loaded successfully")
            except Exception as e:
                logger.error(f"Error loading sentence transformer: {e}")
                self._encoder = None
        return self._encoder
        
        # Processing parameters
        self.chunk_size = self.config.get('knowledge_base', {}).get('chunk_size', 1000)
        self.chunk_overlap = self.config.get('knowledge_base', {}).get('chunk_overlap', 200)
        
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration"""
        return {
            'knowledge_base': {
                'chunk_size': 1000,
                'chunk_overlap': 200,
                'auto_process_on_startup': True
            }
        }
    
    def check_pdfs_available(self) -> Dict[str, bool]:
        """Check which PDF files are available"""
        pdfs = {
            'icd10': os.path.exists(os.path.join(self.pdf_source_dir, 'icd10.pdf')),
            'cpt': os.path.exists(os.path.join(self.pdf_source_dir, 'cpt.pdf')),
            'hcpcs': os.path.exists(os.path.join(self.pdf_source_dir, 'hcpcs.pdf'))
        }
        
        logger.info(f"PDF availability: {pdfs}")
        return pdfs
    
    def get_pdf_info(self, pdf_path: str) -> Dict[str, Any]:
        """Get information about a PDF file"""
        if not os.path.exists(pdf_path):
            return {'exists': False}
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                info = {
                    'exists': True,
                    'pages': len(pdf.pages),
                    'file_size': os.path.getsize(pdf_path),
                    'file_size_mb': round(os.path.getsize(pdf_path) / (1024 * 1024), 2),
                    'title': pdf.metadata.get('Title', 'Unknown') if pdf.metadata else 'Unknown'
                }
                
                # Get file modification time for cache validation
                info['modified_time'] = os.path.getmtime(pdf_path)
                info['hash'] = self._get_file_hash(pdf_path)
                
                return info
        except Exception as e:
            logger.error(f"Error getting PDF info for {pdf_path}: {e}")
            return {'exists': True, 'error': str(e)}
    
    def _get_file_hash(self, file_path: str) -> str:
        """Get MD5 hash of file for change detection"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                # Read in chunks to handle large files
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            logger.error(f"Error calculating hash for {file_path}: {e}")
            return ""
    
    def needs_reprocessing(self, pdf_type: str) -> bool:
        """Check if PDF needs reprocessing based on modification time"""
        pdf_path = os.path.join(self.pdf_source_dir, f'{pdf_type}.pdf')
        json_path = os.path.join(self.processed_dir, f'{pdf_type}_processed.json')
        
        if not os.path.exists(pdf_path):
            return False
        
        if not os.path.exists(json_path):
            return True
        
        # Check if PDF is newer than processed JSON
        pdf_time = os.path.getmtime(pdf_path)
        json_time = os.path.getmtime(json_path)
        
        return pdf_time > json_time
    
    def process_pdf_to_json(self, pdf_type: str, progress_callback=None) -> bool:
        """
        Process a large PDF file and convert to JSON format
        
        Args:
            pdf_type: 'icd10', 'cpt', or 'hcpcs'
            progress_callback: Optional callback function for progress updates
        
        Returns:
            bool: True if successful, False otherwise
        """
        pdf_path = os.path.join(self.pdf_source_dir, f'{pdf_type}.pdf')
        json_path = os.path.join(self.processed_dir, f'{pdf_type}_processed.json')
        
        if not os.path.exists(pdf_path):
            logger.warning(f"PDF file not found: {pdf_path}")
            return False
        
        logger.info(f"Processing {pdf_type.upper()} PDF to JSON...")
        
        extracted_codes = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                logger.info(f"Processing {total_pages} pages for {pdf_type.upper()}")
                
                for page_num, page in enumerate(pdf.pages, 1):
                    try:
                        text = page.extract_text()
                        if text:
                            # Extract codes based on type
                            if pdf_type == 'icd10':
                                page_codes = self._extract_icd10_codes_from_text(text, page_num)
                            elif pdf_type == 'cpt':
                                page_codes = self._extract_cpt_codes_from_text(text, page_num)
                            elif pdf_type == 'hcpcs':
                                page_codes = self._extract_hcpcs_codes_from_text(text, page_num)
                            else:
                                page_codes = []
                            
                            extracted_codes.extend(page_codes)
                        
                        # Progress reporting
                        if progress_callback and page_num % 50 == 0:
                            progress = (page_num / total_pages) * 100
                            progress_callback(f"Processing page {page_num}/{total_pages} ({progress:.1f}%)")
                        
                        if page_num % 100 == 0:
                            logger.info(f"Processed {page_num}/{total_pages} pages, found {len(extracted_codes)} codes")
                            
                    except Exception as e:
                        logger.warning(f"Error processing page {page_num}: {e}")
                        continue
            
            # Save processed data
            processed_data = {
                'pdf_type': pdf_type,
                'processed_date': datetime.now().isoformat(),
                'total_codes': len(extracted_codes),
                'source_file': f'{pdf_type}.pdf',
                'codes': extracted_codes
            }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(processed_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Successfully processed {pdf_type.upper()}: {len(extracted_codes)} codes saved to {json_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing {pdf_type} PDF: {e}")
            return False
    
    def _extract_icd10_codes_from_text(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract ICD-10 codes from text"""
        codes = []
        
        # ICD-10 pattern: Letter followed by 2-3 digits, optional decimal and more digits
        icd10_pattern = r'([A-Z]\d{2}\.?\d*)\s+([^\n\r]{10,200})'
        
        matches = re.finditer(icd10_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        for match in matches:
            code = match.group(1).strip().upper()
            description = match.group(2).strip()
            
            # Clean up description
            description = re.sub(r'\s+', ' ', description)
            description = description.split('\n')[0]  # Take first line only
            
            if len(description) > 10 and len(code) >= 3:
                codes.append({
                    'code': code,
                    'description': description,
                    'type': 'ICD-10',
                    'page': page_num,
                    'text_chunk': f"{code} - {description}"
                })
        
        return codes
    
    def _extract_cpt_codes_from_text(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract CPT codes from text"""
        codes = []
        
        # CPT pattern: 5 digits followed by description
        cpt_pattern = r'(\d{5})\s+([^\n\r]{10,200})'
        
        matches = re.finditer(cpt_pattern, text, re.MULTILINE)
        
        for match in matches:
            code = match.group(1).strip()
            description = match.group(2).strip()
            
            # Clean up description
            description = re.sub(r'\s+', ' ', description)
            description = description.split('\n')[0]  # Take first line only
            
            if len(description) > 10:
                codes.append({
                    'code': code,
                    'description': description,
                    'type': 'CPT',
                    'page': page_num,
                    'text_chunk': f"{code} - {description}"
                })
        
        return codes
    
    def _extract_hcpcs_codes_from_text(self, text: str, page_num: int) -> List[Dict[str, Any]]:
        """Extract HCPCS codes from text"""
        codes = []
        
        # HCPCS pattern: Letter followed by 4 digits
        hcpcs_pattern = r'([A-Z]\d{4})\s+([^\n\r]{10,200})'
        
        matches = re.finditer(hcpcs_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        for match in matches:
            code = match.group(1).strip().upper()
            description = match.group(2).strip()
            
            # Clean up description
            description = re.sub(r'\s+', ' ', description)
            description = description.split('\n')[0]  # Take first line only
            
            if len(description) > 10:
                codes.append({
                    'code': code,
                    'description': description,
                    'type': 'HCPCS',
                    'page': page_num,
                    'text_chunk': f"{code} - {description}"
                })
        
        return codes
    
    def create_embeddings(self, pdf_type: str, progress_callback=None) -> bool:
        """Create vector embeddings for processed codes"""
        if not self.encoder:
            logger.error("Sentence transformer not available")
            return False
        
        json_path = os.path.join(self.processed_dir, f'{pdf_type}_processed.json')
        embeddings_path = os.path.join(self.embeddings_dir, f'{pdf_type}_embeddings.faiss')
        
        if not os.path.exists(json_path):
            logger.warning(f"Processed JSON not found: {json_path}")
            return False
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            codes = data.get('codes', [])
            if not codes:
                logger.warning(f"No codes found in {json_path}")
                return False
            
            logger.info(f"Creating embeddings for {len(codes)} {pdf_type.upper()} codes")
            
            # Extract text chunks for embedding
            texts = [code.get('text_chunk', '') for code in codes]
            
            # Create embeddings in batches to manage memory
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_embeddings = self.encoder.encode(batch, show_progress_bar=False)
                all_embeddings.extend(batch_embeddings)
                
                if progress_callback:
                    progress = ((i + len(batch)) / len(texts)) * 100
                    progress_callback(f"Creating embeddings: {i + len(batch)}/{len(texts)} ({progress:.1f}%)")
            
            # Convert to numpy array
            embeddings_array = np.array(all_embeddings)
            
            # Create FAISS index
            dimension = embeddings_array.shape[1]
            index = faiss.IndexFlatIP(dimension)  # Inner product (cosine similarity)
            
            # Normalize vectors for cosine similarity
            faiss.normalize_L2(embeddings_array)
            index.add(embeddings_array)
            
            # Save FAISS index
            faiss.write_index(index, embeddings_path)
            
            logger.info(f"Embeddings saved: {embeddings_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating embeddings for {pdf_type}: {e}")
            return False
    
    def load_processed_codes(self, pdf_type: str) -> List[Dict[str, Any]]:
        """Load processed codes from JSON file"""
        json_path = os.path.join(self.processed_dir, f'{pdf_type}_processed.json')
        
        if not os.path.exists(json_path):
            logger.warning(f"Processed JSON not found: {json_path}, using sample data")
            return self._load_sample_codes(pdf_type)
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            codes = data.get('codes', [])
            logger.info(f"Loaded {len(codes)} {pdf_type.upper()} codes from processed JSON")
            return codes
            
        except Exception as e:
            logger.error(f"Error loading processed codes for {pdf_type}: {e}")
            return self._load_sample_codes(pdf_type)
    
    def _load_sample_codes(self, pdf_type: str) -> List[Dict[str, Any]]:
        """Load sample codes as fallback"""
        try:
            sample_path = os.path.join(self.processed_dir, f'sample_{pdf_type}_codes.json')
            with open(sample_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load sample {pdf_type} codes: {e}")
            return []
    
    def process_all_pdfs(self, progress_callback=None) -> Dict[str, bool]:
        """Process all available PDFs"""
        results = {}
        pdf_types = ['icd10', 'cpt', 'hcpcs']
        
        for pdf_type in pdf_types:
            if progress_callback:
                progress_callback(f"Processing {pdf_type.upper()} PDF...")
            
            # Process PDF to JSON
            json_success = self.process_pdf_to_json(pdf_type, progress_callback)
            
            # Create embeddings
            embeddings_success = False
            if json_success:
                if progress_callback:
                    progress_callback(f"Creating embeddings for {pdf_type.upper()}...")
                embeddings_success = self.create_embeddings(pdf_type, progress_callback)
            
            results[pdf_type] = json_success and embeddings_success
        
        return results
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of knowledge base"""
        status = {
            'pdf_availability': self.check_pdfs_available(),
            'processed_files': {},
            'embeddings_available': {}
        }
        
        for pdf_type in ['icd10', 'cpt', 'hcpcs']:
            json_path = os.path.join(self.processed_dir, f'{pdf_type}_processed.json')
            embeddings_path = os.path.join(self.embeddings_dir, f'{pdf_type}_embeddings.faiss')
            
            status['processed_files'][pdf_type] = os.path.exists(json_path)
            status['embeddings_available'][pdf_type] = os.path.exists(embeddings_path)
            
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    status[f'{pdf_type}_codes_count'] = data.get('total_codes', 0)
                    status[f'{pdf_type}_processed_date'] = data.get('processed_date', 'Unknown')
                except:
                    pass
        
        return status

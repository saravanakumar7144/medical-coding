import pdfplumber
import re
import yaml
from typing import List, Dict, Any
# from sentence_transformers import SentenceTransformer
import logging
import os

logger = logging.getLogger(__name__)

class PDFKnowledgeProcessor:
    """Process medical coding PDF knowledge bases"""
    
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.yaml')
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                self.config = yaml.safe_load(file)
        except FileNotFoundError:
            logger.warning("Config file not found, using defaults")
            self.config = {'knowledge_base': {'chunk_size': 1000, 'chunk_overlap': 200}}
        
        self._encoder = None

    @property
    def encoder(self):
        if self._encoder is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.error(f"Error loading sentence transformer: {e}")
                self._encoder = None
        return self._encoder
        
        self.chunk_size = self.config.get('knowledge_base', {}).get('chunk_size', 1000)
        self.chunk_overlap = self.config.get('knowledge_base', {}).get('chunk_overlap', 200)
    
    def process_icd10_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Process ICD-10 PDF and extract code mappings"""
        logger.info(f"Processing ICD-10 PDF: {pdf_path}")
        
        # If PDF doesn't exist, use sample data
        if not os.path.exists(pdf_path):
            logger.warning(f"PDF not found at {pdf_path}, using sample ICD-10 data")
            return self._load_sample_icd10_codes()
        
        codes = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        extracted_codes = self._extract_icd10_codes(text)
                        codes.extend(extracted_codes)
                        
                        if page_num % 10 == 0:  # Progress logging
                            logger.info(f"Processed {page_num + 1} pages, found {len(codes)} codes so far")
            
            logger.info(f"Extracted {len(codes)} ICD-10 codes")
            return codes
            
        except Exception as e:
            logger.error(f"Error processing ICD-10 PDF: {e}")
            return self._get_sample_icd10_codes()  # Fallback to sample data
    
    def process_cpt_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Process CPT PDF and extract procedure codes"""
        logger.info(f"Processing CPT PDF: {pdf_path}")
        
        # If PDF doesn't exist, use sample data
        if not os.path.exists(pdf_path):
            logger.warning(f"PDF not found at {pdf_path}, using sample CPT data")
            return self._load_sample_cpt_codes()
        
        codes = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        extracted_codes = self._extract_cpt_codes(text)
                        codes.extend(extracted_codes)
                        
                        if page_num % 10 == 0:
                            logger.info(f"Processed {page_num + 1} pages, found {len(codes)} codes so far")
            
            logger.info(f"Extracted {len(codes)} CPT codes")
            return codes
            
        except Exception as e:
            logger.error(f"Error processing CPT PDF: {e}")
            return self._load_sample_cpt_codes()
    
    def process_hcpcs_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Process HCPCS PDF and extract supply/equipment codes"""
        logger.info(f"Processing HCPCS PDF: {pdf_path}")
        
        # If PDF doesn't exist, use sample data
        if not os.path.exists(pdf_path):
            logger.warning(f"PDF not found at {pdf_path}, using sample HCPCS data")
            return self._load_sample_hcpcs_codes()
        
        codes = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        extracted_codes = self._extract_hcpcs_codes(text)
                        codes.extend(extracted_codes)
                        
                        if page_num % 10 == 0:
                            logger.info(f"Processed {page_num + 1} pages, found {len(codes)} codes so far")
            
            logger.info(f"Extracted {len(codes)} HCPCS codes")
            return codes
            
        except Exception as e:
            logger.error(f"Error processing HCPCS PDF: {e}")
            return self._get_sample_hcpcs_codes()
    
    def _extract_icd10_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract ICD-10 codes from text"""
        codes = []
        
        # Multiple patterns for ICD-10 codes
        patterns = [
            # Standard pattern: Code followed by description
            r'([A-Z]\d{2}\.?\d*)\s+([^\n\r]+?)(?=\n[A-Z]\d{2}|\n\n|\Z)',
            # Table format
            r'([A-Z]\d{2}\.?\d*)\s*[\t\s]+([^\n\r]+)',
            # With additional formatting
            r'^([A-Z]\d{2}\.?\d*)\s*[-\s]*(.+?)$'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
            
            for code, description in matches:
                code = code.strip()
                description = description.strip()
                
                # Validate ICD-10 format
                if self._validate_icd10_code(code) and len(description) > 5:
                    codes.append({
                        'code': code,
                        'description': self._clean_description(description),
                        'type': 'ICD-10',
                        'text_chunk': f"{code} {description}",
                        'embedding': None
                    })
        
        return codes
    
    def _extract_cpt_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract CPT codes from text"""
        codes = []
        
        patterns = [
            # 5-digit CPT codes
            r'(\d{5})\s+([^\n\r]+?)(?=\n\d{5}|\n\n|\Z)',
            r'^(\d{5})\s*[-\s]*(.+?)$'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
            
            for code, description in matches:
                code = code.strip()
                description = description.strip()
                
                # Validate CPT format (5 digits)
                if len(code) == 5 and code.isdigit() and len(description) > 5:
                    codes.append({
                        'code': code,
                        'description': self._clean_description(description),
                        'type': 'CPT',
                        'text_chunk': f"{code} {description}",
                        'embedding': None
                    })
        
        return codes
    
    def _extract_hcpcs_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract HCPCS codes from text"""
        codes = []
        
        patterns = [
            # HCPCS format: Letter followed by 4 digits
            r'([A-Z]\d{4})\s+([^\n\r]+?)(?=\n[A-Z]\d{4}|\n\n|\Z)',
            r'^([A-Z]\d{4})\s*[-\s]*(.+?)$'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
            
            for code, description in matches:
                code = code.strip()
                description = description.strip()
                
                # Validate HCPCS format
                if self._validate_hcpcs_code(code) and len(description) > 5:
                    codes.append({
                        'code': code,
                        'description': self._clean_description(description),
                        'type': 'HCPCS',
                        'text_chunk': f"{code} {description}",
                        'embedding': None
                    })
        
        return codes
    
    def _validate_icd10_code(self, code: str) -> bool:
        """Validate ICD-10 code format"""
        # ICD-10: Letter + 2 digits + optional decimal + optional digits
        pattern = r'^[A-Z]\d{2}\.?\d*$'
        return re.match(pattern, code) is not None
    
    def _validate_hcpcs_code(self, code: str) -> bool:
        """Validate HCPCS code format"""
        # HCPCS: Letter + 4 digits
        pattern = r'^[A-Z]\d{4}$'
        return re.match(pattern, code) is not None
    
    def _clean_description(self, description: str) -> str:
        """Clean and normalize description text"""
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', description)
        
        # Remove common artifacts
        cleaned = re.sub(r'\[\w+\]', '', cleaned)  # Remove bracketed text
        cleaned = re.sub(r'\d+\.\d+', '', cleaned)  # Remove version numbers
        cleaned = re.sub(r'Page \d+', '', cleaned, flags=re.IGNORECASE)
        
        # Trim and capitalize first letter
        cleaned = cleaned.strip()
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:] if len(cleaned) > 1 else cleaned.upper()
        
        return cleaned
    
    def generate_embeddings(self, codes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate embeddings for code descriptions"""
        if not self.encoder:
            logger.warning("Sentence transformer not available, skipping embeddings")
            return codes
        
        if not codes:
            return codes
        
        try:
            texts = [code['text_chunk'] for code in codes]
            logger.info(f"Generating embeddings for {len(texts)} codes...")
            
            embeddings = self.encoder.encode(texts, show_progress_bar=True)
            
            for i, code in enumerate(codes):
                code['embedding'] = embeddings[i]
            
            logger.info("Embeddings generated successfully")
            return codes
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return codes
    
    def _get_sample_icd10_codes(self) -> List[Dict[str, Any]]:
        """Get sample ICD-10 codes as fallback"""
        return [
            {
                'code': 'E11.9',
                'description': 'Type 2 diabetes mellitus without complications',
                'type': 'ICD-10',
                'text_chunk': 'E11.9 Type 2 diabetes mellitus without complications',
                'embedding': None
            },
            {
                'code': 'I10',
                'description': 'Essential hypertension',
                'type': 'ICD-10',
                'text_chunk': 'I10 Essential hypertension',
                'embedding': None
            },
            {
                'code': 'Z96669',
                'description': 'Presence of unspecified artificial ankle joint',
                'type': 'ICD-10',
                'text_chunk': 'Z96669 Presence of unspecified artificial ankle joint',
                'embedding': None
            },
            {
                'code': 'E78.5',
                'description': 'Hyperlipidemia, unspecified',
                'type': 'ICD-10',
                'text_chunk': 'E78.5 Hyperlipidemia, unspecified',
                'embedding': None
            },
            {
                'code': 'J45.20',
                'description': 'Mild intermittent asthma, uncomplicated',
                'type': 'ICD-10',
                'text_chunk': 'J45.20 Mild intermittent asthma, uncomplicated',
                'embedding': None
            }
        ]
    
    def _get_sample_cpt_codes(self) -> List[Dict[str, Any]]:
        """Get sample CPT codes as fallback"""
        return [
            {
                'code': '99213',
                'description': 'Office or other outpatient visit for established patient, low to moderate complexity',
                'type': 'CPT',
                'text_chunk': '99213 Office or other outpatient visit for established patient, low to moderate complexity',
                'embedding': None
            },
            {
                'code': '12001',
                'description': 'Simple repair of superficial wounds of scalp, neck, axillae, external genitalia, trunk and/or extremities; 2.5 cm or less',
                'type': 'CPT',
                'text_chunk': '12001 Simple repair of superficial wounds of scalp, neck, axillae, external genitalia, trunk and/or extremities; 2.5 cm or less',
                'embedding': None
            },
            {
                'code': '71020',
                'description': 'Radiologic examination, chest, 2 views, frontal and lateral',
                'type': 'CPT',
                'text_chunk': '71020 Radiologic examination, chest, 2 views, frontal and lateral',
                'embedding': None
            }
        ]
    
    def _get_sample_hcpcs_codes(self) -> List[Dict[str, Any]]:
        """Get sample HCPCS codes as fallback"""
        return [
            {
                'code': 'L3000',
                'description': 'Foot insert, removable, molded to patient model, longitudinal arch support',
                'type': 'HCPCS',
                'text_chunk': 'L3000 Foot insert, removable, molded to patient model, longitudinal arch support',
                'embedding': None
            },
            {
                'code': 'E0100',
                'description': 'Cane, includes canes of all materials, adjustable or fixed, with tip',
                'type': 'HCPCS',
                'text_chunk': 'E0100 Cane, includes canes of all materials, adjustable or fixed, with tip',
                'embedding': None
            }
        ]
    
    def _load_sample_icd10_codes(self) -> List[Dict[str, Any]]:
        """Load sample ICD-10 codes when PDF is not available"""
        try:
            import json
            sample_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'knowledge_base', 'sample_icd10_codes.json')
            with open(sample_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load sample ICD-10 codes: {e}")
            return []
    
    def _load_sample_cpt_codes(self) -> List[Dict[str, Any]]:
        """Load sample CPT codes when PDF is not available"""
        try:
            import json
            sample_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'knowledge_base', 'sample_cpt_codes.json')
            with open(sample_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load sample CPT codes: {e}")
            return []
    
    def _load_sample_hcpcs_codes(self) -> List[Dict[str, Any]]:
        """Load sample HCPCS codes when PDF is not available"""
        try:
            import json
            sample_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'knowledge_base', 'sample_hcpcs_codes.json')
            with open(sample_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load sample HCPCS codes: {e}")
            return []

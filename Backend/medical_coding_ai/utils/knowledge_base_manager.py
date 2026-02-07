"""
Knowledge Base Manager for Medical Coding AI

This module handles large PDF files (4000+ pages) and converts them to optimized JSON
for fast RAG-based retrieval. Place your PDF files in the knowledge_base/ directory:

📁 knowledge_base/
├── icd10_codes.pdf     (Place your ICD-10 manual here)
├── cpt_codes.pdf       (Place your CPT manual here)
├── hcpcs_codes.pdf     (Place your HCPCS manual here)
└── processed/          (Auto-generated JSON files)
    ├── icd10_processed.json
    ├── cpt_processed.json
    └── hcpcs_processed.json

The system will automatically detect and process these PDFs on startup.
"""

import os
import json
import pdfplumber
import re
from typing import List, Dict, Any, Optional
# from sentence_transformers import SentenceTransformer
import logging
from pathlib import Path
import yaml
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

class KnowledgeBaseManager:
    """Manages large medical coding PDF files and converts them to optimized JSON"""
    
    def __init__(self, config_path: str = None):
        self.base_dir = Path(__file__).parent.parent / "knowledge_base"
        self.processed_dir = self.base_dir / "processed"
        
        # Ensure directories exist
        self.base_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
        
        # Load configuration
        if config_path is None:
            config_path = Path(__file__).parent.parent / 'config.yaml'
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                self.config = yaml.safe_load(file)
        except FileNotFoundError:
            logger.warning("Config file not found, using defaults")
            self.config = self._get_default_config()
        
        # Initialize sentence transformer lazily
        self._encoder = None
        
    @property
    def encoder(self):
        if self._encoder is None:
            try:
                logger.info("Initializing SentenceTransformer...")
                from sentence_transformers import SentenceTransformer
                self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("SentenceTransformer initialized")
            except Exception as e:
                logger.error(f"Error loading sentence transformer: {e}")
                self._encoder = None
        return self._encoder
        
        # PDF file mappings
        self.pdf_files = {
            'icd10': self.base_dir / 'icd10_codes.pdf',
            'cpt': self.base_dir / 'cpt_codes.pdf',
            'hcpcs': self.base_dir / 'hcpcs_codes.pdf'
        }
        
        # Processed JSON files
        self.json_files = {
            'icd10': self.processed_dir / 'icd10_processed.json',
            'cpt': self.processed_dir / 'cpt_processed.json',
            'hcpcs': self.processed_dir / 'hcpcs_processed.json'
        }
        
        # Metadata files for tracking changes
        self.metadata_files = {
            'icd10': self.processed_dir / 'icd10_metadata.json',
            'cpt': self.processed_dir / 'cpt_metadata.json',
            'hcpcs': self.processed_dir / 'hcpcs_metadata.json'
        }
    
    def _get_default_config(self):
        """Get default configuration"""
        return {
            'knowledge_base': {
                'chunk_size': 1000,
                'chunk_overlap': 200,
                'batch_size': 100,
                'max_pages_per_batch': 50
            }
        }
    
    def check_and_process_pdfs(self) -> Dict[str, bool]:
        """Check for PDF files and process them if needed"""
        logger.info("Checking for PDF files in knowledge base...")
        
        results = {}
        
        for code_type, pdf_path in self.pdf_files.items():
            logger.info(f"Checking {code_type.upper()} PDF: {pdf_path}")
            
            if pdf_path.exists():
                # Check if processing is needed
                if self._needs_processing(code_type, pdf_path):
                    logger.info(f"Processing {code_type.upper()} PDF...")
                    success = self._process_pdf(code_type, pdf_path)
                    results[code_type] = success
                else:
                    logger.info(f"{code_type.upper()} already processed and up-to-date")
                    results[code_type] = True
            else:
                logger.warning(f"{code_type.upper()} PDF not found at {pdf_path}")
                results[code_type] = False
        
        return results
    
    def _needs_processing(self, code_type: str, pdf_path: Path) -> bool:
        """Check if PDF needs to be processed"""
        json_path = self.json_files[code_type]
        metadata_path = self.metadata_files[code_type]
        
        # If JSON doesn't exist, need to process
        if not json_path.exists():
            return True
        
        # If metadata doesn't exist, need to process
        if not metadata_path.exists():
            return True
        
        try:
            # Check if PDF has been modified since last processing
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            pdf_hash = self._get_file_hash(pdf_path)
            return metadata.get('file_hash') != pdf_hash
            
        except Exception as e:
            logger.error(f"Error checking metadata for {code_type}: {e}")
            return True
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Get MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _process_pdf(self, code_type: str, pdf_path: Path) -> bool:
        """Process a large PDF file and convert to optimized JSON"""
        try:
            logger.info(f"Starting processing of {code_type.upper()} PDF: {pdf_path}")
            
            codes = []
            batch_size = self.config.get('knowledge_base', {}).get('batch_size', 100)
            max_pages_per_batch = self.config.get('knowledge_base', {}).get('max_pages_per_batch', 50)
            
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                logger.info(f"Processing {total_pages} pages for {code_type.upper()}")
                
                batch_text = ""
                pages_in_batch = 0
                
                for page_num, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text() or ""
                        batch_text += page_text + "\n"
                        pages_in_batch += 1
                        
                        # Process batch when it reaches the limit
                        if pages_in_batch >= max_pages_per_batch:
                            batch_codes = self._extract_codes_from_text(batch_text, code_type)
                            codes.extend(batch_codes)
                            
                            logger.info(f"Processed pages {page_num - pages_in_batch + 1}-{page_num + 1}, "
                                      f"extracted {len(batch_codes)} codes (total: {len(codes)})")
                            
                            # Reset batch
                            batch_text = ""
                            pages_in_batch = 0
                        
                        # Progress logging
                        if (page_num + 1) % 100 == 0:
                            progress = ((page_num + 1) / total_pages) * 100
                            logger.info(f"Progress: {progress:.1f}% ({page_num + 1}/{total_pages} pages)")
                    
                    except Exception as e:
                        logger.warning(f"Error processing page {page_num + 1}: {e}")
                        continue
                
                # Process remaining text
                if batch_text.strip():
                    batch_codes = self._extract_codes_from_text(batch_text, code_type)
                    codes.extend(batch_codes)
                    logger.info(f"Processed final batch, extracted {len(batch_codes)} codes")
            
            # Generate embeddings if encoder is available
            if self.encoder and codes:
                logger.info(f"Generating embeddings for {len(codes)} codes...")
                codes = self._generate_embeddings(codes)
            
            # Save processed data
            self._save_processed_data(code_type, codes, pdf_path)
            
            logger.info(f"Successfully processed {code_type.upper()}: {len(codes)} codes extracted")
            return True
            
        except Exception as e:
            logger.error(f"Error processing {code_type} PDF: {e}")
            return False
    
    def _extract_codes_from_text(self, text: str, code_type: str) -> List[Dict[str, Any]]:
        """Extract medical codes from text based on type"""
        if code_type == 'icd10':
            return self._extract_icd10_codes(text)
        elif code_type == 'cpt':
            return self._extract_cpt_codes(text)
        elif code_type == 'hcpcs':
            return self._extract_hcpcs_codes(text)
        else:
            return []
    
    def _extract_icd10_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract ICD-10 codes from text"""
        codes = []
        
        # Enhanced patterns for ICD-10 codes
        patterns = [
            # Standard format: A00.0 Description
            r'([A-Z]\d{2}\.?\d{0,2})\s+([^\n\r]+?)(?=\n(?:[A-Z]\d{2}\.?\d{0,2}|\s*$))',
            # With additional details
            r'^([A-Z]\d{2}\.?\d{0,2})\s*[-:\s]*(.+?)$',
            # Table format
            r'([A-Z]\d{2}\.?\d{0,2})\s*\|\s*([^|\n]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                code = match.group(1).strip().upper()
                description = match.group(2).strip()
                
                # Validate ICD-10 format
                if self._validate_icd10_code(code) and len(description) > 10:
                    # Clean description
                    description = self._clean_description(description)
                    
                    if description:
                        codes.append({
                            'code': code,
                            'description': description,
                            'type': 'ICD-10',
                            'text_chunk': f"{code} {description}",
                            'category': self._get_icd10_category(code)
                        })
        
        return self._deduplicate_codes(codes)
    
    def _extract_cpt_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract CPT codes from text"""
        codes = []
        
        patterns = [
            # Standard format: 12345 Description
            r'(\d{5})\s+([^\n\r]+?)(?=\n(?:\d{5}|\s*$))',
            # With additional formatting
            r'^(\d{5})\s*[-:\s]*(.+?)$',
            # Table format
            r'(\d{5})\s*\|\s*([^|\n]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE)
            for match in matches:
                code = match.group(1).strip()
                description = match.group(2).strip()
                
                # Validate CPT format and description
                if self._validate_cpt_code(code) and len(description) > 10:
                    description = self._clean_description(description)
                    
                    if description:
                        codes.append({
                            'code': code,
                            'description': description,
                            'type': 'CPT',
                            'text_chunk': f"{code} {description}",
                            'category': self._get_cpt_category(code)
                        })
        
        return self._deduplicate_codes(codes)
    
    def _extract_hcpcs_codes(self, text: str) -> List[Dict[str, Any]]:
        """Extract HCPCS codes from text"""
        codes = []
        
        patterns = [
            # Standard format: A1234 Description
            r'([A-Z]\d{4})\s+([^\n\r]+?)(?=\n(?:[A-Z]\d{4}|\s*$))',
            # With additional formatting
            r'^([A-Z]\d{4})\s*[-:\s]*(.+?)$',
            # Table format
            r'([A-Z]\d{4})\s*\|\s*([^|\n]+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.MULTILINE)
            for match in matches:
                code = match.group(1).strip().upper()
                description = match.group(2).strip()
                
                # Validate HCPCS format and description
                if self._validate_hcpcs_code(code) and len(description) > 10:
                    description = self._clean_description(description)
                    
                    if description:
                        codes.append({
                            'code': code,
                            'description': description,
                            'type': 'HCPCS',
                            'text_chunk': f"{code} {description}",
                            'category': self._get_hcpcs_category(code)
                        })
        
        return self._deduplicate_codes(codes)
    
    def _validate_icd10_code(self, code: str) -> bool:
        """Validate ICD-10 code format"""
        pattern = r'^[A-Z]\d{2}\.?\d{0,2}$'
        return re.match(pattern, code) is not None
    
    def _validate_cpt_code(self, code: str) -> bool:
        """Validate CPT code format"""
        return len(code) == 5 and code.isdigit()
    
    def _validate_hcpcs_code(self, code: str) -> bool:
        """Validate HCPCS code format"""
        pattern = r'^[A-Z]\d{4}$'
        return re.match(pattern, code) is not None
    
    def _clean_description(self, description: str) -> str:
        """Clean and normalize description text"""
        if not description:
            return ""
        
        # Remove extra whitespace and special characters
        cleaned = re.sub(r'\s+', ' ', description.strip())
        cleaned = re.sub(r'^[\d\.\-\|\s]+', '', cleaned)
        cleaned = re.sub(r'[\|\t]+', ' ', cleaned)
        
        # Remove common artifacts
        cleaned = re.sub(r'\b(see also|refer to|code also)\b.*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\([^)]*\)$', '', cleaned)  # Remove trailing parentheses
        
        return cleaned.strip()
    
    def _get_icd10_category(self, code: str) -> str:
        """Get ICD-10 category based on code prefix"""
        if not code:
            return "Unknown"
        
        prefix = code[0]
        categories = {
            'A': 'Infectious diseases', 'B': 'Infectious diseases',
            'C': 'Neoplasms', 'D': 'Blood diseases',
            'E': 'Endocrine disorders', 'F': 'Mental disorders',
            'G': 'Nervous system', 'H': 'Eye and ear',
            'I': 'Circulatory system', 'J': 'Respiratory system',
            'K': 'Digestive system', 'L': 'Skin diseases',
            'M': 'Musculoskeletal', 'N': 'Genitourinary',
            'O': 'Pregnancy/childbirth', 'P': 'Perinatal',
            'Q': 'Congenital', 'R': 'Symptoms/signs',
            'S': 'Injury/poisoning', 'T': 'Injury/poisoning',
            'V': 'External causes', 'W': 'External causes',
            'X': 'External causes', 'Y': 'External causes',
            'Z': 'Health status'
        }
        return categories.get(prefix, "Unknown")
    
    def _get_cpt_category(self, code: str) -> str:
        """Get CPT category based on code range"""
        if not code or not code.isdigit():
            return "Unknown"
        
        code_num = int(code)
        
        if 10000 <= code_num <= 69999:
            return "Surgery"
        elif 70000 <= code_num <= 79999:
            return "Radiology"
        elif 80000 <= code_num <= 89999:
            return "Pathology/Laboratory"
        elif 90000 <= code_num <= 99999:
            return "Medicine"
        else:
            return "Other"
    
    def _get_hcpcs_category(self, code: str) -> str:
        """Get HCPCS category based on code prefix"""
        if not code:
            return "Unknown"
        
        prefix = code[0]
        categories = {
            'A': 'Transportation/Medical supplies',
            'B': 'Enteral/Parenteral therapy',
            'C': 'Outpatient PPS',
            'D': 'Dental procedures',
            'E': 'Durable medical equipment',
            'G': 'Procedures/Services',
            'H': 'Alcohol/Drug abuse',
            'J': 'Drugs administered other than oral',
            'K': 'Temporary codes',
            'L': 'Orthotics/Prosthetics',
            'M': 'Medical services',
            'P': 'Pathology/Laboratory',
            'Q': 'Temporary codes',
            'R': 'Diagnostic radiology',
            'S': 'Temporary national codes',
            'T': 'State Medicaid agency codes',
            'V': 'Vision/Hearing services'
        }
        return categories.get(prefix, "Unknown")
    
    def _deduplicate_codes(self, codes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate codes based on code value"""
        seen_codes = set()
        unique_codes = []
        
        for code_data in codes:
            code = code_data.get('code', '')
            if code and code not in seen_codes:
                seen_codes.add(code)
                unique_codes.append(code_data)
        
        return unique_codes
    
    def _generate_embeddings(self, codes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate embeddings for codes"""
        if not self.encoder:
            logger.warning("No encoder available for embeddings")
            return codes
        
        try:
            # Extract text for embedding
            texts = [code['text_chunk'] for code in codes]
            
            # Generate embeddings in batches
            batch_size = 100
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                batch_embeddings = self.encoder.encode(batch_texts, show_progress_bar=True)
                
                # Add embeddings to codes
                for j, embedding in enumerate(batch_embeddings):
                    codes[i + j]['embedding'] = embedding.tolist()
            
            logger.info(f"Generated embeddings for {len(codes)} codes")
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
        
        return codes
    
    def _save_processed_data(self, code_type: str, codes: List[Dict[str, Any]], pdf_path: Path):
        """Save processed codes to JSON"""
        json_path = self.json_files[code_type]
        metadata_path = self.metadata_files[code_type]
        
        # Save codes
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(codes, f, indent=2, ensure_ascii=False)
        
        # Save metadata
        metadata = {
            'file_hash': self._get_file_hash(pdf_path),
            'processed_at': datetime.now().isoformat(),
            'total_codes': len(codes),
            'pdf_path': str(pdf_path),
            'json_path': str(json_path)
        }
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Saved {len(codes)} {code_type.upper()} codes to {json_path}")
    
    def load_processed_codes(self, code_type: str) -> List[Dict[str, Any]]:
        """Load processed codes from JSON"""
        json_path = self.json_files[code_type]
        
        if not json_path.exists():
            logger.warning(f"No processed data found for {code_type}")
            return self._load_sample_codes(code_type)
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                codes = json.load(f)
            
            logger.info(f"Loaded {len(codes)} {code_type.upper()} codes from processed data")
            return codes
            
        except Exception as e:
            logger.error(f"Error loading {code_type} codes: {e}")
            return self._load_sample_codes(code_type)
    
    def _load_sample_codes(self, code_type: str) -> List[Dict[str, Any]]:
        """Load sample codes as fallback"""
        try:
            sample_path = Path(__file__).parent / 'data' / 'knowledge_base' / f'sample_{code_type}_codes.json'
            
            if sample_path.exists():
                with open(sample_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading sample {code_type} codes: {e}")
        
        return []
    
    def get_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        stats = {
            'pdf_files': {},
            'processed_files': {},
            'total_codes': 0
        }
        
        for code_type in ['icd10', 'cpt', 'hcpcs']:
            # PDF file status
            pdf_path = self.pdf_files[code_type]
            stats['pdf_files'][code_type] = {
                'exists': pdf_path.exists(),
                'path': str(pdf_path),
                'size_mb': round(pdf_path.stat().st_size / (1024 * 1024), 2) if pdf_path.exists() else 0
            }
            
            # Processed file status
            json_path = self.json_files[code_type]
            if json_path.exists():
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        codes = json.load(f)
                    
                    stats['processed_files'][code_type] = {
                        'exists': True,
                        'count': len(codes),
                        'path': str(json_path)
                    }
                    stats['total_codes'] += len(codes)
                    
                except Exception:
                    stats['processed_files'][code_type] = {
                        'exists': False,
                        'count': 0,
                        'path': str(json_path)
                    }
            else:
                stats['processed_files'][code_type] = {
                    'exists': False,
                    'count': 0,
                    'path': str(json_path)
                }
        
        return stats
    
    def create_pdf_placement_guide(self):
        """Create a guide for placing PDF files"""
        guide_path = self.base_dir / "README_PDF_PLACEMENT.md"
        
        guide_content = """# Medical Coding PDF Placement Guide

## 📁 Where to Place Your PDF Files

Place your medical coding PDF files in this directory with these exact names:

### Required Files:
1. **icd10_codes.pdf** - Your ICD-10-CM/PCS Manual
2. **cpt_codes.pdf** - Your CPT Manual  
3. **hcpcs_codes.pdf** - Your HCPCS Level II Manual

### File Sources:
- Download from CMS.gov (Centers for Medicare & Medicaid Services)
- Purchase from AMA (American Medical Association) for CPT
- Use official coding manuals from your organization

### File Size Considerations:
- These files can be 4000+ pages and several hundred MB
- The system will automatically process them into optimized JSON format
- First-time processing may take 30-60 minutes per file
- Subsequent startups will be much faster (using cached JSON)

### Processing Status:
The system will automatically:
1. ✅ Detect if PDF files exist
2. ✅ Check if they need processing (new/modified files)
3. ✅ Extract medical codes with descriptions
4. ✅ Generate embeddings for RAG search
5. ✅ Save optimized JSON in the processed/ folder

### Current Status:
Run the application to see the current status of your PDF files.
Check the system status in the sidebar for processing information.

### Note:
If PDF files are not available, the system will use built-in sample data
for demonstration purposes.
"""
        
        with open(guide_path, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        logger.info(f"Created PDF placement guide at {guide_path}")


if __name__ == "__main__":
    # Example usage
    kb_manager = KnowledgeBaseManager()
    kb_manager.create_pdf_placement_guide()
    
    # Check and process PDFs
    results = kb_manager.check_and_process_pdfs()
    print("Processing results:", results)
    
    # Get statistics
    stats = kb_manager.get_stats()
    print("Knowledge base stats:", stats)

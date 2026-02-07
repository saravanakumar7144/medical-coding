import re
import sys
import os
import json
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

logger = logging.getLogger(__name__)

class CodeSearcher:
    """Search and retrieve medical codes from knowledge bases"""
    
    def __init__(self):
        self.icd10_codes = []
        self.cpt_codes = []
        self.hcpcs_codes = []
        self.load_latest_knowledge_base()
    
    def load_latest_knowledge_base(self):
        """Load the latest knowledge base from processed JSON files"""
        # Define paths to processed JSON files
        processed_dir = Path(project_root) / 'data' / 'knowledge_base'
        sample_dir = Path(project_root) / 'data' / 'knowledge_base'
        
        # Make sure directories exist
        os.makedirs(processed_dir, exist_ok=True)
        
        icd10_json = processed_dir / 'icd10_processed.json'
        cpt_json = processed_dir / 'cpt_processed.json'
        hcpcs_json = processed_dir / 'hcpcs_processed.json'
        
        # Check for sample data if processed files don't exist
        sample_icd10 = sample_dir / 'sample_icd10_codes.json'
        sample_cpt = sample_dir / 'sample_cpt_codes.json'
        sample_hcpcs = sample_dir / 'sample_hcpcs_codes.json'
        
        # Try loading ICD-10 codes
        if icd10_json.exists():
            try:
                with open(icd10_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'codes' in data:
                        self.icd10_codes = data['codes']
                    else:
                        self.icd10_codes = data if isinstance(data, list) else []
                logger.info(f"Loaded {len(self.icd10_codes)} ICD-10 codes from processed data")
            except Exception as e:
                logger.error(f"Error loading ICD-10 codes: {e}")
                # Try loading sample data
                if sample_icd10.exists():
                    try:
                        with open(sample_icd10, 'r', encoding='utf-8') as f:
                            self.icd10_codes = json.load(f)
                        logger.info(f"Loaded {len(self.icd10_codes)} ICD-10 codes from sample data")
                    except Exception as ex:
                        logger.error(f"Error loading sample ICD-10 codes: {ex}")
                        self.load_sample_icd10_codes()
                else:
                    self.load_sample_icd10_codes()
        else:
            logger.warning(f"No processed ICD-10 data found at {icd10_json}")
            # Try loading sample data
            if sample_icd10.exists():
                try:
                    with open(sample_icd10, 'r', encoding='utf-8') as f:
                        self.icd10_codes = json.load(f)
                    logger.info(f"Loaded {len(self.icd10_codes)} ICD-10 codes from sample data")
                except Exception as ex:
                    logger.error(f"Error loading sample ICD-10 codes: {ex}")
                    self.load_sample_icd10_codes()
            else:
                self.load_sample_icd10_codes()
        
        # Try loading CPT codes
        if cpt_json.exists():
            try:
                with open(cpt_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'codes' in data:
                        self.cpt_codes = data['codes']
                    else:
                        self.cpt_codes = data if isinstance(data, list) else []
                logger.info(f"Loaded {len(self.cpt_codes)} CPT codes from processed data")
            except Exception as e:
                logger.error(f"Error loading CPT codes: {e}")
                self.load_sample_cpt_codes()
        else:
            logger.warning(f"No processed CPT data found at {cpt_json}")
            self.load_sample_cpt_codes()
        
        # Try loading HCPCS codes
        if hcpcs_json.exists():
            try:
                with open(hcpcs_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'codes' in data:
                        self.hcpcs_codes = data['codes']
                    else:
                        self.hcpcs_codes = data if isinstance(data, list) else []
                logger.info(f"Loaded {len(self.hcpcs_codes)} HCPCS codes from processed data")
            except Exception as e:
                logger.error(f"Error loading HCPCS codes: {e}")
                self.load_sample_hcpcs_codes()
        else:
            logger.warning(f"No processed HCPCS data found at {hcpcs_json}")
            self.load_sample_hcpcs_codes()
    
    def reload_knowledge_base(self):
        """Reload the knowledge base from processed JSON files"""
        logger.info("Reloading knowledge base data...")
        self.load_latest_knowledge_base()
    
    def load_sample_icd10_codes(self):
        """Load sample ICD-10 codes for demonstration"""
        # Sample ICD-10 codes based on your attachment
        self.icd10_codes = [
            # Diabetes codes
            {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications", "type": "ICD-10"},
            {"code": "E11.21", "description": "Type 2 diabetes mellitus with diabetic nephropathy", "type": "ICD-10"},
            {"code": "E11.22", "description": "Type 2 diabetes mellitus with diabetic chronic kidney disease", "type": "ICD-10"},
            {"code": "E11.29", "description": "Type 2 diabetes mellitus with other diabetic kidney complication", "type": "ICD-10"},
            {"code": "E11.311", "description": "Type 2 diabetes mellitus with unspecified diabetic retinopathy with macular edema", "type": "ICD-10"},
            {"code": "E11.319", "description": "Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema", "type": "ICD-10"},
            {"code": "E11.36", "description": "Type 2 diabetes mellitus with diabetic cataract", "type": "ICD-10"},
            {"code": "E11.40", "description": "Type 2 diabetes mellitus with diabetic neuropathy, unspecified", "type": "ICD-10"},
            {"code": "E11.51", "description": "Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene", "type": "ICD-10"},
            {"code": "E11.52", "description": "Type 2 diabetes mellitus with diabetic peripheral angiopathy with gangrene", "type": "ICD-10"},
            {"code": "E11.59", "description": "Type 2 diabetes mellitus with other circulatory complications", "type": "ICD-10"},
            {"code": "E11.610", "description": "Type 2 diabetes mellitus with diabetic neuropathic arthropathy", "type": "ICD-10"},
            {"code": "E11.618", "description": "Type 2 diabetes mellitus with other diabetic arthropathy", "type": "ICD-10"},
            {"code": "E11.620", "description": "Type 2 diabetes mellitus with diabetic dermatitis", "type": "ICD-10"},
            {"code": "E11.621", "description": "Type 2 diabetes mellitus with foot ulcer", "type": "ICD-10"},
            {"code": "E11.622", "description": "Type 2 diabetes mellitus with other skin ulcer", "type": "ICD-10"},
            {"code": "E11.628", "description": "Type 2 diabetes mellitus with other skin complications", "type": "ICD-10"},
            # Artificial joint codes
            {"code": "Z96621", "description": "Presence of right artificial elbow joint", "type": "ICD-10"},
            {"code": "Z96622", "description": "Presence of left artificial elbow joint", "type": "ICD-10"},
            {"code": "Z96629", "description": "Presence of unspecified artificial elbow joint", "type": "ICD-10"},
            {"code": "Z96631", "description": "Presence of right artificial wrist joint", "type": "ICD-10"},
            {"code": "Z96632", "description": "Presence of left artificial wrist joint", "type": "ICD-10"},
            {"code": "Z96639", "description": "Presence of unspecified artificial wrist joint", "type": "ICD-10"},
            {"code": "Z96641", "description": "Presence of right artificial hip joint", "type": "ICD-10"},
            {"code": "Z96642", "description": "Presence of left artificial hip joint", "type": "ICD-10"},
            {"code": "Z96643", "description": "Presence of artificial hip joint, bilateral", "type": "ICD-10"},
            {"code": "Z96649", "description": "Presence of unspecified artificial hip joint", "type": "ICD-10"},
            {"code": "Z96651", "description": "Presence of right artificial knee joint", "type": "ICD-10"},
            {"code": "Z96652", "description": "Presence of left artificial knee joint", "type": "ICD-10"},
            {"code": "Z96653", "description": "Presence of artificial knee joint, bilateral", "type": "ICD-10"},
            {"code": "Z96659", "description": "Presence of unspecified artificial knee joint", "type": "ICD-10"},
            {"code": "Z96661", "description": "Presence of right artificial ankle joint", "type": "ICD-10"},
            {"code": "Z96662", "description": "Presence of left artificial ankle joint", "type": "ICD-10"},
            {"code": "Z96669", "description": "Presence of unspecified artificial ankle joint", "type": "ICD-10"},
            {"code": "Z96691", "description": "Finger-joint replacement of right hand", "type": "ICD-10"},
            {"code": "Z96692", "description": "Finger-joint replacement of left hand", "type": "ICD-10"},
            {"code": "Z96693", "description": "Finger-joint replacement, bilateral", "type": "ICD-10"},
            {"code": "Z96698", "description": "Presence of other orthopedic joint implants", "type": "ICD-10"},
            {"code": "Z967", "description": "Presence of other bone and tendon implants", "type": "ICD-10"},
            {"code": "Z9681", "description": "Presence of artificial skin", "type": "ICD-10"},
            {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications", "type": "ICD-10"},
            {"code": "I10", "description": "Essential hypertension", "type": "ICD-10"},
            {"code": "E78.5", "description": "Hyperlipidemia, unspecified", "type": "ICD-10"},
            {"code": "J45.20", "description": "Mild intermittent asthma, uncomplicated", "type": "ICD-10"},
            {"code": "K58.9", "description": "Irritable bowel syndrome without diarrhea", "type": "ICD-10"},
            {"code": "K21.9", "description": "Gastro-esophageal reflux disease without esophagitis", "type": "ICD-10"},
            {"code": "J10", "description": "Essential hypertension", "type": "ICD-10"}
        ]
        logger.info(f"Loaded {len(self.icd10_codes)} sample ICD-10 codes")
    
    def load_sample_cpt_codes(self):
        """Load sample CPT codes for demonstration"""
        # Sample CPT codes
        self.cpt_codes = [
            {"code": "99213", "description": "Office or other outpatient visit for established patient, low to moderate complexity", "type": "CPT"},
            {"code": "99214", "description": "Office or other outpatient visit for established patient, moderate complexity", "type": "CPT"},
            {"code": "99215", "description": "Office or other outpatient visit for established patient, high complexity", "type": "CPT"},
            {"code": "99212", "description": "Office or other outpatient visit for established patient, straightforward", "type": "CPT"},
            {"code": "99201", "description": "Office or other outpatient visit for new patient, straightforward", "type": "CPT"},
            {"code": "99202", "description": "Office or other outpatient visit for new patient, low complexity", "type": "CPT"},
            {"code": "99203", "description": "Office or other outpatient visit for new patient, moderate complexity", "type": "CPT"},
            {"code": "99204", "description": "Office or other outpatient visit for new patient, moderate to high complexity", "type": "CPT"},
            {"code": "99205", "description": "Office or other outpatient visit for new patient, high complexity", "type": "CPT"},
            {"code": "12001", "description": "Simple repair of superficial wounds of scalp, neck, axillae, external genitalia, trunk and/or extremities; 2.5 cm or less", "type": "CPT"},
            {"code": "71020", "description": "Radiologic examination, chest, 2 views, frontal and lateral", "type": "CPT"},
            {"code": "93000", "description": "Electrocardiogram, routine ECG with at least 12 leads; with interpretation and report", "type": "CPT"},
            {"code": "36415", "description": "Collection of venous blood by venipuncture", "type": "CPT"},
            {"code": "80053", "description": "Comprehensive metabolic panel", "type": "CPT"},
            {"code": "85025", "description": "Blood count; complete (CBC), automated (Hgb, Hct, RBC, WBC and platelet count) and automated differential WBC count", "type": "CPT"}
        ]
        logger.info(f"Loaded {len(self.cpt_codes)} sample CPT codes")
    
    def load_sample_hcpcs_codes(self):
        """Load sample HCPCS codes for demonstration"""
        # Sample HCPCS codes
        self.hcpcs_codes = [
            {"code": "L3000", "description": "Foot insert, removable, molded to patient model, longitudinal arch support", "type": "HCPCS"},
            {"code": "E0100", "description": "Cane, includes canes of all materials, adjustable or fixed, with tip", "type": "HCPCS"},
            {"code": "E0130", "description": "Walker, rigid (pickup), adjustable or fixed height", "type": "HCPCS"},
            {"code": "E0140", "description": "Walker, with trunk support, adjustable or fixed height, any type", "type": "HCPCS"},
            {"code": "E1390", "description": "Oxygen concentrator, single delivery port, capable of delivering 85 percent or greater oxygen concentration at the prescribed flow rate", "type": "HCPCS"},
            {"code": "E0424", "description": "Stationary compressed gaseous oxygen system, rental; includes container, contents, regulator, flowmeter, humidifier, nebulizer, cannula or mask, and tubing", "type": "HCPCS"},
            {"code": "K0001", "description": "Standard wheelchair", "type": "HCPCS"},
            {"code": "L1900", "description": "Ankle foot orthosis, spring wire, dorsiflexion assist calf band, custom fabricated", "type": "HCPCS"},
            {"code": "L8400", "description": "Prosthetic sheath, below knee, each", "type": "HCPCS"},
            {"code": "L8420", "description": "Prosthetic sock, multiple ply, below knee, each", "type": "HCPCS"},
            {"code": "A4100", "description": "Skin barrier, solid, 4 x 4 or equivalent, each", "type": "HCPCS"},
            {"code": "A4206", "description": "Syringe with needle, sterile, 1 cc or less, each", "type": "HCPCS"},
            {"code": "A4253", "description": "Blood glucose test or reagent strips for home blood glucose monitor, per 50 strips", "type": "HCPCS"}
        ]
        logger.info(f"Loaded {len(self.hcpcs_codes)} sample HCPCS codes")
    
    def search(self, query: str, code_type: str = "all", max_results: int = 20) -> List[Dict[str, Any]]:
        """Search for medical codes by query and type"""
        logger.info(f"Searching for '{query}' in {code_type} codes")
        
        if not query or len(query.strip()) < 2:
            return []
        
        query_lower = query.lower().strip()
        results = []
        
        # Determine which databases to search
        databases = self._get_search_databases(code_type)
        
        # Search in each database
        for database in databases:
            for code_data in database:
                relevance_score = self._calculate_relevance(query_lower, code_data)
                if relevance_score > 0:
                    result = code_data.copy()
                    result['relevance_score'] = relevance_score
                    results.append(result)
        
        # Sort by relevance and return top results
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:max_results]
    
    def search_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Search for a specific code"""
        code_upper = code.upper().strip()
        
        # Search in all databases
        all_codes = self.icd10_codes + self.cpt_codes + self.hcpcs_codes
        
        for code_data in all_codes:
            if code_data['code'].upper() == code_upper:
                return code_data
        
        return None
    
    def search_by_description(self, description: str, code_type: str = "all") -> List[Dict[str, Any]]:
        """Search for codes by description keywords"""
        return self.search(description, code_type)
    
    def get_similar_codes(self, reference_code: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Get codes similar to a reference code"""
        reference = self.search_by_code(reference_code)
        if not reference:
            return []
        
        # Search for codes with similar descriptions
        similar = self.search(reference['description'], reference['type'], max_results + 1)
        
        # Remove the reference code itself and return
        return [code for code in similar if code['code'] != reference_code][:max_results]
    
    def _get_search_databases(self, code_type: str) -> List[List[Dict[str, Any]]]:
        """Get databases to search based on code type"""
        databases = []
        code_type = code_type.lower()
        
        if code_type in ["all", "icd10", "icd-10"]:
            databases.append(self.icd10_codes)
        if code_type in ["all", "cpt"]:
            databases.append(self.cpt_codes)
        if code_type in ["all", "hcpcs"]:
            databases.append(self.hcpcs_codes)
        
        return databases
    
    def _calculate_relevance(self, query: str, code_data: Dict[str, Any]) -> float:
        """Calculate relevance score for a code based on query"""
        score = 0.0
        
        code = code_data['code'].lower()
        description = code_data['description'].lower()
        
        # Exact code match gets highest score
        if query == code:
            score += 100.0
        
        # Partial code match
        elif query in code:
            score += 80.0
        
        # Code starts with query
        elif code.startswith(query):
            score += 70.0
        
        # Exact description match
        if query == description:
            score += 90.0
        
        # Description contains query as whole word
        elif self._contains_whole_word(description, query):
            score += 60.0
        
        # Description contains query as substring
        elif query in description:
            score += 40.0
        
        # Check for individual query words in description
        query_words = query.split()
        if len(query_words) > 1:
            word_matches = sum(1 for word in query_words if word in description)
            word_score = (word_matches / len(query_words)) * 30.0
            score += word_score
        
        # Bonus for popular/common codes
        score += self._get_popularity_bonus(code_data)
        
        return score
    
    def _contains_whole_word(self, text: str, word: str) -> bool:
        """Check if text contains word as a complete word"""
        pattern = r'\b' + re.escape(word) + r'\b'
        return re.search(pattern, text) is not None
    
    def _get_popularity_bonus(self, code_data: Dict[str, Any]) -> float:
        """Get popularity bonus for commonly used codes"""
        common_codes = {
            'ICD-10': ['E11.9', 'I10', 'E78.5', 'Z96669'],
            'CPT': ['99213', '99214', '99215', '71020'],
            'HCPCS': ['E0100', 'L3000', 'K0001']
        }
        
        code_type = code_data.get('type', '')
        code = code_data.get('code', '')
        
        if code_type in common_codes and code in common_codes[code_type]:
            return 5.0
        
        return 0.0
    
    def get_code_categories(self, code_type: str = "all") -> Dict[str, List[str]]:
        """Get categories of codes available"""
        categories = {}
        code_type = code_type.lower()
        
        if code_type in ["all", "icd10", "icd-10"]:
            icd_categories = self._categorize_icd10_codes()
            categories.update(icd_categories)
        
        if code_type in ["all", "cpt"]:
            cpt_categories = self._categorize_cpt_codes()
            categories.update(cpt_categories)
        
        if code_type in ["all", "hcpcs"]:
            hcpcs_categories = self._categorize_hcpcs_codes()
            categories.update(hcpcs_categories)
        
        return categories
    
    def _categorize_icd10_codes(self) -> Dict[str, List[str]]:
        """Categorize ICD-10 codes"""
        categories = {}
        
        for code_data in self.icd10_codes:
            code = code_data['code']
            if code.startswith('Z96'):
                category = 'Prosthetic Devices and Implants'
            elif code.startswith('E'):
                category = 'Endocrine, Nutritional and Metabolic Diseases'
            elif code.startswith('I'):
                category = 'Circulatory System Diseases'
            elif code.startswith('J'):
                category = 'Respiratory System Diseases'
            elif code.startswith('K'):
                category = 'Digestive System Diseases'
            else:
                category = 'Other'
            
            if category not in categories:
                categories[category] = []
            categories[category].append(code)
        
        return categories
    
    def _categorize_cpt_codes(self) -> Dict[str, List[str]]:
        """Categorize CPT codes"""
        categories = {}
        
        for code_data in self.cpt_codes:
            code = code_data['code']
            try:
                code_num = int(code)
                
                if 99201 <= code_num <= 99499:
                    category = 'Evaluation and Management'
                elif 10000 <= code_num <= 69999:
                    category = 'Surgery'
                elif 70000 <= code_num <= 79999:
                    category = 'Radiology'
                elif 80000 <= code_num <= 89999:
                    category = 'Pathology and Laboratory'
                elif 90000 <= code_num <= 99999:
                    category = 'Medicine'
                else:
                    category = 'Other'
            except (ValueError, TypeError):
                category = 'Other'
            
            if category not in categories:
                categories[category] = []
            categories[category].append(code)
        
        return categories
    
    def _categorize_hcpcs_codes(self) -> Dict[str, List[str]]:
        """Categorize HCPCS codes"""
        categories = {}
        
        for code_data in self.hcpcs_codes:
            code = code_data['code']
            if not code or len(code) < 1:
                continue
                
            first_letter = code[0]
            
            if first_letter == 'A':
                category = 'Transportation Services and Medical Supplies'
            elif first_letter == 'E':
                category = 'Durable Medical Equipment'
            elif first_letter == 'K':
                category = 'Temporary Codes'
            elif first_letter == 'L':
                category = 'Orthotic and Prosthetic Procedures'
            else:
                category = 'Other'
            
            if category not in categories:
                categories[category] = []
            categories[category].append(code)
        
        return categories
    
    def get_search_suggestions(self, partial_query: str, max_suggestions: int = 10) -> List[str]:
        """Get search suggestions based on partial query"""
        if len(partial_query) < 2:
            return []
        
        suggestions = set()
        partial_lower = partial_query.lower()
        
        # Search for matching codes and descriptions
        all_codes = self.icd10_codes + self.cpt_codes + self.hcpcs_codes
        
        for code_data in all_codes:
            code = code_data.get('code', '')
            description = code_data.get('description', '')
            
            # Add matching codes
            if code and code.lower().startswith(partial_lower):
                suggestions.add(code)
            
            # Add matching description words
            if description:
                words = description.lower().split()
                for word in words:
                    if word.startswith(partial_lower) and len(word) > 3:
                        suggestions.add(word.title())
        
        return sorted(list(suggestions))[:max_suggestions]
    
    def validate_code_format(self, code: str, expected_type: str = None) -> Dict[str, Any]:
        """Validate code format and return information"""
        code = code.strip().upper()
        
        validation_result = {
            'code': code,
            'is_valid': False,
            'detected_type': None,
            'format_errors': [],
            'suggestions': []
        }
        
        # Check ICD-10 format
        if re.match(r'^[A-Z]\d{2}\.?\d*$', code):
            validation_result['detected_type'] = 'ICD-10'
            validation_result['is_valid'] = True
        
        # Check CPT format
        elif re.match(r'^\d{5}$', code):
            validation_result['detected_type'] = 'CPT'
            validation_result['is_valid'] = True
        
        # Check HCPCS format
        elif re.match(r'^[A-Z]\d{4}$', code):
            validation_result['detected_type'] = 'HCPCS'
            validation_result['is_valid'] = True
        
        else:
            validation_result['format_errors'].append('Code does not match any known format')
            
            # Provide suggestions based on partial matches
            if len(code) > 0:
                suggestions = self.get_search_suggestions(code, 5)
                validation_result['suggestions'] = suggestions
        
        # Check if expected type matches detected type
        if expected_type and validation_result['detected_type']:
            if expected_type != validation_result['detected_type']:
                validation_result['format_errors'].append(f'Expected {expected_type} but detected {validation_result["detected_type"]}')
        
        return validation_result
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the code database"""
        return {
            'total_codes': len(self.icd10_codes) + len(self.cpt_codes) + len(self.hcpcs_codes),
            'icd10_count': len(self.icd10_codes),
            'cpt_count': len(self.cpt_codes),
            'hcpcs_count': len(self.hcpcs_codes),
            'categories': self.get_code_categories()
        }

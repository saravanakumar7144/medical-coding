import re
import yaml
from typing import Dict, Any, List
import logging
import os

logger = logging.getLogger(__name__)

class DataAnonymizer:
    """Anonymize sensitive patient information"""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.name_placeholder = self.config.get('anonymization', {}).get('placeholder_name', '[PATIENT_NAME]')
        self.contact_placeholder = self.config.get('anonymization', {}).get('placeholder_contact', '[CONTACT_XXX]')
        self.id_placeholder = self.config.get('anonymization', {}).get('placeholder_id', '[ID_XXX]')
        self.address_placeholder = self.config.get('anonymization', {}).get('placeholder_address', '[ADDRESS]')
    
    def _load_config(self, config_path: str = None) -> Dict[str, Any]:
        """Load configuration"""
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.yaml')
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            logger.warning("Config file not found, using defaults")
            return {
                'anonymization': {
                    'mask_names': True,
                    'mask_contacts': True,
                    'mask_addresses': True,
                    'mask_ids': True,
                    'placeholder_name': '[PATIENT_NAME]',
                    'placeholder_contact': '[CONTACT_XXX]',
                    'placeholder_id': '[ID_XXX]',
                    'placeholder_address': '[ADDRESS]'
                }
            }
    
    def anonymize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize sensitive patient information in structured data"""
        if not data:
            return data
            
        anonymized = data.copy()
        config = self.config.get('anonymization', {})
        
        # Anonymize patient name
        if config.get('mask_names', True) and 'patient_name' in anonymized:
            anonymized['patient_name'] = self.name_placeholder
        
        # Anonymize contact information
        if config.get('mask_contacts', True) and 'contact_number' in anonymized:
            anonymized['contact_number'] = self.contact_placeholder
        
        # Anonymize ID numbers
        if config.get('mask_ids', True):
            id_fields = ['file_number', 'patient_id', 'medical_record_number', 'ssn']
            for field in id_fields:
                if field in anonymized:
                    anonymized[field] = self.id_placeholder
        
        # Keep medical information but anonymize personal identifiers in text fields
        text_fields = ['conditions', 'procedures', 'medications', 'allergies']
        for field in text_fields:
            if field in anonymized and isinstance(anonymized[field], list):
                anonymized[field] = [self._anonymize_text_item(item) for item in anonymized[field]]
        
        return anonymized
    
    def anonymize_text(self, text: str) -> str:
        """Anonymize personal information in raw text"""
        if not text:
            return text
            
        anonymized_text = text
        config = self.config.get('anonymization', {})
        
        if config.get('mask_names', True):
            # Replace names (assuming they're in caps or title case)
            anonymized_text = self._mask_names(anonymized_text)
        
        if config.get('mask_contacts', True):
            # Replace phone numbers
            anonymized_text = self._mask_phone_numbers(anonymized_text)
        
        if config.get('mask_ids', True):
            # Replace ID numbers
            anonymized_text = self._mask_id_numbers(anonymized_text)
        
        if config.get('mask_addresses', True):
            # Replace addresses
            anonymized_text = self._mask_addresses(anonymized_text)
        
        return anonymized_text
    
    def _mask_names(self, text: str) -> str:
        """Mask names in text"""
        # Pattern for names in medical documents
        patterns = [
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # First Last
            r'\b[A-Z][a-z]+, [A-Z][a-z]+\b',  # Last, First
            r'\b[A-Z]{2,}\s+[A-Z]{2,}\b',    # ALL CAPS names
            r"Patient's?\s+Name[:\s]*([A-Z\s]+)",
            r"Patient[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
        ]
        
        for pattern in patterns:
            # Exclude common medical terms
            matches = re.finditer(pattern, text)
            for match in matches:
                name_candidate = match.group(0)
                if not self._is_medical_term(name_candidate):
                    text = text.replace(name_candidate, self.name_placeholder)
        
        return text
    
    def _mask_phone_numbers(self, text: str) -> str:
        """Mask phone numbers in text"""
        patterns = [
            r'\b\d{3,5}[-\s]?\d{2}[-\s]?\d{6,7}\b',  # International format
            r'\b\(\d{3}\)\s?\d{3}[-\s]?\d{4}\b',     # (123) 456-7890
            r'\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b',      # 123-456-7890
            r'\b\d{10,15}\b'                          # Long number sequences
        ]
        
        for pattern in patterns:
            text = re.sub(pattern, self.contact_placeholder, text)
        
        return text
    
    def _mask_id_numbers(self, text: str) -> str:
        """Mask ID numbers in text"""
        patterns = [
            r'\b[A-Z]{2,3}\d{5,8}\b',     # Medical record patterns
            r'\b\d{2,3}-\d{2}-\d{4}\b',   # SSN-like patterns
            r'\bEH\d+\b',                 # Example from your document
            r'\b\d{6,}/[A-Z]{2}/[A-Z]{3}/\d{2}\b'  # Visit number patterns
        ]
        
        for pattern in patterns:
            text = re.sub(pattern, self.id_placeholder, text)
        
        return text
    
    def _mask_addresses(self, text: str) -> str:
        """Mask addresses in text"""
        patterns = [
            r'\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd)\b',
            r'\b[A-Z][a-z]+,\s+[A-Z]{2}\s+\d{5}\b',  # City, State ZIP
            r'\bP\.?O\.?\s+Box\s+\d+\b'               # PO Box
        ]
        
        for pattern in patterns:
            text = re.sub(pattern, self.address_placeholder, text, flags=re.IGNORECASE)
        
        return text
    
    def _anonymize_text_item(self, item: str) -> str:
        """Anonymize a single text item"""
        if not item:
            return item
        
        # Apply basic anonymization to individual items
        anonymized = item
        
        # Remove specific names that might appear in conditions/procedures
        anonymized = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', anonymized)
        
        return anonymized
    
    def _is_medical_term(self, text: str) -> bool:
        """Check if text is likely a medical term rather than a name"""
        medical_keywords = [
            'diagnosis', 'condition', 'disease', 'syndrome', 'disorder',
            'treatment', 'procedure', 'surgery', 'operation', 'therapy',
            'medication', 'drug', 'prescription', 'injection', 'infusion',
            'examination', 'test', 'scan', 'x-ray', 'mri', 'ct', 'ultrasound',
            'blood', 'urine', 'laboratory', 'pathology', 'biopsy',
            'chronic', 'acute', 'severe', 'mild', 'moderate',
            'primary', 'secondary', 'tertiary', 'bilateral', 'unilateral',
            'anterior', 'posterior', 'superior', 'inferior', 'medial', 'lateral'
        ]
        
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in medical_keywords)
    
    def get_anonymization_stats(self, original_text: str, anonymized_text: str) -> Dict[str, Any]:
        """Get statistics about anonymization process"""
        return {
            'original_length': len(original_text),
            'anonymized_length': len(anonymized_text),
            'names_masked': anonymized_text.count(self.name_placeholder),
            'contacts_masked': anonymized_text.count(self.contact_placeholder),
            'ids_masked': anonymized_text.count(self.id_placeholder),
            'addresses_masked': anonymized_text.count(self.address_placeholder)
        }

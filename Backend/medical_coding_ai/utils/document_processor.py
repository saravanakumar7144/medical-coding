import re
from typing import Dict, Any, List
import logging
import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

try:
    import PyPDF2
    import pdfplumber
    logger = logging.getLogger(__name__)
    logger.info("PDF processing libraries imported successfully")
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import PDF libraries: {e}")
    # Fallback for missing libraries
    PyPDF2 = None
    pdfplumber = None

from utils.data_anonymizer import DataAnonymizer

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Process medical documents and extract structured information"""
    
    def __init__(self):
        self.anonymizer = DataAnonymizer()
    
    def process_pdf(self, pdf_file) -> Dict[str, Any]:
        """Process uploaded PDF and extract information"""
        try:
            # Extract text using pdfplumber for better formatting
            text = ""
            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"--- Page {page_num + 1} ---\n{page_text}\n\n"
            
            if not text.strip():
                return {"error": "No text could be extracted from PDF", "processed": False}
            
            # Extract structured data
            patient_data = self._extract_patient_data(text)
            
            # Anonymize sensitive information
            anonymized_data = self.anonymizer.anonymize(patient_data)
            anonymized_text = self.anonymizer.anonymize_text(text)
            
            return {
                "raw_text": text,
                "anonymized_text": anonymized_text,
                "patient_data": patient_data,
                "anonymized_data": anonymized_data,
                "processed": True,
                "document_type": self._determine_document_type(text),
                "extraction_stats": {
                    "text_length": len(text),
                    "conditions_found": len(patient_data.get('conditions', [])),
                    "procedures_found": len(patient_data.get('procedures', []))
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            return {"error": str(e), "processed": False}
    
    def _extract_patient_data(self, text: str) -> Dict[str, Any]:
        """Extract structured patient information with enhanced categorization"""
        data = {}
        
        # Extract patient name with multiple patterns
        name_patterns = [
            r"Patient's?\s+Name[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            r"Name[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            r"Patient[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
            r"PATIENT NAME[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)"
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                name = match.group(1).strip()
                if len(name.split()) >= 2 and not any(char.isdigit() for char in name):
                    data['name'] = name
                    break
        
        # Extract patient ID with comprehensive patterns
        id_patterns = [
            r"ID[:\s]*([A-Z0-9\-]+)",
            r"Patient ID[:\s]*([A-Z0-9\-]+)",
            r"Patient File No[.:\s]*([A-Z0-9\-]+)",
            r"File No[.:\s]*([A-Z0-9\-]+)", 
            r"Medical Record[:\s]*([A-Z0-9\-]+)",
            r"MRN[:\s]*([A-Z0-9\-]+)",
            r"Chart No[.:\s]*([A-Z0-9\-]+)",
            r"Record No[.:\s]*([A-Z0-9\-]+)"
        ]
        
        for pattern in id_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                patient_id = match.group(1).strip()
                if len(patient_id) >= 3:
                    data['id'] = patient_id
                    break
        
        # Extract Date of Birth (DOB)
        dob_patterns = [
            r"DOB[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Date of Birth[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Born[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Birth Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
        ]
        
        for pattern in dob_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['dob'] = match.group(1).strip()
                break
        
        # Extract Visit Date with multiple patterns
        visit_patterns = [
            r"Visit Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Date of Visit[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Encounter Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Service Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"Date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
        ]
        
        for pattern in visit_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['visitDate'] = match.group(1).strip()
                break
        
        # Continue with existing extraction patterns...
        
        # Extract date of birth with more patterns
        dob_patterns = [
            r"DOB[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Date of Birth[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Born[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Birth Date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})"
        ]
        
        for pattern in dob_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dob = match.group(1)
                # Basic validation - should be a reasonable birth date
                parts = re.split(r'[/\-]', dob)
                if len(parts) == 3:
                    try:
                        month, day, year = map(int, parts)
                        if 1900 <= year <= 2024 and 1 <= month <= 12 and 1 <= day <= 31:
                            data['date_of_birth'] = dob
                            break
                    except ValueError:
                        continue
        
        # Extract visit date
        visit_patterns = [
            r"Visit[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Visit Date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Appointment[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Seen on[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})"
        ]
        
        for pattern in visit_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                visit_date = match.group(1)
                # Basic validation - should be a recent date
                parts = re.split(r'[/\-]', visit_date)
                if len(parts) == 3:
                    month, day, year = map(int, parts)
                    if 2020 <= year <= 2025 and 1 <= month <= 12 and 1 <= day <= 31:
                        data['visit_date'] = visit_date
                        break
        
        # Extract visit date
        visit_patterns = [
            r"Visit[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Appointment[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})",
            r"Service Date[:\s]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})"
        ]
        
        for pattern in visit_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['visit_date'] = match.group(1)
                break
        
        # Extract contact information
        contact_patterns = [
            r"Contact No[.:\s]*(\d[\d\-\s]+)",
            r"Phone[:\s]*(\d[\d\-\s]+)",
            r"Tel[:\s]*(\d[\d\-\s]+)"
        ]
        
        for pattern in contact_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                contact = re.sub(r'[^\d\-]', '', match.group(1))
                if len(contact) >= 7:  # Minimum phone number length
                    data['contact_number'] = contact
                    break
        
        # Extract gender
        gender_match = re.search(r"Gender[:\s]*(\w+)", text, re.IGNORECASE)
        if gender_match:
            data['gender'] = gender_match.group(1).strip()
        
        # Extract age
        age_patterns = [
            r"Age[:\s]*(\d+)\s*(?:Years?|yrs?)",
            r"(\d+)\s*(?:Years?|yrs?)\s*old"
        ]
        
        for pattern in age_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['age'] = match.group(1)
                break
        
        # Extract medical conditions
        data['conditions'] = self._extract_medical_conditions(text)
        data['procedures'] = self._extract_procedures(text)
        data['medications'] = self._extract_medications(text)
        data['allergies'] = self._extract_allergies(text)
        
        # Extract structured medical document sections for frontend display
        data['chiefComplaint'] = self._extract_chief_complaint(text)
        data['vitalSigns'] = self._extract_vital_signs(text)
        data['history'] = self._extract_history(text)
        data['examination'] = self._extract_examination(text)
        data['assessment'] = self._extract_assessment(text)
        data['plan'] = self._extract_plan(text)
        
        # Also include basic patient identifiers for frontend
        data['name'] = data.get('patient_name', '')
        data['id'] = data.get('file_number', '')
        data['dob'] = data.get('date_of_birth', '')
        data['visitDate'] = data.get('visit_date', '')
        data['text'] = text  # Raw text for frontend display
        
        return data
    
    def _extract_medical_conditions(self, text: str) -> List[str]:
        """Extract medical conditions from document"""
        conditions = []
        
        # Section-based extraction
        condition_sections = [
            r"CHIEF COMPLAINT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"DIAGNOSIS[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"HISTORY OF PRESENT ILLNESS[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"ASSESSMENT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"IMPRESSION[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"PATIENT PAST HISTORY[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in condition_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Clean and split conditions
                cleaned = re.sub(r'\s+', ' ', match.strip())
                if cleaned and len(cleaned) > 5:
                    conditions.append(cleaned)
        
        # Pattern-based extraction for common conditions
        condition_patterns = [
            r'\b(diabetes|hypertension|hyperlipidemia|obesity|depression|anxiety|arthritis)\b',
            r'\b(\w+itis|\w+osis|\w+pathy|\w+emia|\w+uria)\b',
            r'\b(chronic|acute|severe|mild)\s+(\w+\s+\w+)\b',
            r'\b(type\s+\d+\s+diabetes)\b',
            r'\b(high\s+blood\s+pressure)\b'
        ]
        
        for pattern in condition_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                condition = match if isinstance(match, str) else ' '.join(filter(None, match))
                if condition and len(condition) > 3:
                    conditions.append(condition.lower().title())
        
        # Remove duplicates and very short entries
        conditions = list(set([c.strip() for c in conditions if len(c.strip()) > 3]))
        return conditions[:10]  # Limit to top 10
    
    def _extract_procedures(self, text: str) -> List[str]:
        """Extract procedures from document"""
        procedures = []
        
        # Section-based extraction
        procedure_sections = [
            r"PROCEDURE[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"OPERATION[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"SURGERY[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"TREATMENT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in procedure_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                cleaned = re.sub(r'\s+', ' ', match.strip())
                if cleaned and len(cleaned) > 5:
                    procedures.append(cleaned)
        
        # Keyword-based extraction
        procedure_keywords = [
            "surgery", "operation", "procedure", "treatment", "therapy",
            "examination", "test", "consultation", "visit", "biopsy",
            "injection", "infusion", "catheterization", "endoscopy"
        ]
        
        for keyword in procedure_keywords:
            pattern = rf"\b{keyword}[:\s]*([^\n.!?]+)"
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = match.strip()
                if cleaned and len(cleaned) > 5 and not any(char.isdigit() for char in cleaned[:3]):
                    procedures.append(cleaned)
        
        # Remove duplicates
        procedures = list(set([p.strip() for p in procedures if len(p.strip()) > 5]))
        return procedures[:10]
    
    def _extract_medications(self, text: str) -> List[str]:
        """Extract medications from document"""
        medications = []
        
        # Section-based extraction
        med_sections = [
            r"MEDICATIONS?[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"CURRENT MEDICATIONS?[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"DRUGS?[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in med_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Split by common delimiters
                meds = re.split(r'[,;\n]', match)
                for med in meds:
                    cleaned = re.sub(r'\d+\s*mg|\d+\s*ml|\d+\s*times?.*', '', med).strip()
                    if cleaned and len(cleaned) > 2:
                        medications.append(cleaned)
        
        return list(set(medications[:10]))
    
    def _extract_allergies(self, text: str) -> List[str]:
        """Extract allergies from document"""
        allergies = []
        
        allergy_patterns = [
            r"ALLERGIES?[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"ALLERGIC TO[:\s]*([^\n]+)",
            r"DRUG ALLERGIES?[:\s]*([^\n]+)"
        ]
        
        for pattern in allergy_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                if "no known" not in match.lower() and "nkda" not in match.lower():
                    allergy_items = re.split(r'[,;\n]', match)
                    for item in allergy_items:
                        cleaned = item.strip()
                        if cleaned and len(cleaned) > 2:
                            allergies.append(cleaned)
        
        return list(set(allergies[:5]))

    def _extract_chief_complaint(self, text: str) -> str:
        """Extract chief complaint from document"""
        patterns = [
            r"CHIEF COMPLAINT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"CC[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"PRESENTING COMPLAINT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"COMPLAINT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                complaint = re.sub(r'\s+', ' ', match.group(1).strip())
                if complaint and len(complaint) > 5:
                    return complaint
        
        return ""

    def _extract_vital_signs(self, text: str) -> Dict[str, str]:
        """Extract vital signs from document"""
        vital_signs = {}
        
        # Extract blood pressure
        bp_patterns = [
            r"BP[:\s]*(\d+/\d+)",
            r"Blood Pressure[:\s]*(\d+/\d+)",
            r"(\d+/\d+)\s*mmHg"
        ]
        for pattern in bp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['bp'] = match.group(1)
                break
        
        # Extract pulse/heart rate
        pulse_patterns = [
            r"Pulse[:\s]*(\d+)",
            r"HR[:\s]*(\d+)",
            r"Heart Rate[:\s]*(\d+)",
            r"(\d+)\s*bpm"
        ]
        for pattern in pulse_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['pulse'] = match.group(1)
                break
        
        # Extract respiratory rate
        resp_patterns = [
            r"RR[:\s]*(\d+)",
            r"Resp[:\s]*(\d+)",
            r"Respiratory Rate[:\s]*(\d+)",
            r"(\d+)\s*breaths?/min"
        ]
        for pattern in resp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['resp'] = match.group(1)
                break
        
        # Extract temperature
        temp_patterns = [
            r"Temp[:\s]*(\d+\.?\d*)[°\s]*[CF]?",
            r"Temperature[:\s]*(\d+\.?\d*)[°\s]*[CF]?",
            r"(\d+\.?\d*)[°\s]*[CF]"
        ]
        for pattern in temp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['temp'] = match.group(1)
                break
        
        # Extract height
        height_patterns = [
            r"Height[:\s]*(\d+['\"]?\s*\d*['\"]?)",
            r"Ht[:\s]*(\d+['\"]?\s*\d*['\"]?)",
            r"(\d+)['\"]?\s*(\d*)['\"]?\s*tall"
        ]
        for pattern in height_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['height'] = match.group(1) if len(match.groups()) == 1 else f"{match.group(1)}'{match.group(2)}\""
                break
        
        # Extract weight
        weight_patterns = [
            r"Weight[:\s]*(\d+\.?\d*)\s*(?:lbs?|kg)?",
            r"Wt[:\s]*(\d+\.?\d*)\s*(?:lbs?|kg)?",
            r"(\d+\.?\d*)\s*(?:lbs?|kg)"
        ]
        for pattern in weight_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['weight'] = match.group(1)
                break
        
        # Extract BMI
        bmi_patterns = [
            r"BMI[:\s]*(\d+\.?\d*)",
            r"Body Mass Index[:\s]*(\d+\.?\d*)"
        ]
        for pattern in bmi_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vital_signs['bmi'] = match.group(1)
                break
        
        return vital_signs

    def _extract_history(self, text: str) -> str:
        """Extract history from document"""
        patterns = [
            r"HISTORY OF PRESENT ILLNESS[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"HPI[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"HISTORY[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"PATIENT HISTORY[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"MEDICAL HISTORY[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                history = re.sub(r'\s+', ' ', match.group(1).strip())
                if history and len(history) > 5:
                    return history
        
        return ""

    def _extract_examination(self, text: str) -> str:
        """Extract examination findings from document"""
        patterns = [
            r"PHYSICAL EXAMINATION[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"PHYSICAL EXAM[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"EXAMINATION[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"EXAM[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"PE[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                examination = re.sub(r'\s+', ' ', match.group(1).strip())
                if examination and len(examination) > 5:
                    return examination
        
        return ""

    def _extract_assessment(self, text: str) -> str:
        """Extract assessment from document"""
        patterns = [
            r"ASSESSMENT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"IMPRESSION[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"CLINICAL ASSESSMENT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"DIAGNOSIS[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                assessment = re.sub(r'\s+', ' ', match.group(1).strip())
                if assessment and len(assessment) > 5:
                    return assessment
        
        return ""

    def _extract_plan(self, text: str) -> str:
        """Extract plan from document"""
        patterns = [
            r"PLAN[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"TREATMENT PLAN[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"MANAGEMENT[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)",
            r"RECOMMENDATIONS?[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                plan = re.sub(r'\s+', ' ', match.group(1).strip())
                if plan and len(plan) > 5:
                    return plan
        
        return ""
    
    def _determine_document_type(self, text: str) -> str:
        """Determine the type of medical document"""
        text_lower = text.lower()
        
        if any(term in text_lower for term in ["physician summary", "summary report", "consultation"]):
            return "Physician Summary Report"
        elif any(term in text_lower for term in ["nurse note", "nursing note", "nursing assessment"]):
            return "Nurse Notes"
        elif any(term in text_lower for term in ["anesthesia", "anesthetic", "pre-op", "post-op"]):
            return "Anesthesia Record"
        elif any(term in text_lower for term in ["surgery", "operation", "surgical", "operative"]):
            return "Surgery Report"
        elif any(term in text_lower for term in ["discharge", "discharge summary"]):
            return "Discharge Summary"
        elif any(term in text_lower for term in ["progress note", "follow-up", "follow up"]):
            return "Progress Note"
        else:
            return "General Medical Document"
    
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text from uploaded PDF file"""
        try:
            if pdfplumber is None:
                raise ImportError("pdfplumber not available")
                
            text = ""
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            
            if not text.strip():
                raise ValueError("No text could be extracted from PDF")
            
            return text
        except ImportError as e:
            logger.error(f"PDF library not available: {e}")
            return "Error: PDF processing library not available. Please install pdfplumber."
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return f"Error: Unable to extract text from PDF: {str(e)}"
    
    def process_medical_text(self, text: str) -> Dict[str, Any]:
        """Process raw medical text and return structured data"""
        try:
            if not text or not text.strip():
                raise ValueError("No text provided for processing")
            
            # Extract structured data
            patient_data = self._extract_patient_data(text)
            
            # Anonymize sensitive information
            anonymized_data = self.anonymizer.anonymize(patient_data)
            anonymized_text = self.anonymizer.anonymize_text(text)
            
            return {
                "text": text,
                "anonymized_text": anonymized_text,
                "patient_data": patient_data,
                "anonymized_data": anonymized_data,
                "processed": True,
                "document_type": self._determine_document_type(text),
                "conditions": patient_data.get("conditions", []),
                "procedures": patient_data.get("procedures", []),
                "medications": patient_data.get("medications", []),
                "allergies": patient_data.get("allergies", [])
            }
        except Exception as e:
            logger.error(f"Error processing medical text: {e}")
            raise

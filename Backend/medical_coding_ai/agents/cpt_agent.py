import re
import sys
import os
from typing import List, Dict, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from agents.base_agent import BaseAgent
import logging

logger = logging.getLogger(__name__)

class CPTAgent(BaseAgent):
    """CPT coding specialist agent for procedures and services"""
    
    def __init__(self, model_name: str = "llama3.2:3b-instruct-q4_0"):
        super().__init__(model_name, "CPT")
        self.code_pattern = r'\d{5}'
        
    def analyze_document(self, document_text: str) -> Dict[str, Any]:
        """Analyze document for procedure-related information"""
        logger.info("Starting CPT analysis")
        
        # Extract procedure-related information
        procedures = self._extract_procedures(document_text)
        services = self._extract_services(document_text)
        treatments = self._extract_treatments(document_text)
        visits = self._extract_visits(document_text)
        
        # Search for relevant CPT codes using RAG
        search_terms = []
        search_terms.extend(procedures[:3])
        search_terms.extend(services[:3])
        search_terms.extend(treatments[:3])
        
        search_query = f"procedure service treatment: {' '.join(search_terms)}"
        relevant_codes = self.search_relevant_codes(search_query, k=15)
        
        # Prepare context for LLM analysis
        context_window = self.config.get('agents', {}).get('context_window', 2000)
        document_excerpt = document_text[:context_window]
        
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
        
        try:
            analysis = self.query_llm_with_context(prompt, relevant_codes)
        except Exception as e:
            logger.error(f"Error in LLM analysis: {e}")
            analysis = "Analysis failed due to LLM error. Using extracted information only."
        
        # Create analysis result
        analysis_result = {
            "agent_type": "CPT",
            "analysis": analysis,
            "extracted_procedures": procedures,
            "extracted_services": services,
            "extracted_treatments": treatments,
            "extracted_visits": visits,
            "relevant_codes": relevant_codes[:10],
            "analysis_quality": self._assess_analysis_quality(procedures, services, treatments, visits)
        }
        
        # Generate suggested codes based on the analysis
        suggested_codes = self.suggest_codes(analysis_result)
        analysis_result["suggested_codes"] = suggested_codes
        
        return analysis_result
    
    def suggest_codes(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest top 5 CPT codes with enhanced detection for prosthetic evaluations and medical procedures"""
        logger.info("Generating CPT code suggestions")
        
        procedures = analysis.get('extracted_procedures', [])
        services = analysis.get('extracted_services', [])
        treatments = analysis.get('extracted_treatments', [])
        visits = analysis.get('extracted_visits', [])
        analysis_text = analysis.get('analysis', '')
        
        # Enhanced specific codes for comprehensive medical services
        specific_codes = [
            # Prosthetic/Orthotic Evaluations
            {
                'code': 'L6000',
                'description': 'Partial hand prosthetic evaluation',
                'type': 'CPT',
                'confidence': 95,
                'reasoning': 'Prosthetic hand evaluation and fitting services',
                'keywords': ['partial hand', 'prosthetic evaluation', 'hand prosthetic', 'prosthetic hand', 'hand fitting', 'prosthetic fitting']
            },
            {
                'code': 'L6010',
                'description': 'Partial hand prosthetic, thumb or one finger',
                'type': 'CPT',
                'confidence': 90,
                'reasoning': 'Partial hand prosthetic for thumb or finger',
                'keywords': ['thumb prosthetic', 'finger prosthetic', 'partial hand', 'digit prosthetic']
            },
            {
                'code': 'L6020',
                'description': 'Partial hand prosthetic, multiple fingers',
                'type': 'CPT',
                'confidence': 90,
                'reasoning': 'Partial hand prosthetic for multiple fingers',
                'keywords': ['multiple fingers', 'finger prosthetic', 'partial hand', 'multi-digit']
            },
            {
                'code': 'L6100',
                'description': 'Below elbow prosthetic, molded socket',
                'type': 'CPT',
                'confidence': 95,
                'reasoning': 'Below elbow prosthetic with molded socket fitting',
                'keywords': ['below elbow', 'prosthetic socket', 'elbow prosthetic', 'forearm prosthetic']
            },
            {
                'code': 'L6200',
                'description': 'Above elbow prosthetic, molded socket',
                'type': 'CPT',
                'confidence': 95,
                'reasoning': 'Above elbow prosthetic with molded socket fitting',
                'keywords': ['above elbow', 'upper arm prosthetic', 'elbow prosthetic', 'arm prosthetic']
            },
            # Office Visits & Evaluations
            {
                'code': '99214',
                'description': 'Office visit, moderate complexity',
                'type': 'CPT',
                'confidence': 85,
                'reasoning': 'Moderate complexity office visit for established patient',
                'keywords': ['office visit', 'established patient', 'moderate complexity', 'consultation', 'follow-up']
            },
            {
                'code': '99213',
                'description': 'Office visit, low complexity',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'Low complexity office visit for established patient',
                'keywords': ['office visit', 'low complexity', 'routine visit', 'simple evaluation']
            },
            {
                'code': '99215',
                'description': 'Office visit, high complexity',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'High complexity office visit for established patient',
                'keywords': ['office visit', 'high complexity', 'complex evaluation', 'comprehensive assessment']
            },
            {
                'code': '99204',
                'description': 'New patient office visit, moderate complexity',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'Moderate complexity office visit for new patient',
                'keywords': ['new patient', 'office visit', 'initial visit', 'moderate complexity']
            },
            # Physical Therapy & Rehabilitation
            {
                'code': '97110',
                'description': 'Therapeutic exercises, 15 minutes',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'Therapeutic exercise training and conditioning',
                'keywords': ['therapeutic exercises', 'physical therapy', 'exercise therapy', 'rehabilitation', 'strengthening']
            },
            {
                'code': '97112',
                'description': 'Neuromuscular reeducation, 15 minutes',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'Neuromuscular reeducation training',
                'keywords': ['neuromuscular', 'reeducation', 'motor training', 'coordination training']
            },
            {
                'code': '97116',
                'description': 'Gait training, 15 minutes',
                'type': 'CPT',
                'confidence': 75,
                'reasoning': 'Gait and mobility training',
                'keywords': ['gait training', 'walking training', 'mobility training', 'ambulation']
            },
            # Prosthetic Training
            {
                'code': '97530',
                'description': 'Therapeutic activities, 15 minutes',
                'type': 'CPT',
                'confidence': 85,
                'reasoning': 'Therapeutic activities including prosthetic training',
                'keywords': ['prosthetic training', 'therapeutic activities', 'functional training', 'adaptive training']
            },
            {
                'code': '97535',
                'description': 'Self-care training, 15 minutes',
                'type': 'CPT',
                'confidence': 80,
                'reasoning': 'Self-care and daily living activities training',
                'keywords': ['self-care training', 'daily living', 'activities of daily living', 'ADL training']
            }
        ]
        
        # Match codes based on document content
        matched_codes = []
        document_text = ' '.join(procedures + services + treatments + visits + [analysis_text]).lower()
        
        for code_info in specific_codes:
            confidence_score = code_info['confidence']
            
            # Check if keywords are present in document
            keyword_matches = 0
            total_keywords = len(code_info['keywords'])
            
            for keyword in code_info['keywords']:
                if keyword.lower() in document_text:
                    keyword_matches += 1
            
            if keyword_matches > 0:
                # Enhanced confidence calculation
                keyword_ratio = keyword_matches / total_keywords
                confidence_adjustment = keyword_ratio * 12  # Up to 12% bonus
                final_confidence = min(100, confidence_score + confidence_adjustment)
                
                # Additional boost for exact code matches in text
                code_pattern = re.compile(r'\b' + re.escape(code_info['code']) + r'\b', re.IGNORECASE)
                if code_pattern.search(document_text):
                    final_confidence = min(100, final_confidence + 10)
                
                matched_codes.append({
                    'code': code_info['code'],
                    'description': code_info['description'],
                    'type': 'CPT',
                    'confidence': final_confidence / 100.0,  # Convert to decimal
                    'reasoning': f"{code_info['reasoning']} (Matched {keyword_matches}/{total_keywords} keywords)",
                    'evidence': f"Found keywords: {[kw for kw in code_info['keywords'] if kw.lower() in document_text][:3]}",
                    'keyword_matches': keyword_matches,
                    'keyword_ratio': keyword_ratio
                })
        
        # Remove duplicates (same code)
        seen_codes = set()
        unique_matched_codes = []
        for code in matched_codes:
            if code['code'] not in seen_codes:
                seen_codes.add(code['code'])
                unique_matched_codes.append(code)
        
        # Sort by confidence and keyword ratio
        unique_matched_codes.sort(key=lambda x: (x['confidence'], x['keyword_ratio']), reverse=True)
        
        # If we have fewer than 5 matches, use LLM to generate additional suggestions
        if len(unique_matched_codes) < 5:
            try:
                llm_suggestions = self._get_llm_suggestions(analysis, specific_codes)
                unique_matched_codes.extend(llm_suggestions)
            except Exception as e:
                logger.error(f"Error getting LLM suggestions: {e}")
                
        # Return top 5 suggestions
        final_suggestions = unique_matched_codes[:5]
        
        logger.info(f"Generated {len(final_suggestions)} CPT suggestions with enhanced matching")
        return final_suggestions
        treatments = analysis.get('extracted_treatments', [])
        visits = analysis.get('extracted_visits', [])
        relevant_codes = analysis.get('relevant_codes', [])
        
        # Enhanced specific codes for prosthetic/rehabilitation cases
        specific_codes = [
            {
                'code': '99214',
                'description': 'Office visit, moderate complexity',
                'type': 'CPT',
                'confidence': 90,
                'reasoning': 'Moderate complexity office visit for prosthetic evaluation',
                'keywords': ['office visit', 'moderate complexity', 'established patient', 'evaluation']
            },
            {
                'code': '97750',
                'description': 'Physical performance test',
                'type': 'CPT',
                'confidence': 90,
                'reasoning': 'Physical performance testing for prosthetic assessment',
                'keywords': ['physical performance', 'test', 'evaluation', 'functional']
            },
            {
                'code': 'L6000',
                'description': 'Partial hand prosthetic evaluation',
                'type': 'CPT',
                'confidence': 95,
                'reasoning': 'Prosthetic evaluation and assessment service',
                'keywords': ['prosthetic evaluation', 'hand prosthetic', 'partial hand', 'L6000']
            },
            {
                'code': 'V2623',
                'description': 'Prosthetic eye evaluation',
                'type': 'CPT',
                'confidence': 95,
                'reasoning': 'Artificial eye prosthetic evaluation service',
                'keywords': ['prosthetic eye', 'artificial eye', 'eye evaluation', 'V2623']
            },
            {
                'code': '99213',
                'description': 'Office visit, low to moderate complexity',
                'type': 'CPT',
                'confidence': 85,
                'reasoning': 'Standard office visit for established patient',
                'keywords': ['office visit', 'established patient', 'low complexity']
            }
        ]
        
        # Match codes based on document content
        matched_codes = []
        document_text = ' '.join(procedures + services + treatments + visits).lower()
        
        for code_info in specific_codes:
            confidence_score = code_info['confidence']
            
            # Check if keywords are present in document
            keyword_matches = 0
            for keyword in code_info['keywords']:
                if keyword.lower() in document_text:
                    keyword_matches += 1
            
            if keyword_matches > 0:
                # Adjust confidence based on keyword matches
                confidence_adjustment = (keyword_matches / len(code_info['keywords'])) * 10
                final_confidence = min(100, confidence_score + confidence_adjustment)
                
                matched_codes.append({
                    'code': code_info['code'],
                    'description': code_info['description'],
                    'type': 'CPT',
                    'confidence': final_confidence / 100.0,  # Convert to decimal
                    'reasoning': code_info['reasoning'],
                    'evidence': f"Matched {keyword_matches}/{len(code_info['keywords'])} keywords",
                    'keyword_matches': keyword_matches
                })
        
        # Sort by confidence and keyword matches
        matched_codes.sort(key=lambda x: (x['confidence'], x['keyword_matches']), reverse=True)
        
        # If we have fewer than 3 matches, use LLM to generate additional suggestions
        if len(matched_codes) < 3:
            llm_suggestions = self._get_llm_suggestions(analysis, specific_codes)
            matched_codes.extend(llm_suggestions)
        
        # Return top 3 suggestions
        final_suggestions = matched_codes[:3]
        
        logger.info(f"Generated {len(final_suggestions)} CPT suggestions with enhanced matching")
        return final_suggestions
    
    def _extract_procedures(self, text: str) -> List[str]:
        """Extract procedures from text with enhanced pattern matching"""
        procedures = []
        
        # Enhanced CPT code extraction patterns
        cpt_patterns = [
            r'(\d{5})\s*-\s*([^\n\r]+)',  # 99214 - Description format
            r'(\d{5})[:\s]+([^\n\r]+)',   # Alternative format
            r'CPT[:\s]*(\d{5})[:\s]*([^\n\r]+)',  # CPT: code format
            r'([LVGHIJK]\d{4})\s*-\s*([^\n\r]+)',  # HCPCS Level II codes like L6000, V2623
        ]
        
        for pattern in cpt_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                if len(match) == 2:
                    code, description = match
                    procedures.append(f"{code.strip()} - {description.strip()}")
        
        # Section-based procedure extraction
        procedure_sections = [
            r'(?:ORDERED SERVICES|PROCEDURES)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:SERVICES & PROCEDURES)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:PROCEDURE|OPERATION|SURGERY)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:SURGICAL PROCEDURE)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:DIAGNOSTIC PROCEDURE)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:INTERVENTION)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)'
        ]
        
        for pattern in procedure_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    procedures.append(cleaned)
        
        # Enhanced procedure keywords for prosthetic/rehabilitation cases
        procedure_keywords = [
            r'\b(prosthetic\s+(?:evaluation|assessment|fitting|adjustment))\b',
            r'\b(artificial\s+(?:eye|limb)\s+(?:evaluation|fitting))\b',
            r'\b(office\s+visit)\b',
            r'\b(physical\s+performance\s+test)\b',
            r'\b(consultation)\b',
            r'\b(evaluation)\b',
            r'\b(assessment)\b',
            r'\b(biopsy|incision|excision|resection|repair|reconstruction)\b',
            r'\b(endoscopy|colonoscopy|arthroscopy|laparoscopy)\b',
            r'\b(catheterization|angioplasty|stent|ablation)\b',
            r'\b(injection|infusion|transfusion)\b',
            r'\b(suture|closure|drainage|debridement)\b',
            r'\b(x-ray|CT scan|MRI|ultrasound|mammography)\b',
            r'\b(EKG|ECG|echocardiogram|stress test)\b'
        ]
        
        for pattern in procedure_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    procedures.append(match.strip().title())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_procedures = []
        for procedure in procedures:
            procedure_clean = procedure.lower().strip()
            if procedure_clean not in seen and len(procedure) > 3:
                seen.add(procedure_clean)
                unique_procedures.append(procedure)
        
        return unique_procedures[:15]  # Return top 15 procedures
    
    def _extract_services(self, text: str) -> List[str]:
        """Extract medical services from text"""
        services = []
        
        # Service patterns
        service_patterns = [
            r'(?:CONSULTATION|VISIT|EXAMINATION|ASSESSMENT)[:\s]*([^\n]+)',
            r'(?:EVALUATION AND MANAGEMENT|E&M)[:\s]*([^\n]+)',
            r'(?:OFFICE VISIT|CLINIC VISIT)[:\s]*([^\n]+)',
            r'(?:FOLLOW.?UP|FOLLOW UP)[:\s]*([^\n]+)',
            r'(?:COUNSELING|EDUCATION)[:\s]*([^\n]+)'
        ]
        
        for pattern in service_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    services.append(cleaned)
        
        # Service keywords
        service_keywords = [
            r'\b(consultation|examination|evaluation|assessment)\b',
            r'\b(counseling|education|teaching|instruction)\b',
            r'\b(monitoring|observation|surveillance)\b',
            r'\b(interpretation|reading|review)\b'
        ]
        
        for pattern in service_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    services.append(match.strip().title())
        
        return list(set([s.strip() for s in services if len(s.strip()) > 3]))[:10]
    
    def _extract_treatments(self, text: str) -> List[str]:
        """Extract treatments from text"""
        treatments = []
        
        # Treatment patterns
        treatment_patterns = [
            r'(?:TREATMENT|THERAPY|INTERVENTION)[:\s]*([^\n]+)',
            r'(?:ADMINISTERED|GIVEN|PROVIDED)[:\s]*([^\n]+)',
            r'(?:MEDICATION|DRUG|PRESCRIPTION)[:\s]*([^\n]+)',
            r'(?:PHYSICAL THERAPY|OCCUPATIONAL THERAPY|SPEECH THERAPY)[:\s]*([^\n]+)'
        ]
        
        for pattern in treatment_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    treatments.append(cleaned)
        
        # Treatment keywords
        treatment_keywords = [
            r'\b(therapy|treatment|medication|prescription)\b',
            r'\b(administration|injection|infusion)\b',
            r'\b(rehabilitation|physiotherapy|occupational therapy)\b',
            r'\b(chemotherapy|radiation|immunotherapy)\b'
        ]
        
        for pattern in treatment_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    treatments.append(match.strip().title())
        
        return list(set([t.strip() for t in treatments if len(t.strip()) > 3]))[:10]
    
    def _extract_visits(self, text: str) -> List[str]:
        """Extract visit information for E&M coding"""
        visits = []
        
        # Visit patterns
        visit_patterns = [
            r'(?:OFFICE VISIT|CLINIC VISIT|HOSPITAL VISIT)[:\s]*([^\n]+)',
            r'(?:NEW PATIENT|ESTABLISHED PATIENT)[:\s]*([^\n]+)',
            r'(?:INITIAL VISIT|FOLLOW.?UP VISIT)[:\s]*([^\n]+)',
            r'(?:CONSULTATION|REFERRAL)[:\s]*([^\n]+)'
        ]
        
        for pattern in visit_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    visits.append(cleaned)
        
        # Determine visit complexity indicators
        complexity_indicators = {
            'straightforward': ['routine', 'simple', 'straightforward', 'minimal'],
            'low': ['low complexity', 'limited', 'minor'],
            'moderate': ['moderate', 'intermediate', 'comprehensive'],
            'high': ['high complexity', 'extensive', 'detailed', 'complex']
        }
        
        text_lower = text.lower()
        for complexity, keywords in complexity_indicators.items():
            if any(keyword in text_lower for keyword in keywords):
                visits.append(f"{complexity} complexity visit")
        
        return list(set(visits))[:5]
    
    def _clean_medical_text(self, text: str) -> str:
        """Clean and normalize medical text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common artifacts
        cleaned = re.sub(r'\d+\.\s*', '', cleaned)  # Remove numbering
        cleaned = re.sub(r'^\W+', '', cleaned)      # Remove leading punctuation
        cleaned = re.sub(r'\W+$', '', cleaned)      # Remove trailing punctuation
        
        return cleaned.strip()
    
    def _format_codes_for_prompt(self, codes: List[Dict[str, Any]]) -> str:
        """Format codes for LLM prompt"""
        if not codes:
            return "No relevant codes found in knowledge base."
        
        formatted = ""
        for code in codes:
            formatted += f"- {code['code']}: {code['description']}\n"
        
        return formatted
    
    def _parse_suggestions(self, suggestions: str) -> List[Dict[str, Any]]:
        """Parse LLM suggestions into structured format"""
        parsed = []
        
        if not suggestions:
            return parsed
        
        lines = suggestions.strip().split('\n')
        
        for line in lines:
            if '|' in line and len(line.split('|')) >= 4:
                parts = line.split('|')
                try:
                    code = parts[0].strip()
                    description = parts[1].strip()
                    confidence_text = parts[2].strip()
                    reasoning = parts[3].strip()
                    
                    # Extract confidence number
                    confidence_match = re.search(r'(\d+)', confidence_text)
                    confidence = int(confidence_match.group(1)) if confidence_match else 0
                    confidence = min(max(confidence, 0), 100)
                    
                    # Validate CPT code format
                    if self._validate_cpt_format(code):
                        parsed.append({
                            'code': code,
                            'description': description,
                            'confidence': confidence,
                            'reasoning': reasoning,
                            'agent': 'CPT'
                        })
                        
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing suggestion line: {line} - {e}")
                    continue
        
        # Sort by confidence and return top 3
        parsed.sort(key=lambda x: x['confidence'], reverse=True)
        return parsed[:3]
    
    def _validate_cpt_format(self, code: str) -> bool:
        """Validate CPT code format (5 digits)"""
        if not code:
            return False
        
        return len(code) == 5 and code.isdigit()
    
    def _validate_suggestions(self, suggestions: List[Dict[str, Any]], 
                            relevant_codes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate and enhance suggestions"""
        validated = []
        
        for suggestion in suggestions:
            # Check if code exists in knowledge base
            code_exists = any(rc['code'] == suggestion['code'] for rc in relevant_codes)
            
            if code_exists or suggestion['confidence'] >= 70:
                validated.append(suggestion)
            else:
                suggestion['confidence'] = max(suggestion['confidence'] - 20, 30)
                suggestion['reasoning'] += " (Note: Code not found in knowledge base)"
                validated.append(suggestion)
        
        return validated
    
    def _fallback_suggestions(self, relevant_codes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Provide fallback suggestions if LLM fails"""
        if not relevant_codes:
            return []
        
        suggestions = []
        for i, code in enumerate(relevant_codes[:3]):
            suggestions.append({
                'code': code['code'],
                'description': code['description'],
                'confidence': max(80 - i*10, 50),
                'reasoning': f"Selected based on document relevance (score: {code.get('relevance_score', 0):.2f})",
                'agent': 'CPT'
            })
        
        return suggestions
    
    def _assess_analysis_quality(self, procedures: List[str], services: List[str], 
                               treatments: List[str], visits: List[str]) -> Dict[str, Any]:
        """Assess the quality of extracted information"""
        return {
            'procedures_count': len(procedures),
            'services_count': len(services),
            'treatments_count': len(treatments),
            'visits_count': len(visits),
            'total_extracted': len(procedures) + len(services) + len(treatments) + len(visits),
            'quality_score': min((len(procedures) + len(services) + len(treatments) + len(visits)) * 10, 100)
        }
    
    def validate_code_format(self, code: str) -> bool:
        """Validate CPT code format"""
        return self._validate_cpt_format(code)

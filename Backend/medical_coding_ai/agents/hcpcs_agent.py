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

class HCPCSAgent(BaseAgent):
    """HCPCS coding specialist agent for supplies, equipment, and services"""
    
    def __init__(self, model_name: str = "llama3.2:3b-instruct-q4_0"):
        super().__init__(model_name, "HCPCS")
        self.code_pattern = r'[A-Z]\d{4}'
        
    def analyze_document(self, document_text: str) -> Dict[str, Any]:
        """Analyze document for equipment/supply-related information"""
        logger.info("Starting HCPCS analysis")
        
        # Extract HCPCS-related information
        equipment = self._extract_equipment(document_text)
        supplies = self._extract_supplies(document_text)
        prosthetics = self._extract_prosthetics(document_text)
        ambulance = self._extract_ambulance_services(document_text)
        other_services = self._extract_other_services(document_text)
        
        # Search for relevant HCPCS codes using RAG
        search_terms = []
        search_terms.extend(equipment[:3])
        search_terms.extend(supplies[:3])
        search_terms.extend(prosthetics[:3])
        
        search_query = f"equipment supply prosthetic device: {' '.join(search_terms)}"
        relevant_codes = self.search_relevant_codes(search_query, k=15)
        
        # Prepare context for LLM analysis
        context_window = self.config.get('agents', {}).get('context_window', 2000)
        document_excerpt = document_text[:context_window]
        
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
        
        try:
            analysis = self.query_llm_with_context(prompt, relevant_codes)
        except Exception as e:
            logger.error(f"Error in LLM analysis: {e}")
            analysis = "Analysis failed due to LLM error. Using extracted information only."
        
        return {
            "agent_type": "HCPCS",
            "analysis": analysis,
            "extracted_equipment": equipment,
            "extracted_supplies": supplies,
            "extracted_prosthetics": prosthetics,
            "extracted_ambulance": ambulance,
            "extracted_other_services": other_services,
            "relevant_codes": relevant_codes[:10],
            "analysis_quality": self._assess_analysis_quality(equipment, supplies, prosthetics, ambulance, other_services)
        }
    
    def suggest_codes(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest top 3 HCPCS codes with confidence scores"""
        logger.info("Generating HCPCS code suggestions")
        
        equipment = analysis.get('extracted_equipment', [])
        supplies = analysis.get('extracted_supplies', [])
        prosthetics = analysis.get('extracted_prosthetics', [])
        ambulance = analysis.get('extracted_ambulance', [])
        other_services = analysis.get('extracted_other_services', [])
        relevant_codes = analysis.get('relevant_codes', [])
        
        prompt = f"""
        Based on the medical analysis, suggest the TOP 3 most appropriate HCPCS codes.
        
        ANALYSIS: {analysis.get('analysis', 'No analysis available')}
        
        EQUIPMENT: {', '.join(equipment[:5])}
        SUPPLIES: {', '.join(supplies[:5])}
        PROSTHETICS: {', '.join(prosthetics[:5])}
        AMBULANCE SERVICES: {', '.join(ambulance[:3])}
        OTHER SERVICES: {', '.join(other_services[:3])}
        
        AVAILABLE RELEVANT CODES:
        {self._format_codes_for_prompt(relevant_codes[:10])}
        
        For each suggested code, provide:
        - Exact HCPCS code (format: A0000)
        - Complete official description
        - Confidence score (0-100) based on documentation strength
        - Clinical reasoning for selection
        
        IMPORTANT GUIDELINES:
        - Only suggest codes with clear documentation of medical necessity
        - Consider whether item is rental, purchase, or service
        - Factor in coverage criteria and supplier requirements
        - Ensure items/services are actually documented as provided
        
        Format each suggestion as: CODE|DESCRIPTION|CONFIDENCE|REASONING
        
        Example: E0100|Cane, includes canes of all materials, adjustable or fixed, with tip|85|Patient has documented mobility impairment requiring assistive device
        """
        
        try:
            suggestions = self.query_llm_with_context(prompt, relevant_codes)
            parsed_suggestions = self._parse_suggestions(suggestions)
            
            # Validate and enhance suggestions
            validated_suggestions = self._validate_suggestions(parsed_suggestions, relevant_codes)
            
            logger.info(f"Generated {len(validated_suggestions)} HCPCS suggestions")
            return validated_suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggestions: {e}")
            return self._fallback_suggestions(relevant_codes)
    
    def _extract_equipment(self, text: str) -> List[str]:
        """Extract durable medical equipment from text"""
        equipment = []
        
        # Equipment sections
        equipment_sections = [
            r'(?:EQUIPMENT|DME|DURABLE MEDICAL EQUIPMENT)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:MEDICAL DEVICE|DEVICE)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:ASSISTIVE DEVICE)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)'
        ]
        
        for pattern in equipment_sections:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    equipment.append(cleaned)
        
        # Equipment keywords
        equipment_keywords = [
            r'\b(wheelchair|walker|cane|crutches|scooter)\b',
            r'\b(oxygen|nebulizer|CPAP|BiPAP|ventilator)\b',
            r'\b(hospital bed|mattress|rails|trapeze)\b',
            r'\b(lift|transfer|commode|shower chair)\b',
            r'\b(glucose monitor|blood pressure monitor)\b',
            r'\b(hearing aid|cochlear implant)\b',
            r'\b(prosthetic|orthotic|brace|splint)\b'
        ]
        
        for pattern in equipment_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    equipment.append(match.strip().title())
        
        return list(set([e.strip() for e in equipment if len(e.strip()) > 3]))[:10]
    
    def _extract_supplies(self, text: str) -> List[str]:
        """Extract medical supplies from text"""
        supplies = []
        
        # Supply patterns
        supply_patterns = [
            r'(?:SUPPLIES|MEDICAL SUPPLIES)[:\s]*([^\n]+(?:\n(?!(?:[A-Z\s]+:))[^\n]+)*)',
            r'(?:WOUND CARE|DRESSING)[:\s]*([^\n]+)',
            r'(?:CATHETER|TUBE|BAG)[:\s]*([^\n]+)',
            r'(?:INJECTION|SYRINGE|NEEDLE)[:\s]*([^\n]+)'
        ]
        
        for pattern in supply_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    supplies.append(cleaned)
        
        # Supply keywords
        supply_keywords = [
            r'\b(bandage|dressing|gauze|tape|pad)\b',
            r'\b(catheter|tube|bag|pouch|collection)\b',
            r'\b(syringe|needle|lancet|test strip)\b',
            r'\b(ostomy|colostomy|ileostomy|urostomy)\b',
            r'\b(diabetic|glucose|insulin|pen)\b',
            r'\b(wound|burn|pressure|ulcer)\b'
        ]
        
        for pattern in supply_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    supplies.append(match.strip().title())
        
        return list(set([s.strip() for s in supplies if len(s.strip()) > 3]))[:10]
    
    def _extract_prosthetics(self, text: str) -> List[str]:
        """Extract prosthetics and orthotics from text"""
        prosthetics = []
        
        # Prosthetic patterns
        prosthetic_patterns = [
            r'(?:PROSTHETIC|PROSTHESIS|ARTIFICIAL)[:\s]*([^\n]+)',
            r'(?:ORTHOTIC|BRACE|SUPPORT)[:\s]*([^\n]+)',
            r'(?:IMPLANT|REPLACEMENT)[:\s]*([^\n]+)'
        ]
        
        for pattern in prosthetic_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    prosthetics.append(cleaned)
        
        # Prosthetic keywords from the attachment
        prosthetic_keywords = [
            r'\b(artificial|prosthetic|replacement)\s+(joint|limb|eye|tooth)\b',
            r'\b(knee|hip|ankle|shoulder|elbow|wrist)\s+(joint|replacement)\b',
            r'\b(orthotic|brace|support|splint)\b',
            r'\b(foot|hand|finger|toe)\s+(prosthetic|replacement)\b'
        ]
        
        for pattern in prosthetic_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                prosthetic = match if isinstance(match, str) else ' '.join(match)
                if prosthetic and len(prosthetic) > 3:
                    prosthetics.append(prosthetic.strip().title())
        
        return list(set([p.strip() for p in prosthetics if len(p.strip()) > 3]))[:10]
    
    def _extract_ambulance_services(self, text: str) -> List[str]:
        """Extract ambulance services from text"""
        ambulance = []
        
        ambulance_patterns = [
            r'(?:AMBULANCE|TRANSPORT|EMS)[:\s]*([^\n]+)',
            r'(?:EMERGENCY TRANSPORT)[:\s]*([^\n]+)',
            r'(?:MEDICAL TRANSPORT)[:\s]*([^\n]+)'
        ]
        
        for pattern in ambulance_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    ambulance.append(cleaned)
        
        # Check for ambulance keywords
        ambulance_keywords = [
            r'\b(ambulance|EMS|paramedic|emergency transport)\b',
            r'\b(air ambulance|helicopter|flight)\b',
            r'\b(ground ambulance|BLS|ALS)\b'
        ]
        
        for pattern in ambulance_keywords:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    ambulance.append(match.strip().title())
        
        return list(set(ambulance))[:5]
    
    def _extract_other_services(self, text: str) -> List[str]:
        """Extract other HCPCS services from text"""
        services = []
        
        service_patterns = [
            r'(?:PHYSICAL THERAPY|PT|PHYSIOTHERAPY)[:\s]*([^\n]+)',
            r'(?:OCCUPATIONAL THERAPY|OT)[:\s]*([^\n]+)',
            r'(?:SPEECH THERAPY|SPEECH PATHOLOGY)[:\s]*([^\n]+)',
            r'(?:SOCIAL SERVICES|CASE MANAGEMENT)[:\s]*([^\n]+)'
        ]
        
        for pattern in service_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_medical_text(match)
                if cleaned and len(cleaned) > 5:
                    services.append(cleaned)
        
        return list(set(services))[:5]
    
    def _clean_medical_text(self, text: str) -> str:
        """Clean and normalize medical text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common artifacts
        cleaned = re.sub(r'\d+\.\s*', '', cleaned)
        cleaned = re.sub(r'^\W+', '', cleaned)
        cleaned = re.sub(r'\W+$', '', cleaned)
        
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
                    
                    # Validate HCPCS code format
                    if self._validate_hcpcs_format(code):
                        parsed.append({
                            'code': code,
                            'description': description,
                            'confidence': confidence,
                            'reasoning': reasoning,
                            'agent': 'HCPCS'
                        })
                        
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing suggestion line: {line} - {e}")
                    continue
        
        # Sort by confidence and return top 3
        parsed.sort(key=lambda x: x['confidence'], reverse=True)
        return parsed[:3]
    
    def _validate_hcpcs_format(self, code: str) -> bool:
        """Validate HCPCS code format (letter + 4 digits)"""
        if not code:
            return False
        
        pattern = r'^[A-Z]\d{4}$'
        return re.match(pattern, code.upper()) is not None
    
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
                'agent': 'HCPCS'
            })
        
        return suggestions
    
    def _assess_analysis_quality(self, equipment: List[str], supplies: List[str], 
                               prosthetics: List[str], ambulance: List[str], 
                               other_services: List[str]) -> Dict[str, Any]:
        """Assess the quality of extracted information"""
        total_items = len(equipment) + len(supplies) + len(prosthetics) + len(ambulance) + len(other_services)
        
        return {
            'equipment_count': len(equipment),
            'supplies_count': len(supplies),
            'prosthetics_count': len(prosthetics),
            'ambulance_count': len(ambulance),
            'other_services_count': len(other_services),
            'total_extracted': total_items,
            'quality_score': min(total_items * 15, 100)  # HCPCS items are often fewer
        }
    
    def validate_code_format(self, code: str) -> bool:
        """Validate HCPCS code format"""
        return self._validate_hcpcs_format(code)

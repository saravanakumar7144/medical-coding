import re
import sys
import os
from typing import List, Dict, Any, Tuple, Optional

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from agents.base_agent import BaseAgent
from utils.knowledge_base_manager import KnowledgeBaseManager
from utils.code_searcher import CodeSearcher
import logging

logger = logging.getLogger(__name__)

class MasterAgent(BaseAgent):
    """Master agent that orchestrates and validates medical coding"""
    
    def __init__(self, model_name: str = "llama3.2:3b-instruct-q4_0"):
        super().__init__(model_name, "Master")
        
        # Initialize knowledge base manager
        try:
            self.kb_manager = KnowledgeBaseManager()
            logger.info("Knowledge base manager initialized")
            
            # Process PDFs if needed - safely handle errors
            auto_process = self.config.get('knowledge_base', {}).get('auto_process_on_startup', True)
            if auto_process:
                try:
                    processing_results = self.kb_manager.check_and_process_pdfs()
                    logger.info(f"Knowledge base processing results: {processing_results}")
                except Exception as kb_error:
                    logger.error(f"Knowledge base processing error: {kb_error}")
                    processing_results = {"status": "error", "message": str(kb_error)}
            else:
                logger.info("Skipping knowledge base processing on startup (auto_process_on_startup=False)")
                processing_results = {"status": "skipped", "message": "Auto-processing disabled"}
            
            # Initialize code searcher - safely handle errors
            try:
                self.code_searcher = CodeSearcher()
                logger.info("Code searcher initialized")
            except Exception as cs_error:
                logger.error(f"Code searcher initialization error: {cs_error}")
                self.code_searcher = None
            
        except Exception as e:
            logger.error(f"Error initializing knowledge base manager: {e}")
            self.kb_manager = None
            self.code_searcher = None
        
        # Initialize specialized agents
        try:
            from agents.icd10_agent import ICD10Agent
            from agents.cpt_agent import CPTAgent
            from agents.hcpcs_agent import HCPCSAgent
            
            self.icd10_agent = ICD10Agent(model_name)
            self.cpt_agent = CPTAgent(model_name)
            self.hcpcs_agent = HCPCSAgent(model_name)
            logger.info("Specialized agents initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing specialized agents: {e}")
            self.icd10_agent = None
            self.cpt_agent = None
            self.hcpcs_agent = None
        
    def set_agents(self, icd10_agent, cpt_agent, hcpcs_agent):
        """Set the specialized agents"""
        self.icd10_agent = icd10_agent
        self.cpt_agent = cpt_agent
        self.hcpcs_agent = hcpcs_agent
        logger.info("Master agent configured with specialized agents")
    
    def orchestrate_analysis(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate analysis across all applicable agents"""
        logger.info("Starting master agent orchestration")
        
        if not document_data or not document_data.get('processed'):
            return {'error': 'Invalid or unprocessed document data'}
        
        results = {
            'icd10_analysis': None,
            'cpt_analysis': None,
            'hcpcs_analysis': None,
            'master_insights': None,
            'document_type': document_data.get('document_type', 'Unknown'),
            'processing_stats': {}
        }
        
        anonymized_text = document_data.get('anonymized_text', '')
        if not anonymized_text:
            return {'error': 'No anonymized text available for analysis'}
        
        # Determine which agents should analyze based on document content
        analysis_plan = self._determine_analysis_plan(document_data)
        logger.info(f"Analysis plan: {analysis_plan}")
        
        # Run applicable agents
        try:
            if analysis_plan['needs_icd10'] and self.icd10_agent:
                logger.info("Running ICD-10 analysis")
                results['icd10_analysis'] = self.icd10_agent.analyze_document(anonymized_text)
                results['processing_stats']['icd10'] = 'completed'
            else:
                results['processing_stats']['icd10'] = 'skipped'
            
            if analysis_plan['needs_cpt'] and self.cpt_agent:
                logger.info("Running CPT analysis")
                results['cpt_analysis'] = self.cpt_agent.analyze_document(anonymized_text)
                results['processing_stats']['cpt'] = 'completed'
            else:
                results['processing_stats']['cpt'] = 'skipped'
            
            if analysis_plan['needs_hcpcs'] and self.hcpcs_agent:
                logger.info("Running HCPCS analysis")
                results['hcpcs_analysis'] = self.hcpcs_agent.analyze_document(anonymized_text)
                results['processing_stats']['hcpcs'] = 'completed'
            else:
                results['processing_stats']['hcpcs'] = 'skipped'
            
            # Generate master insights
            results['master_insights'] = self._generate_insights(results, document_data, analysis_plan)
            logger.info("Master analysis completed successfully")
            
        except Exception as e:
            logger.error(f"Error during orchestrated analysis: {e}")
            results['error'] = str(e)
        
        return results
    
    def verify_codes(self, selected_codes: List[Dict[str, Any]], 
                    document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Verify selected codes for appropriateness and accuracy with enhanced error handling"""
        logger.info(f"Starting verification of {len(selected_codes)} codes")
        
        verification_results = []
        
        if not selected_codes:
            return verification_results
        
        # Pre-validate and clean selected codes
        valid_codes = []
        for i, code in enumerate(selected_codes):
            if not isinstance(code, dict):
                logger.error(f"Code at index {i} is not a dictionary: {type(code)}")
                verification_results.append(self._create_error_verification(
                    {'code': f'INVALID_{i}', 'description': 'Invalid data structure', 'agent': 'Unknown'}, 
                    f"Invalid code structure at index {i}: expected dictionary, got {type(code).__name__}"
                ))
                continue
                
            if not code.get('code'):
                logger.error(f"Code at index {i} missing 'code' field: {code}")
                verification_results.append(self._create_error_verification(
                    code, f"Missing required 'code' field at index {i}"
                ))
                continue
                
            # Ensure required fields exist with defaults
            cleaned_code = {
                'code': code.get('code', f'UNKNOWN_{i}'),
                'description': code.get('description', 'No description provided'),
                'type': code.get('type', code.get('agent', 'Unknown')),
                'agent': code.get('agent', code.get('type', 'Unknown')),
                'confidence': code.get('confidence', 0.5),
                'reasoning': code.get('reasoning', 'No reasoning provided'),
                'source': code.get('source', 'Unknown')
            }
            valid_codes.append(cleaned_code)
        
        # Group valid codes by type for batch verification
        codes_by_type = {'ICD-10': [], 'CPT': [], 'HCPCS': []}
        for code in valid_codes:
            agent_type = code.get('agent', 'Unknown')
            if agent_type in codes_by_type:
                codes_by_type[agent_type].append(code)
            else:
                # Handle unknown agent types
                codes_by_type['ICD-10'].append(code)  # Default to ICD-10
        
        # Verify each group
        for agent_type, codes in codes_by_type.items():
            if codes:
                batch_results = self._verify_code_batch(codes, document_data, agent_type)
                verification_results.extend(batch_results)
        
        # Perform cross-code validation
        final_results = self._cross_validate_codes(verification_results, document_data)
        
        logger.info(f"Verification completed for {len(final_results)} codes")
        return final_results
    
    def _determine_analysis_plan(self, document_data: Dict[str, Any]) -> Dict[str, bool]:
        """Determine which agents should analyze the document"""
        text = document_data.get('anonymized_text', '').lower()
        patient_data = document_data.get('patient_data', {})
        
        # Base decisions on content analysis
        needs_icd10 = self._needs_icd10_analysis(text, patient_data)
        needs_cpt = self._needs_cpt_analysis(text, patient_data)
        needs_hcpcs = self._needs_hcpcs_analysis(text, patient_data)
        
        return {
            'needs_icd10': needs_icd10,
            'needs_cpt': needs_cpt,
            'needs_hcpcs': needs_hcpcs,
            'analysis_reasoning': self._get_analysis_reasoning(text, needs_icd10, needs_cpt, needs_hcpcs)
        }
    
    def _needs_icd10_analysis(self, text: str, patient_data: Dict[str, Any]) -> bool:
        """Determine if ICD-10 analysis is needed"""
        # Always analyze for diagnoses unless explicitly a procedure-only document
        diagnosis_indicators = [
            'diagnosis', 'condition', 'disease', 'disorder', 'syndrome',
            'chief complaint', 'assessment', 'impression', 'symptoms',
            'past medical history', 'comorbid', 'chronic', 'acute'
        ]
        
        procedure_only_indicators = [
            'operative report', 'surgery report', 'procedure note'
        ]
        
        has_diagnosis_content = any(indicator in text for indicator in diagnosis_indicators)
        is_procedure_only = any(indicator in text for indicator in procedure_only_indicators)
        has_conditions = len(patient_data.get('conditions', [])) > 0
        
        return has_diagnosis_content or has_conditions or not is_procedure_only
    
    def _needs_cpt_analysis(self, text: str, patient_data: Dict[str, Any]) -> bool:
        """Determine if CPT analysis is needed"""
        procedure_indicators = [
            'procedure', 'surgery', 'operation', 'treatment', 'therapy',
            'examination', 'test', 'consultation', 'visit', 'evaluation',
            'office visit', 'follow-up', 'assessment', 'counseling'
        ]
        
        has_procedure_content = any(indicator in text for indicator in procedure_indicators)
        has_procedures = len(patient_data.get('procedures', [])) > 0
        
        # Most medical documents involve some billable service
        return has_procedure_content or has_procedures or 'visit' in text
    
    def _needs_hcpcs_analysis(self, text: str, patient_data: Dict[str, Any]) -> bool:
        """Determine if HCPCS analysis is needed"""
        hcpcs_indicators = [
            'equipment', 'device', 'prosthetic', 'orthotic', 'brace',
            'wheelchair', 'walker', 'cane', 'oxygen', 'cpap', 'supply',
            'dressing', 'catheter', 'ambulance', 'transport', 'dme',
            'artificial', 'implant', 'replacement'
        ]
        
        return any(indicator in text for indicator in hcpcs_indicators)
    
    def _get_analysis_reasoning(self, text: str, needs_icd10: bool, 
                              needs_cpt: bool, needs_hcpcs: bool) -> str:
        """Get reasoning for analysis decisions"""
        reasoning_parts = []
        
        if needs_icd10:
            reasoning_parts.append("ICD-10: Document contains diagnostic information")
        
        if needs_cpt:
            reasoning_parts.append("CPT: Document contains procedure/service information")
        
        if needs_hcpcs:
            reasoning_parts.append("HCPCS: Document mentions equipment/supplies")
        
        return "; ".join(reasoning_parts) if reasoning_parts else "No specific coding indicators found"
    
    def _verify_code_batch(self, codes: List[Dict[str, Any]], 
                          document_data: Dict[str, Any], agent_type: str) -> List[Dict[str, Any]]:
        """Verify a batch of codes of the same type with enhanced error handling"""
        batch_results = []
        
        for code in codes:
            try:
                # Validate code structure - handle both dict and non-dict inputs
                if not isinstance(code, dict):
                    logger.error(f"Invalid code structure: {type(code).__name__} - {code}")
                    error_code = {
                        'code': str(code),
                        'description': 'Invalid structure', 
                        'agent': agent_type,
                        'type': agent_type,
                        'confidence': 0
                    }
                    batch_results.append(self._create_error_verification(
                        error_code, f"Invalid code structure - expected dictionary, got {type(code).__name__}"
                    ))
                    continue
                
                # Ensure required fields exist with safe access
                code_value = code.get('code', '')
                if not code_value or code_value == '':
                    logger.error(f"Code missing required 'code' field: {code}")
                    # Create a safe code dict for error handling
                    safe_code = {
                        'code': f'MISSING_CODE_{len(batch_results)}',
                        'description': code.get('description', 'Missing code field'),
                        'agent': agent_type,
                        'type': agent_type,
                        'confidence': 0
                    }
                    batch_results.append(self._create_error_verification(
                        safe_code, "Missing or empty 'code' field"
                    ))
                    continue
                
                # Ensure all required fields are present and valid
                validated_code = {
                    'code': str(code_value).strip(),
                    'description': str(code.get('description', 'No description')),
                    'agent': str(code.get('agent', agent_type)),
                    'type': str(code.get('type', agent_type)),
                    'confidence': self._safe_float_conversion(code.get('confidence', 0.5)),
                    'reasoning': str(code.get('reasoning', 'No reasoning provided')),
                    'source': str(code.get('source', 'unknown'))
                }
                
                verification = self._verify_single_code(validated_code, document_data, agent_type)
                batch_results.append(verification)
                
            except Exception as e:
                logger.error(f"Error verifying code: {e}")
                import traceback
                logger.error(traceback.format_exc())
                
                # Create safe error verification
                safe_code = {
                    'code': str(code.get('code', 'ERROR_CODE')) if isinstance(code, dict) else 'ERROR_CODE',
                    'description': str(code.get('description', 'Error processing code')) if isinstance(code, dict) else 'Error processing code',
                    'agent': agent_type,
                    'type': agent_type,
                    'confidence': 0
                }
                batch_results.append(self._create_error_verification(safe_code, str(e)))
        
        return batch_results
    
    def _safe_float_conversion(self, value) -> float:
        """Safely convert a value to float for confidence scores"""
        try:
            if isinstance(value, (int, float)):
                return float(value)
            elif isinstance(value, str):
                # Try to extract number from string
                import re
                match = re.search(r'(\d+\.?\d*)', str(value))
                if match:
                    return float(match.group(1))
                return 0.5  # Default confidence
            else:
                return 0.5
        except (ValueError, TypeError):
            return 0.5
    
    def _verify_single_code(self, code: Dict[str, Any], 
                           document_data: Dict[str, Any], agent_type: str) -> Dict[str, Any]:
        """Verify a single code with enhanced logic"""
        
        anonymized_text = document_data.get('anonymized_text', '')[:2000]  # Increased context
        code_value = code.get('code', '')
        code_description = code.get('description', '')
        original_confidence = code.get('confidence', 0)
        
        # Enhanced verification prompt with better structure
        prompt = f"""
        As a medical coding expert, verify if this code is appropriate for the patient document.
        
        CODE DETAILS:
        - Code: {code_value}
        - Description: {code_description}
        - Type: {agent_type}
        - AI Confidence: {original_confidence:.0%}
        - Reasoning: {code.get('reasoning', 'Not provided')}
        
        PATIENT DOCUMENT:
        {anonymized_text}
        
        VERIFICATION CRITERIA:
        1. Is the code clinically appropriate for the documented condition/procedure?
        2. Is there sufficient documentation to support this code?
        3. Does the code accurately represent what is documented?
        4. Are there any coding conflicts or contraindications?
        
        Based on your expert analysis, provide:
        - APPROPRIATE: Yes or No
        - CONFIDENCE: Rate 0-100 (how confident you are in this verification)
        - CONCERNS: Any specific concerns or issues (or "None" if no concerns)
        - RECOMMENDATIONS: Specific recommendations (or "Code approved as documented")
        
        Respond in this exact format:
        APPROPRIATE: [Yes/No]
        CONFIDENCE: [0-100]
        CONCERNS: [Your concerns or "None"]
        RECOMMENDATIONS: [Your recommendations]
        """
        
        try:
            verification = self.query_llm_with_context(prompt)
            return self._parse_verification_enhanced(verification, code)
        except Exception as e:
            logger.error(f"LLM verification failed for {code.get('code')}: {e}")
            return self._create_enhanced_fallback_verification(code)
    
    def _parse_verification_enhanced(self, verification: str, code: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced verification parsing with better error handling"""
        if not verification:
            return self._create_enhanced_fallback_verification(code)
        
        try:
            # Initialize defaults
            is_appropriate = False
            confidence = 50
            concerns = "Unable to parse verification response"
            recommendations = "Manual review recommended"
            
            # Parse line by line for better accuracy
            lines = verification.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('APPROPRIATE:'):
                    appropriate_text = line.split(':', 1)[1].strip().lower()
                    is_appropriate = 'yes' in appropriate_text
                elif line.startswith('CONFIDENCE:'):
                    confidence_text = line.split(':', 1)[1].strip()
                    confidence_match = re.search(r'(\d+)', confidence_text)
                    if confidence_match:
                        confidence = min(max(int(confidence_match.group(1)), 0), 100)
                elif line.startswith('CONCERNS:'):
                    concerns = line.split(':', 1)[1].strip()
                    if concerns.lower() in ['none', 'no concerns', 'n/a']:
                        concerns = "No specific concerns identified"
                elif line.startswith('RECOMMENDATIONS:'):
                    recommendations = line.split(':', 1)[1].strip()
            
            # Determine status based on appropriateness and confidence
            if is_appropriate and confidence >= 80:
                status = 'approved'
            elif is_appropriate and confidence >= 60:
                status = 'approved_with_review'
            elif is_appropriate and confidence >= 40:
                status = 'needs_review'
            else:
                status = 'rejected'
            
            # Calculate final score (weighted average of original confidence and verification confidence)
            original_conf = code.get('confidence', 0)
            if isinstance(original_conf, (int, float)):
                if original_conf <= 1:
                    original_conf *= 100
            else:
                original_conf = 50
                
            final_score = (confidence * 0.7) + (original_conf * 0.3)  # Weight verification more heavily
            
            return {
                'code': code['code'],
                'description': code['description'],
                'agent': code.get('agent', code.get('type', 'Unknown')),
                'original_confidence': original_conf,
                'is_appropriate': is_appropriate,
                'verification_confidence': confidence,
                'concerns': concerns,
                'recommendations': recommendations,
                'status': status,
                'final_score': final_score
            }
        
        except Exception as e:
            logger.error(f"Error parsing verification: {e}")
            return self._create_enhanced_fallback_verification(code)
    
    def _create_enhanced_fallback_verification(self, code: Dict[str, Any]) -> Dict[str, Any]:
        """Create enhanced fallback verification when LLM fails"""
        original_confidence = code.get('confidence', 0)
        if isinstance(original_confidence, (int, float)):
            if original_confidence <= 1:
                original_confidence *= 100
        else:
            original_confidence = 50
        
        # Use original confidence for fallback determination
        if original_confidence >= 80:
            status = 'approved_with_review'  # Conservative approach
            is_appropriate = True
        elif original_confidence >= 60:
            status = 'needs_review'
            is_appropriate = True
        else:
            status = 'needs_review'
            is_appropriate = False
        
        return {
            'code': code['code'],
            'description': code['description'],
            'agent': code.get('agent', 'Unknown'),
            'original_confidence': original_confidence,
            'is_appropriate': is_appropriate,
            'verification_confidence': 60,  # Moderate confidence in fallback
            'concerns': 'Verification system temporarily unavailable - using AI confidence score',
            'recommendations': f'Manual review recommended. Original AI confidence: {original_confidence:.0f}%',
            'status': status,
            'final_score': original_confidence
        }
    
    def _create_fallback_verification(self, code: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback verification when LLM fails - delegate to enhanced version"""
        return self._create_enhanced_fallback_verification(code)
    
    def _create_error_verification(self, code: Dict[str, Any], error: str) -> Dict[str, Any]:
        """Create error verification result with proper data structure and safe access"""
        try:
            # Safely extract values with proper type checking
            if isinstance(code, dict):
                code_value = str(code.get('code', 'Unknown'))
                description = str(code.get('description', 'Unknown description'))
                agent_type = str(code.get('agent', code.get('type', 'Unknown')))
                confidence = code.get('confidence', 0)
            else:
                # Handle non-dict inputs
                code_value = str(code) if code else 'Unknown'
                description = 'Unknown description'
                agent_type = 'Unknown'
                confidence = 0
            
            # Safely convert confidence to number
            confidence = self._safe_float_conversion(confidence)
            
            # Ensure confidence is in percentage form (0-100)
            if confidence <= 1:
                confidence_pct = confidence * 100
            else:
                confidence_pct = min(confidence, 100)
                
        except Exception as e:
            logger.error(f"Error creating error verification: {e}")
            # Ultimate fallback values
            code_value = 'Error_Code'
            description = 'Error processing code'
            agent_type = 'Unknown'
            confidence_pct = 0
            
        return {
            'code': code_value,
            'description': description,
            'agent': agent_type,
            'original_confidence': confidence_pct,
            'is_appropriate': False,
            'verification_confidence': 0,
            'concerns': f'Verification error: {error}',
            'recommendations': 'Manual review required due to system error',
            'status': 'error',
            'final_score': 0
        }
    
    def _cross_validate_codes(self, verification_results: List[Dict[str, Any]], 
                            document_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Perform cross-validation between codes"""
        if len(verification_results) <= 1:
            return verification_results
        
        logger.info("Performing cross-code validation")
        
        # Check for conflicts and enhance recommendations
        for i, result in enumerate(verification_results):
            conflicts = self._check_code_conflicts(result, verification_results, i)
            if conflicts:
                result['concerns'] += f"; CONFLICTS: {conflicts}"
                if result['status'] == 'approved':
                    result['status'] = 'approved_with_review'
        
        return verification_results
    
    def _check_code_conflicts(self, current_code: Dict[str, Any], 
                            all_codes: List[Dict[str, Any]], current_index: int) -> str:
        """Check for conflicts between codes"""
        conflicts = []
        
        # Simple conflict detection (can be enhanced)
        current_agent = current_code.get('agent', '')
        
        for i, other_code in enumerate(all_codes):
            if i == current_index:
                continue
            
            other_agent = other_code.get('agent', '')
            
            # Check for duplicate codes
            if current_code['code'] == other_code['code']:
                conflicts.append(f"Duplicate code {current_code['code']}")
            
            # Check for related codes that might conflict
            if current_agent == 'ICD-10' and other_agent == 'ICD-10':
                if self._are_conflicting_diagnoses(current_code['code'], other_code['code']):
                    conflicts.append(f"Conflicting diagnosis with {other_code['code']}")
        
        return "; ".join(conflicts)
    
    def _are_conflicting_diagnoses(self, code1: str, code2: str) -> bool:
        """Check if two ICD-10 codes represent conflicting diagnoses"""
        # Basic conflict detection - can be enhanced with medical knowledge
        if code1[:3] == code2[:3]:  # Same category
            return False
        
        # Add specific conflict rules here
        return False
    
    def _generate_insights(self, results: Dict[str, Any], 
                          document_data: Dict[str, Any], 
                          analysis_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Generate master insights"""
        
        # Count analyses performed
        analyses_performed = sum(1 for key in ['icd10_analysis', 'cpt_analysis', 'hcpcs_analysis'] 
                               if results.get(key) is not None)
        
        # Calculate complexity
        complexity_score = self._calculate_complexity(results, document_data)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(results, analysis_plan)
        
        # Assess quality
        quality_assessment = self._assess_overall_quality(results)
        
        insights_prompt = f"""
        Analyze this medical coding session and provide professional insights:
        
        DOCUMENT TYPE: {results.get('document_type', 'Unknown')}
        ANALYSES PERFORMED: {analyses_performed}/3 (ICD-10: {results.get('icd10_analysis') is not None}, CPT: {results.get('cpt_analysis') is not None}, HCPCS: {results.get('hcpcs_analysis') is not None})
        COMPLEXITY SCORE: {complexity_score}/10
        
        Provide brief insights on:
        1. Coding session summary
        2. Key challenges or considerations
        3. Documentation quality assessment
        4. Recommended next steps
        
        Keep response professional and concise (max 200 words).
        """
        
        try:
            insights_text = self.query_llm_with_context(insights_prompt)
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            insights_text = f"Analysis completed for {analyses_performed} coding systems. Manual review recommended."
        
        return {
            'insights': insights_text,
            'complexity_score': complexity_score,
            'analyses_performed': analyses_performed,
            'recommendations': recommendations,
            'quality_assessment': quality_assessment,
            'analysis_plan': analysis_plan
        }
    
    def _calculate_complexity(self, results: Dict[str, Any], document_data: Dict[str, Any]) -> int:
        """Calculate coding complexity score (1-10)"""
        complexity = 1
        
        # Base complexity on number of applicable systems
        applicable_systems = sum(1 for r in [results.get('icd10_analysis'), 
                                           results.get('cpt_analysis'), 
                                           results.get('hcpcs_analysis')] if r is not None)
        complexity += applicable_systems * 2
        
        # Factor in extracted information quantity
        patient_data = document_data.get('patient_data', {})
        total_items = (len(patient_data.get('conditions', [])) + 
                      len(patient_data.get('procedures', [])) +
                      len(patient_data.get('medications', [])))
        
        if total_items > 10:
            complexity += 2
        elif total_items > 5:
            complexity += 1
        
        # Factor in document length
        text_length = len(document_data.get('anonymized_text', ''))
        if text_length > 5000:
            complexity += 1
        
        return min(complexity, 10)
    
    def _generate_recommendations(self, results: Dict[str, Any], 
                                analysis_plan: Dict[str, Any]) -> List[str]:
        """Generate coding recommendations"""
        recommendations = []
        
        if results.get('icd10_analysis'):
            recommendations.append("Review ICD-10 diagnoses for specificity and completeness")
        
        if results.get('cpt_analysis'):
            recommendations.append("Verify CPT procedures match documented services")
        
        if results.get('hcpcs_analysis'):
            recommendations.append("Confirm HCPCS items have proper medical necessity documentation")
        
        if analysis_plan.get('needs_icd10') and not results.get('icd10_analysis'):
            recommendations.append("Consider ICD-10 analysis - diagnostic content detected")
        
        if analysis_plan.get('needs_cpt') and not results.get('cpt_analysis'):
            recommendations.append("Consider CPT analysis - procedure content detected")
        
        if analysis_plan.get('needs_hcpcs') and not results.get('hcpcs_analysis'):
            recommendations.append("Consider HCPCS analysis - equipment/supply content detected")
        
        recommendations.append("Perform final review before submission")
        
        return recommendations
    
    def _assess_overall_quality(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall quality of analysis"""
        quality_scores = []
        
        for analysis_key in ['icd10_analysis', 'cpt_analysis', 'hcpcs_analysis']:
            analysis = results.get(analysis_key)
            if analysis and analysis.get('analysis_quality'):
                quality_scores.append(analysis['analysis_quality'].get('quality_score', 50))
        
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 50
        
        return {
            'overall_score': avg_quality,
            'individual_scores': {
                'icd10': results.get('icd10_analysis', {}).get('analysis_quality', {}).get('quality_score', 0),
                'cpt': results.get('cpt_analysis', {}).get('analysis_quality', {}).get('quality_score', 0),
                'hcpcs': results.get('hcpcs_analysis', {}).get('analysis_quality', {}).get('quality_score', 0)
            },
            'assessment': 'Good' if avg_quality >= 70 else 'Fair' if avg_quality >= 50 else 'Needs Improvement'
        }
    
    def analyze_document(self, document_text: str, run_icd10: bool = True, 
                       run_cpt: bool = True, run_hcpcs: bool = False) -> Dict[str, Any]:
        """Analyze document with selected agents"""
        results = {}
        
        if run_icd10 and self.icd10_agent:
            logger.info("Running ICD-10 analysis")
            results['icd10'] = self.icd10_agent.analyze_document(document_text)
        
        if run_cpt and self.cpt_agent:
            logger.info("Running CPT analysis")
            results['cpt'] = self.cpt_agent.analyze_document(document_text)
        
        if run_hcpcs and self.hcpcs_agent:
            logger.info("Running HCPCS analysis")
            results['hcpcs'] = self.hcpcs_agent.analyze_document(document_text)
        
        return results
    
    def get_code_suggestions(self, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get code suggestions from analysis results with improved error handling"""
        suggestions = []
        
        # Input validation
        if not isinstance(analysis_results, dict):
            logger.error(f"Invalid analysis_results type: {type(analysis_results)}")
            return []
            
        try:
            # Extract ICD-10 suggestions
            if 'icd10' in analysis_results and analysis_results['icd10']:
                icd10_result = analysis_results['icd10']
                # Handle both dictionary and list formats
                if isinstance(icd10_result, dict):
                    icd10_suggestions = icd10_result.get('suggested_codes', [])
                    if not icd10_suggestions and 'codes' in icd10_result:
                        # Alternative field name
                        icd10_suggestions = icd10_result.get('codes', [])
                elif isinstance(icd10_result, list):
                    # If the result is already a list of codes
                    icd10_suggestions = icd10_result
                else:
                    icd10_suggestions = []
                
                for code in icd10_suggestions:
                    if isinstance(code, dict):
                        code['agent'] = 'ICD-10'
                        code['type'] = 'ICD-10'
                        suggestions.append(code)
                    elif isinstance(code, str):
                        # Handle plain string codes
                        suggestions.append({
                            'code': code,
                            'description': 'ICD-10 Code',
                            'agent': 'ICD-10',
                            'type': 'ICD-10',
                            'confidence': 0.8
                        })
            
            # Extract CPT suggestions
            if 'cpt' in analysis_results and analysis_results['cpt']:
                cpt_result = analysis_results['cpt']
                # Handle both dictionary and list formats
                if isinstance(cpt_result, dict):
                    cpt_suggestions = cpt_result.get('suggested_codes', [])
                    if not cpt_suggestions and 'codes' in cpt_result:
                        # Alternative field name
                        cpt_suggestions = cpt_result.get('codes', [])
                elif isinstance(cpt_result, list):
                    # If the result is already a list of codes
                    cpt_suggestions = cpt_result
                else:
                    cpt_suggestions = []
                
                for code in cpt_suggestions:
                    if isinstance(code, dict):
                        code['agent'] = 'CPT'
                        code['type'] = 'CPT'
                        suggestions.append(code)
                    elif isinstance(code, str):
                        # Handle plain string codes
                        suggestions.append({
                            'code': code,
                            'description': 'CPT Code',
                            'agent': 'CPT',
                            'type': 'CPT',
                            'confidence': 0.8
                        })
            
            # Extract HCPCS suggestions
            if 'hcpcs' in analysis_results and analysis_results['hcpcs']:
                hcpcs_result = analysis_results['hcpcs']
                # Handle both dictionary and list formats
                if isinstance(hcpcs_result, dict):
                    hcpcs_suggestions = hcpcs_result.get('suggested_codes', [])
                    if not hcpcs_suggestions and 'codes' in hcpcs_result:
                        # Alternative field name
                        hcpcs_suggestions = hcpcs_result.get('codes', [])
                elif isinstance(hcpcs_result, list):
                    # If the result is already a list of codes
                    hcpcs_suggestions = hcpcs_result
                else:
                    hcpcs_suggestions = []
                
                for code in hcpcs_suggestions:
                    if isinstance(code, dict):
                        code['agent'] = 'HCPCS'
                        code['type'] = 'HCPCS'
                        suggestions.append(code)
                    elif isinstance(code, str):
                        # Handle plain string codes
                        suggestions.append({
                            'code': code,
                            'description': 'HCPCS Code',
                            'agent': 'HCPCS',
                            'type': 'HCPCS',
                            'confidence': 0.8
                        })
                    
            # Ensure each suggestion has the required fields
            for suggestion in suggestions:
                if 'code' not in suggestion:
                    continue
                
                # Ensure description exists
                if 'description' not in suggestion or not suggestion['description']:
                    code_type = suggestion.get('type', suggestion.get('agent', 'Unknown'))
                    suggestion['description'] = f"{code_type} Code {suggestion['code']}"
                
                # Ensure confidence exists and is a valid float between 0-1
                if 'confidence' not in suggestion:
                    suggestion['confidence'] = 0.8
                elif not isinstance(suggestion['confidence'], (int, float)):
                    try:
                        suggestion['confidence'] = float(suggestion['confidence'])
                    except:
                        suggestion['confidence'] = 0.8
                
                # Normalize confidence to 0-1 range
                if suggestion['confidence'] > 1.0:
                    suggestion['confidence'] = suggestion['confidence'] / 100.0
                
            logger.info(f"Found {len(suggestions)} suggested codes from analysis results")
            return suggestions
            
        except Exception as e:
            logger.error(f"Error in get_code_suggestions: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    def search_codes(self, query: str, code_type: str = "all", max_results: int = 15) -> List[Dict[str, Any]]:
        """Search for medical codes matching query"""
        # Make sure we're using the latest processed knowledge base
        if not self.code_searcher:
            self.code_searcher = CodeSearcher()
        
        # Reload the knowledge base to ensure we have the latest data
        self.code_searcher.load_latest_knowledge_base()
        
        # Search for codes
        results = self.code_searcher.search(query, code_type, max_results)
        
        # Return results
        logger.info(f"Code search for '{query}' in '{code_type}' returned {len(results)} results")
        return results
    
    def suggest_codes(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Implement abstract method - not used directly"""
        return []

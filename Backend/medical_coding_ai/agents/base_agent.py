import ollama
import yaml
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging
import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from utils.vector_store import VectorStore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all medical coding agents"""
    
    def __init__(self, model_name: str = "llama3.2:3b-instruct-q4_0", agent_type: str = "base"):
        self.model_name = model_name
        self.agent_type = agent_type
        self.vector_store = VectorStore()
        self.knowledge_loaded = False
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from config.yaml"""
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.yaml')
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            logger.warning("Config file not found, using defaults")
            return {
                'ollama': {'model_name': 'llama3.2:3b-instruct-q4_0', 'base_url': 'http://localhost:11434'},
                'agents': {'confidence_threshold': 60, 'max_suggestions': 3}
            }
    
    @abstractmethod
    def analyze_document(self, document_text: str) -> Dict[str, Any]:
        """Analyze document for agent-specific information"""
        pass
    
    @abstractmethod
    def suggest_codes(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest medical codes based on analysis"""
        pass
    
    def load_knowledge_base(self, codes: List[Dict[str, Any]]):
        """Load processed codes into vector store"""
        if not codes:
            logger.warning(f"No codes provided for {self.agent_type}")
            return
            
        documents = [code['text_chunk'] for code in codes]
        metadata = [
            {
                'code': code['code'],
                'description': code['description'],
                'type': code['type'],
                'agent': self.agent_type
            }
            for code in codes
        ]
        
        self.vector_store.add_documents(documents, metadata)
        self.knowledge_loaded = True
        logger.info(f"Loaded {len(codes)} codes for {self.agent_type}")
    
    def search_relevant_codes(self, query: str, k: int = 10) -> List[Dict[str, Any]]:
        """Search for relevant codes using RAG"""
        if not self.knowledge_loaded:
            logger.warning(f"Knowledge base not loaded for {self.agent_type}")
            return []
        
        try:
            results = self.vector_store.search(query, k)
            return [
                {
                    'code': result['metadata']['code'],
                    'description': result['metadata']['description'],
                    'type': result['metadata']['type'],
                    'relevance_score': float(result['score']),
                    'agent': self.agent_type
                }
                for result in results
            ]
        except Exception as e:
            logger.error(f"Error searching codes: {e}")
            return []
    
    def query_llm_with_context(self, prompt: str, context_codes: List[Dict[str, Any]] = None) -> str:
        """Query LLM with relevant code context"""
        context = ""
        if context_codes:
            context = f"Relevant {self.agent_type} codes for reference:\n"
            for code in context_codes[:5]:  # Limit context
                context += f"- {code['code']}: {code['description']}\n"
            context += "\n"
        
        full_prompt = f"{context}Query: {prompt}"
        
        try:
            response = ollama.chat(
                model=self.model_name,
                messages=[
                    {
                        'role': 'system', 
                        'content': f'You are a medical coding specialist focusing on {self.agent_type} codes. Provide accurate, evidence-based coding suggestions with confidence scores.'
                    },
                    {
                        'role': 'user', 
                        'content': full_prompt
                    }
                ]
            )
            return response['message']['content']
        except Exception as e:
            logger.error(f"LLM query failed: {e}")
            return f"Error: Unable to process request - {str(e)}"
    
    def validate_code_format(self, code: str) -> bool:
        """Validate code format for this agent type"""
        # To be implemented by subclasses
        return True
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """Get agent statistics"""
        return {
            'agent_type': self.agent_type,
            'model_name': self.model_name,
            'knowledge_loaded': self.knowledge_loaded,
            'vector_store_size': len(self.vector_store.documents) if self.knowledge_loaded else 0
        }

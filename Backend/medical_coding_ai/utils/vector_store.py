import faiss
import numpy as np
import pickle
# from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    """FAISS-based vector store for medical codes"""
    
    def __init__(self, dimension: int = 384, index_type: str = "flat"):
        self.dimension = dimension
        self._encoder = None
        
        # Initialize FAISS index
        if index_type == "flat":
            self.index = faiss.IndexFlatIP(dimension)  # Inner product for similarity
        else:
            self.index = faiss.IndexHNSWFlat(dimension, 32)
            
        self.documents = []
        self.metadata = []
        self.is_trained = False

    @property
    def encoder(self):
        if self._encoder is None:
            try:
                logger.info("Initializing SentenceTransformer in VectorStore...")
                from sentence_transformers import SentenceTransformer
                self._encoder = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("SentenceTransformer initialized in VectorStore")
            except Exception as e:
                logger.error(f"Error loading sentence transformer: {e}")
                self._encoder = None
        return self._encoder
    
    def add_documents(self, documents: List[str], metadata: List[Dict] = None):
        """Add documents to vector store"""
        if not documents:
            logger.warning("No documents provided to add")
            return
            
        try:
            # Generate embeddings
            embeddings = self.encoder.encode(documents, show_progress_bar=True)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add to FAISS index
            self.index.add(embeddings.astype('float32'))
            
            # Store documents and metadata
            self.documents.extend(documents)
            
            if metadata:
                self.metadata.extend(metadata)
            else:
                self.metadata.extend([{} for _ in documents])
            
            self.is_trained = True
            logger.info(f"Added {len(documents)} documents to vector store")
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if not self.is_trained:
            logger.warning("Vector store is not trained")
            return []
            
        try:
            # Generate query embedding
            query_embedding = self.encoder.encode([query])
            faiss.normalize_L2(query_embedding)
            
            # Search
            scores, indices = self.index.search(query_embedding.astype('float32'), k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.documents) and idx >= 0:  # Valid index
                    results.append({
                        'document': self.documents[idx],
                        'metadata': self.metadata[idx] if idx < len(self.metadata) else {},
                        'score': float(score)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []
    
    def search_with_threshold(self, query: str, k: int = 5, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Search with similarity threshold"""
        results = self.search(query, k)
        return [r for r in results if r['score'] >= threshold]
    
    def save(self, path: str):
        """Save vector store to disk"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, f"{path}.index")
            
            # Save documents and metadata
            with open(f"{path}.pkl", 'wb') as f:
                pickle.dump({
                    'documents': self.documents,
                    'metadata': self.metadata,
                    'dimension': self.dimension,
                    'is_trained': self.is_trained
                }, f)
            
            logger.info(f"Vector store saved to {path}")
            
        except Exception as e:
            logger.error(f"Error saving vector store: {e}")
            raise
    
    def load(self, path: str):
        """Load vector store from disk"""
        try:
            # Load FAISS index
            if os.path.exists(f"{path}.index"):
                self.index = faiss.read_index(f"{path}.index")
            
            # Load documents and metadata
            if os.path.exists(f"{path}.pkl"):
                with open(f"{path}.pkl", 'rb') as f:
                    data = pickle.load(f)
                    self.documents = data.get('documents', [])
                    self.metadata = data.get('metadata', [])
                    self.dimension = data.get('dimension', self.dimension)
                    self.is_trained = data.get('is_trained', False)
            
            logger.info(f"Vector store loaded from {path}")
            
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        return {
            'dimension': self.dimension,
            'total_documents': len(self.documents),
            'total_vectors': self.index.ntotal,
            'is_trained': self.is_trained,
            'index_type': type(self.index).__name__
        }
    
    def clear(self):
        """Clear all data from vector store"""
        self.index.reset()
        self.documents.clear()
        self.metadata.clear()
        self.is_trained = False
        logger.info("Vector store cleared")
    
    def batch_search(self, queries: List[str], k: int = 5) -> List[List[Dict[str, Any]]]:
        """Batch search for multiple queries"""
        if not self.is_trained:
            return [[] for _ in queries]
            
        try:
            # Generate embeddings for all queries
            query_embeddings = self.encoder.encode(queries)
            faiss.normalize_L2(query_embeddings)
            
            # Batch search
            scores, indices = self.index.search(query_embeddings.astype('float32'), k)
            
            all_results = []
            for i in range(len(queries)):
                query_results = []
                for score, idx in zip(scores[i], indices[i]):
                    if idx < len(self.documents) and idx >= 0:
                        query_results.append({
                            'document': self.documents[idx],
                            'metadata': self.metadata[idx] if idx < len(self.metadata) else {},
                            'score': float(score)
                        })
                all_results.append(query_results)
            
            return all_results
            
        except Exception as e:
            logger.error(f"Error in batch search: {e}")
            return [[] for _ in queries]

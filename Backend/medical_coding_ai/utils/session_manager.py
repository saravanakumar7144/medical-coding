from typing import Dict, Any, Optional
import redis
import json
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
import os

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class SessionManager:
    def __init__(self, redis_url: str = "redis://localhost:6379", session_timeout: int = 3600):
        """
        Initialize SessionManager
        :param redis_url: Redis connection URL
        :param session_timeout: Session timeout in seconds (default: 1 hour)
        """
        self.redis = redis.from_url(redis_url)
        self.session_timeout = session_timeout
        # Import JWT secret from auth module to ensure consistency
        # JWT_SECRET is validated at startup in auth.py - no fallback allowed
        from medical_coding_ai.api.auth import JWT_SECRET
        self.secret_key = JWT_SECRET

    def create_session(self, user_id: str = None) -> Dict[str, Any]:
        """Create a new session"""
        from uuid import uuid4
        session_id = str(uuid4())
        session_data = {
            'session_id': session_id,
            'created_at': datetime.now().isoformat(),
            'user_id': user_id,
            'document_processed': False,
            'patient_data': None,
            'analysis_results': None,
            'suggested_codes': [],
            'selected_codes': [],
            'verification_results': [],
            'processing_status': {}
        }
        
        # Store session in Redis
        self.redis.setex(
            f"session:{session_id}",
            self.session_timeout,
            json.dumps(session_data)
        )
        
        return session_data

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        session_data = self.redis.get(f"session:{session_id}")
        if not session_data:
            return None
        
        # Refresh session timeout
        self.refresh_session(session_id)
        
        return json.loads(session_data)

    def update_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """Update session data"""
        existing_session = self.get_session(session_id)
        if not existing_session:
            return False
            
        # Update session data
        existing_session.update(data)
        
        # Store updated data
        self.redis.setex(
            f"session:{session_id}",
            self.session_timeout,
            json.dumps(existing_session)
        )
        
        return True

    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        return bool(self.redis.delete(f"session:{session_id}"))

    def refresh_session(self, session_id: str) -> bool:
        """Refresh session timeout"""
        session_data = self.redis.get(f"session:{session_id}")
        if not session_data:
            return False
            
        self.redis.expire(f"session:{session_id}", self.session_timeout)
        return True

    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions"""
        # This is a placeholder - Redis automatically removes expired keys
        return 0

    # Authentication methods
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm="HS256")
        return encoded_jwt

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.JWTError:
            raise HTTPException(
                status_code=401,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def hash_password(self, password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(plain_password, hashed_password)

    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
        """Get current user from token"""
        payload = self.verify_token(token)
        return payload
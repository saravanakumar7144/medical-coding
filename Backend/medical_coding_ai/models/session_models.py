from sqlalchemy import Column, String, Boolean, DateTime, JSON, UUID, LargeBinary, text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..utils.db import Base


class UserSession(Base):
    __tablename__ = 'user_sessions'

    session_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    # Session Tokens (Hashed)
    session_token_hash = Column(String(255), unique=True, nullable=False)
    refresh_token_hash = Column(String(255), unique=True)

    # Session Info (Encrypted)
    ip_address_encrypted = Column(LargeBinary, nullable=False)
    user_agent_encrypted = Column(LargeBinary)
    device_info = Column(JSON, server_default='{}')
    geolocation = Column(JSON, server_default='{}')

    # Status
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)
    terminated_at = Column(DateTime)
    termination_reason = Column(String(100))

    # Security Flags
    suspicious_activity = Column(Boolean, default=False)
    mfa_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity_at = Column(DateTime, default=datetime.utcnow)

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    @classmethod
    def create_session(cls, user_id: str, tenant_id: str, token_hash: str,
                      ip_address_encrypted: bytes, user_agent_encrypted: bytes,
                      device_info: dict = None, geolocation: dict = None,
                      session_duration: timedelta = timedelta(days=1)):
        return cls(
            user_id=user_id,
            tenant_id=tenant_id,
            session_token_hash=token_hash,
            ip_address_encrypted=ip_address_encrypted,
            user_agent_encrypted=user_agent_encrypted,
            device_info=device_info or {},
            geolocation=geolocation or {},
            expires_at=datetime.utcnow() + session_duration
        )
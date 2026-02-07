"""
Security Monitoring Models
Phase 5: Security Events and Login Attempts Tracking
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from medical_coding_ai.utils.db import Base
import uuid
import datetime


class SecurityEvent(Base):
    """
    Security events for monitoring and alerting
    HIPAA: Retain for 7 years
    """
    __tablename__ = 'security_events'

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'), index=True)

    # Event details
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default='low', index=True)

    # Request details (IP encrypted)
    ip_address = Column(Text, nullable=False)  # Encrypted
    user_agent = Column(Text)
    request_path = Column(String(500))
    request_method = Column(String(10))

    # Location (derived from IP)
    country = Column(String(100))
    city = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)

    # Event details (flexible JSON)
    details = Column(JSONB)

    # Resolution tracking
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Relationships
    # tenant = relationship("Tenant", back_populates="security_events")
    # user = relationship("User", foreign_keys=[user_id], back_populates="security_events")
    # resolver = relationship("User", foreign_keys=[resolved_by])


class LoginAttempt(Base):
    """
    Login attempts for security monitoring and analysis
    HIPAA: Retain for 7 years
    """
    __tablename__ = 'login_attempts'

    attempt_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='SET NULL'), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'), index=True)

    # Attempt details
    username = Column(String(255), nullable=False, index=True)
    success = Column(Boolean, nullable=False, index=True)
    failure_reason = Column(String(200))

    # Request details (IP encrypted)
    ip_address = Column(Text, nullable=False)  # Encrypted
    user_agent = Column(Text)

    # Location (derived from IP)
    country = Column(String(100))
    city = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)

    # MFA details
    mfa_required = Column(Boolean, default=False)
    mfa_success = Column(Boolean)
    mfa_method = Column(String(50))

    # Timestamp
    attempted_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, index=True)

    # Relationships
    # tenant = relationship("Tenant", back_populates="login_attempts")
    # user = relationship("User", back_populates="login_attempts")

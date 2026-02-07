"""
Settings Models
Database models for tenant-specific settings: AI configuration, security policies, and backup records
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from medical_coding_ai.utils.db import Base
import uuid
from datetime import datetime


class TenantAISettings(Base):
    """
    AI and ML configuration per tenant
    Stores model preferences, thresholds, and feature flags
    """
    __tablename__ = 'tenant_ai_settings'

    setting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    # Model Configuration
    model_provider = Column(String(50), default='ollama')  # 'ollama', 'openai', 'anthropic'
    model_name = Column(String(100), default='mistral')
    model_version = Column(String(50))

    # Thresholds
    confidence_threshold = Column(Integer, default=75)  # 0-100
    min_suggestions = Column(Integer, default=3)
    max_suggestions = Column(Integer, default=10)

    # Feature Flags
    code_suggestions_enabled = Column(Boolean, default=True)
    error_detection_enabled = Column(Boolean, default=True)
    compliance_monitoring_enabled = Column(Boolean, default=True)
    natural_language_search_enabled = Column(Boolean, default=True)
    analytics_enabled = Column(Boolean, default=True)
    continuous_learning_enabled = Column(Boolean, default=False)
    auto_coding_enabled = Column(Boolean, default=False)

    # Training
    last_training_date = Column(DateTime(timezone=True))
    training_status = Column(String(50), default='idle')  # 'idle', 'training', 'completed', 'failed'
    training_error_message = Column(Text)
    custom_training_data_path = Column(String(500))

    # Usage Limits
    daily_suggestion_limit = Column(Integer, default=1000)
    current_daily_usage = Column(Integer, default=0)
    usage_reset_time = Column(DateTime(timezone=True))

    # Audit
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    tenant = relationship("Tenant", back_populates="ai_settings")


class TenantSecuritySettings(Base):
    """
    Security policies and compliance configuration per tenant
    Stores authentication requirements, password policies, and compliance flags
    """
    __tablename__ = 'tenant_security_settings'

    setting_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    # Authentication
    two_factor_required = Column(Boolean, default=False)
    two_factor_method = Column(String(20), default='totp')  # 'totp', 'sms', 'email'

    # SSO
    sso_enabled = Column(Boolean, default=False)
    sso_provider = Column(String(50))  # 'okta', 'azure_ad', 'google', 'saml'
    sso_config = Column(JSONB)

    # Password Policy
    password_policy = Column(String(50), default='strong')  # 'basic', 'strong', 'custom'
    password_min_length = Column(Integer, default=12)
    password_require_special = Column(Boolean, default=True)
    password_require_numbers = Column(Boolean, default=True)
    password_require_uppercase = Column(Boolean, default=True)
    password_require_lowercase = Column(Boolean, default=True)
    password_expiry_days = Column(Integer, default=90)
    password_history_count = Column(Integer, default=5)

    # Session
    session_timeout_minutes = Column(Integer, default=30)
    max_concurrent_sessions = Column(Integer, default=5)
    session_absolute_timeout_hours = Column(Integer, default=24)

    # Access Control
    ip_restriction_enabled = Column(Boolean, default=False)
    allowed_ip_ranges = Column(ARRAY(Text))

    # Data Protection
    data_encryption_enabled = Column(Boolean, default=True)
    anonymize_reports = Column(Boolean, default=True)
    mask_ssn = Column(Boolean, default=True)

    # Audit & Logging
    audit_logging_enabled = Column(Boolean, default=True)
    audit_retention_days = Column(Integer, default=2555)  # 7 years for HIPAA
    failed_login_lockout_threshold = Column(Integer, default=5)
    failed_login_lockout_duration_minutes = Column(Integer, default=30)

    # Compliance Frameworks
    hipaa_enabled = Column(Boolean, default=True)
    hitech_enabled = Column(Boolean, default=True)
    gdpr_enabled = Column(Boolean, default=False)
    state_privacy_laws = Column(ARRAY(Text))

    # Security Scans
    last_security_scan = Column(DateTime(timezone=True))
    last_vulnerability_report = Column(JSONB)
    compliance_status = Column(String(50), default='compliant')  # 'compliant', 'action_required', 'non_compliant'

    # Audit
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    tenant = relationship("Tenant", back_populates="security_settings")


class BackupRecord(Base):
    """
    Backup history and metadata per tenant
    Tracks all backup operations including status, size, and retention
    """
    __tablename__ = 'backup_records'

    backup_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)

    # Backup Info
    backup_name = Column(String(255), nullable=False)
    backup_type = Column(String(50), default='full')  # 'full', 'incremental', 'differential'
    backup_scope = Column(String(50), default='all')  # 'all', 'database', 'documents', 'config'

    # Storage
    storage_provider = Column(String(50), default='local')  # 'local', 's3', 'azure', 'gcs'
    storage_location = Column(String(500))
    storage_bucket = Column(String(255))
    storage_path = Column(String(500))

    # Size & Duration
    size_bytes = Column(BigInteger)
    duration_seconds = Column(Integer)

    # Status
    status = Column(String(50), default='pending')  # 'pending', 'in_progress', 'completed', 'failed'
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))

    # Error
    error_message = Column(Text)
    error_details = Column(JSONB)

    # Verification
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True))
    verification_checksum = Column(String(64))

    # Retention
    retention_days = Column(Integer, default=30)
    expires_at = Column(DateTime(timezone=True))
    deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True))

    # Backup Metadata (renamed from 'metadata' which is reserved in SQLAlchemy)
    backup_metadata = Column(JSONB)
    tables_included = Column(ARRAY(Text))
    record_counts = Column(JSONB)

    # Audit
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id'))

    # Relationships
    tenant = relationship("Tenant", back_populates="backups")
    creator = relationship("User", foreign_keys=[created_by])

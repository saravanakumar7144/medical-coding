from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, LargeBinary, ForeignKey, func, text, Date, DECIMAL, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..utils.db import Base
import uuid

class EnrollmentTier(Base):
    __tablename__ = "enrollment_tiers"

    tier_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    tier_name = Column(String(50), unique=True, nullable=False)
    tier_description = Column(Text)
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    yearly_price = Column(DECIMAL(10, 2), nullable=False)
    max_users = Column(Integer, nullable=False)
    max_storage_gb = Column(Integer, nullable=False)
    max_api_calls_per_day = Column(Integer, nullable=False)
    features = Column(JSON, server_default='{}')
    hipaa_compliant = Column(Boolean, default=True)
    data_retention_days = Column(Integer, default=2555)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Tenant(Base):
    __tablename__ = "tenants"

    tenant_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    tenant_name = Column(String(255), unique=True, nullable=False)
    company_name = Column(String(255))
    enrollment_tier = Column(String(50), nullable=False)
    
    # Encrypted fields stored as LargeBinary (BYTEA)
    contact_email_hash = Column(String(64))
    contact_email_encrypted = Column(LargeBinary)
    contact_phone_encrypted = Column(LargeBinary)
    address_encrypted = Column(LargeBinary)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default='US')
    postal_code_encrypted = Column(LargeBinary)

    baa_signed = Column(Boolean, default=False)
    baa_signed_date = Column(Date)
    baa_document_url = Column(Text)
    hipaa_compliant = Column(Boolean, default=True)
    data_encryption_enabled = Column(Boolean, default=True)

    max_users = Column(Integer, nullable=False)
    max_storage_gb = Column(Integer, nullable=False)

    settings = Column(JSON, server_default='{}')
    security_settings = Column(JSON, server_default='{"mfa_required": true, "password_expiry_days": 90, "session_timeout_minutes": 30, "ip_whitelist": []}')
    timezone = Column(String(50), default='UTC')
    language = Column(String(10), default='en')

    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=False)
    trial_ends_at = Column(DateTime)
    data_retention_days = Column(Integer, default=2555)
    onboarding_completed = Column(Boolean, default=False)
    website = Column(String(255))

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime)

    # Relationships
    ai_settings = relationship("TenantAISettings", back_populates="tenant", uselist=False)
    security_settings = relationship("TenantSecuritySettings", back_populates="tenant", uselist=False)
    backups = relationship("BackupRecord", back_populates="tenant")

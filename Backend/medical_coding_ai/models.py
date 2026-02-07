from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, Text, LargeBinary, JSON, Date, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class EnrollmentTier(Base):
    __tablename__ = "enrollment_tiers"

    tier_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tier_name = Column(String, unique=True, nullable=False)
    tier_description = Column(Text)
    monthly_price = Column(DECIMAL(10, 2), nullable=False)
    yearly_price = Column(DECIMAL(10, 2), nullable=False)
    max_users = Column(Integer, nullable=False)
    max_storage_gb = Column(Integer, nullable=False)
    max_api_calls_per_day = Column(Integer, nullable=False)
    features = Column(JSON, default={})
    hipaa_compliant = Column(Boolean, default=True)
    data_retention_days = Column(Integer, default=2555)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Tenant(Base):
    __tablename__ = "tenants"

    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_name = Column(String, unique=True, nullable=False)
    company_name = Column(String)
    enrollment_tier = Column(String, nullable=False)
    
    # Encrypted fields stored as LargeBinary (BYTEA)
    contact_email_hash = Column(String(64))
    contact_email_encrypted = Column(LargeBinary)
    contact_phone_encrypted = Column(LargeBinary)
    address_encrypted = Column(LargeBinary)
    city = Column(String)
    state = Column(String)
    country = Column(String, default='US')
    postal_code_encrypted = Column(LargeBinary)

    baa_signed = Column(Boolean, default=False)
    baa_signed_date = Column(Date)
    baa_document_url = Column(Text)
    hipaa_compliant = Column(Boolean, default=True)
    data_encryption_enabled = Column(Boolean, default=True)

    max_users = Column(Integer, nullable=False)
    max_storage_gb = Column(Integer, nullable=False)

    settings = Column(JSON, default={})
    security_settings = Column(JSON, default={'mfa_required': True, 'password_expiry_days': 90, 'session_timeout_minutes': 30, 'ip_whitelist': []})
    timezone = Column(String, default='UTC')
    language = Column(String, default='en')

    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=False)
    trial_ends_at = Column(DateTime)
    data_retention_days = Column(Integer, default=2555)
    onboarding_completed = Column(Boolean, default=False)
    website = Column(String)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime)

    users = relationship("User", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    username = Column(String, nullable=False)
    email_encrypted = Column(LargeBinary, nullable=False)
    email_hash = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    salt = Column(String)

    first_name_encrypted = Column(LargeBinary)
    last_name_encrypted = Column(LargeBinary)
    phone_encrypted = Column(LargeBinary)
    avatar_url = Column(Text)

    role = Column(String, default='coder')
    permissions = Column(JSON, default={})
    
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    tenant = relationship("Tenant", back_populates="users")
    medical_code_results = relationship("MedicalCodeParseResult", back_populates="user")

class MedicalCodeParseResult(Base):
    __tablename__ = "medical_code_parse_result"

    medical_code_parse_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    parse_result = Column(JSON, default={})
    is_draft = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="medical_code_results")

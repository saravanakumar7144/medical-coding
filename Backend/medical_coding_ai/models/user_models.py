from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, JSON, LargeBinary, ForeignKey, func, text, Date, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, INET, ARRAY
from sqlalchemy.orm import relationship
import datetime
import uuid
from ..utils.db import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = 'users'

    user_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    # Authentication
    username = Column(String(100), nullable=False)
    email_encrypted = Column(LargeBinary, nullable=False)
    dec_hash = Column(String(64), nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(255))

    # Personal Information (Encrypted)
    first_name_encrypted = Column(LargeBinary)
    last_name_encrypted = Column(LargeBinary)
    phone_encrypted = Column(LargeBinary)
    avatar_url = Column(String)
    dob_encrypted = Column(LargeBinary)
    ssn_encrypted = Column(LargeBinary)
    employee_id = Column(String(50))

    # Role & Permissions
    role = Column(String(20), nullable=False, server_default='coder')
    permissions = Column(JSON, server_default='{}')

    # Preferences
    timezone = Column(String(50), server_default='UTC')
    language = Column(String(10), server_default='en')

    # Status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token_hash = Column(String(255))
    email_verification_expires = Column(DateTime)
    email_verified_at = Column(DateTime)

    # Security
    last_login_at = Column(DateTime)
    last_login_ip_encrypted = Column(LargeBinary)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime)
    password_reset_token_hash = Column(String(255))
    password_reset_expires = Column(DateTime)
    password_changed_at = Column(DateTime)
    password_expires_at = Column(DateTime)

    # Multi-Factor Authentication
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret_encrypted = Column(LargeBinary)
    mfa_backup_codes_encrypted = Column(LargeBinary)

    # HIPAA Compliance
    hipaa_training_completed = Column(Boolean, default=False)
    hipaa_training_date = Column(Date)

    # Legal Acceptance (Terms & Conditions, Privacy Policy)
    terms_accepted = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime)
    terms_version = Column(String(20))
    privacy_policy_accepted = Column(Boolean, default=False)
    privacy_policy_accepted_at = Column(DateTime)
    privacy_policy_version = Column(String(20))

    # Access Control
    allowed_ip_addresses = Column(ARRAY(INET))
    access_level = Column(String(20), server_default='standard')

    # Timestamps
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    deleted_at = Column(DateTime)
    last_activity_at = Column(DateTime, server_default=func.current_timestamp())

    __table_args__ = (
        # Unique constraints per tenant
        # Note: email_hash is now dec_hash in our model
        UniqueConstraint('tenant_id', 'username', name='uq_tenant_username'),
        UniqueConstraint('tenant_id', 'dec_hash', name='uq_tenant_email_hash')
    )


class PasswordReset(Base):
    __tablename__ = 'password_resets'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), nullable=False)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_used_at = Column(DateTime)


class PasswordHistory(Base):
    """
    Phase 4: Password History Tracking
    Stores hashed passwords to prevent password reuse
    """
    __tablename__ = 'password_history'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    log_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    tenant_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)

    action_type = Column(String(100), nullable=False)
    action_category = Column(String(50), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)

    ip_address = Column(String(128), nullable=True)
    user_agent = Column(String(512), nullable=True)

    request_id = Column(UUID(as_uuid=True), nullable=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    api_endpoint = Column(String(255), nullable=True)
    http_method = Column(String(10), nullable=True)

    status = Column(String(20), default='success')
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

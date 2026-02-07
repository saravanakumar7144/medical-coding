-- ============================================
-- Multi-Tenant Database Schema
-- HIPAA COMPLIANT VERSION
-- TENANT MANAGEMENT + USER MANAGEMENT
-- Bronze, Silver, Gold Enrollment Tiers
-- Created date 25-10-2025
-- Created by : Yogesh
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HIPAA COMPLIANCE: Encryption Functions
-- ============================================

-- Function to encrypt sensitive data (PHI/PII)
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENROLLMENT TIERS TABLE
-- ============================================

CREATE TABLE enrollment_tiers (
    tier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(50) UNIQUE NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold')),
    tier_description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2) NOT NULL,
    max_users INTEGER NOT NULL,
    max_storage_gb INTEGER NOT NULL,
    max_api_calls_per_day INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    hipaa_compliant BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 2555, -- 7 years HIPAA requirement
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TENANTS TABLE
-- HIPAA: Business Associate Agreement tracking
-- ============================================

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    enrollment_tier VARCHAR(50) NOT NULL CHECK (enrollment_tier IN ('bronze', 'silver', 'gold')),

    -- Contact Information (Encrypted)
    contact_email_hash VARCHAR(64), -- For lookups without decryption
    contact_email_encrypted BYTEA, -- HIPAA: Encrypt PII
    contact_phone_encrypted BYTEA,

    -- Address (Encrypted)
    address_encrypted BYTEA,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    postal_code_encrypted BYTEA,

    -- HIPAA Compliance
    baa_signed BOOLEAN DEFAULT false, -- Business Associate Agreement
    baa_signed_date DATE,
    baa_document_url TEXT,
    hipaa_compliant BOOLEAN DEFAULT true,
    data_encryption_enabled BOOLEAN DEFAULT true,

    -- Tier Limits
    max_users INTEGER NOT NULL,
    max_storage_gb INTEGER NOT NULL,

    -- Settings
    settings JSONB DEFAULT '{}',
    security_settings JSONB DEFAULT '{"mfa_required": true, "password_expiry_days": 90, "session_timeout_minutes": 30, "ip_whitelist": []}'::jsonb,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    trial_ends_at TIMESTAMP,

    -- Data Retention (HIPAA Requirement)
    data_retention_days INTEGER DEFAULT 2555, -- 7 years

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    website VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete for audit trail
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES enrollment_tiers(tier_id),

    -- Subscription Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Status
    status VARCHAR(20) CHECK (status IN ('active', 'trial', 'suspended', 'cancelled', 'expired')) DEFAULT 'trial',

    -- Billing (PCI/HIPAA compliant - no card details stored)
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
    amount_paid DECIMAL(38,2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50), -- Only payment type, no sensitive data
    payment_reference VARCHAR(255), -- External payment gateway reference
    payment_gateway VARCHAR(50), -- e.g., 'stripe', 'authorize.net'

    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT false,
    next_billing_date DATE,

    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS TABLE
-- HIPAA COMPLIANT: Encrypted PII/PHI
-- ============================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Authentication
    username VARCHAR(100) NOT NULL,
    email_encrypted BYTEA NOT NULL, -- HIPAA: Encrypt email
    email_hash VARCHAR(64) NOT NULL, -- For lookups
    password_hash VARCHAR(255) NOT NULL, -- Already hashed with bcrypt
    salt VARCHAR(255),

    -- Personal Information (ENCRYPTED - PII/PHI)
    first_name_encrypted BYTEA,
    last_name_encrypted BYTEA,
    phone_encrypted BYTEA,
    avatar_url TEXT,

    -- Date of Birth (if applicable for healthcare)
    dob_encrypted BYTEA,
    ssn_encrypted BYTEA, -- Social Security Number (if needed)

    -- Role & Permissions
    role VARCHAR(20) CHECK (role IN ('admin', 'super_admin', 'coder', 'billing_specialist', 'manager', 'executive', 'auditor')) DEFAULT 'coder',
    permissions JSONB DEFAULT '{}',

    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token_hash VARCHAR(255), -- Hash token, don't store plain
    email_verified_at TIMESTAMP,

    -- Security (HIPAA Enhanced)
    last_login_at TIMESTAMP,
    last_login_ip_encrypted BYTEA, -- HIPAA: Encrypt IP addresses
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token_hash VARCHAR(255), -- Hash token
    password_reset_expires TIMESTAMP,
    password_changed_at TIMESTAMP,
    password_expires_at TIMESTAMP, -- HIPAA: Force password rotation

    -- Multi-Factor Authentication (REQUIRED for HIPAA)
    mfa_enabled BOOLEAN DEFAULT true, -- Required by default
    mfa_secret_encrypted BYTEA,
    mfa_backup_codes_encrypted BYTEA, -- Store encrypted backup codes

    -- HIPAA Compliance todo we need or not
    hipaa_training_completed BOOLEAN DEFAULT false,
    hipaa_training_date DATE,
    privacy_policy_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted_at TIMESTAMP,

    -- Access Control todo we need to TBD
    allowed_ip_addresses INET[], -- IP whitelist
    access_level VARCHAR(20) DEFAULT 'standard', -- standard, restricted, privileged

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraints per tenant
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, email_hash)
);

-- ============================================
-- USER SESSIONS TABLE
-- HIPAA: Enhanced session tracking
-- ============================================

CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Session Tokens (Hashed)
    session_token_hash VARCHAR(255) UNIQUE NOT NULL, -- Never store plain tokens
    refresh_token_hash VARCHAR(255) UNIQUE,

    -- Session Info (ENCRYPTED) todo network latency details  tbd
    ip_address_encrypted BYTEA NOT NULL, -- HIPAA: Encrypt IP
    user_agent_encrypted BYTEA, -- HIPAA: Encrypt user agent
    device_info JSONB DEFAULT '{}',
    geolocation JSONB DEFAULT '{}', -- For security monitoring

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    terminated_at TIMESTAMP,
    termination_reason VARCHAR(100), -- todo how to get this details

    -- todo to consider draft data or terminate data
    -- Security Flags
    suspicious_activity BOOLEAN DEFAULT false,
    mfa_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TENANT USAGE TABLE
-- HIPAA: Track for compliance reporting
-- ============================================

CREATE TABLE tenant_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,

    -- Usage Metrics
    active_users_count INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    phi_access_count INTEGER DEFAULT 0, -- Protected Health Information access --todo to check this one

    -- Security Metrics
    failed_login_attempts INTEGER DEFAULT 0,
    successful_logins INTEGER DEFAULT 0,
    mfa_challenges INTEGER DEFAULT 0,

    -- Compliance Metrics todo TBD to keep or not
    audit_log_entries INTEGER DEFAULT 0,
    data_export_requests INTEGER DEFAULT 0,
    data_deletion_requests INTEGER DEFAULT 0,

    -- Additional Metrics (extensible)
    daily_metrics JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one record per tenant per day
    UNIQUE(tenant_id, usage_date)
);

-- ============================================
-- AUDIT LOGS TABLE
-- HIPAA CRITICAL: Comprehensive audit trail
-- Must be tamper-proof and retained for 7+ years
-- ============================================

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Action Details
    action_type VARCHAR(100) NOT NULL,
    action_category VARCHAR(50) CHECK (action_category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'data_deletion', 'export', 'configuration', 'security')) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,

    -- PHI/PII Access Tracking
    phi_accessed BOOLEAN DEFAULT false,
    pii_accessed BOOLEAN DEFAULT false,
    data_classification VARCHAR(50) CHECK (data_classification IN ('public', 'internal', 'confidential', 'phi', 'pii')),

    -- Change Tracking (ENCRYPTED for sensitive data)
    old_values_encrypted BYTEA,
    new_values_encrypted BYTEA,
    old_values_hash VARCHAR(64), -- For integrity verification
    new_values_hash VARCHAR(64),

    -- User/System Info (ENCRYPTED)
    performed_by VARCHAR(255),
    performed_by_role VARCHAR(50),
    ip_address_encrypted BYTEA NOT NULL,
    user_agent_encrypted BYTEA,
    geolocation JSONB,

    -- Request Context
    request_id UUID, -- Correlate multiple actions
    session_id UUID,
    api_endpoint VARCHAR(255),
    http_method VARCHAR(10),

    -- Success/Failure
    status VARCHAR(20) CHECK (status IN ('success', 'failure', 'partial')) DEFAULT 'success',
    error_message TEXT,

    -- Compliance
    retention_until DATE NOT NULL, -- HIPAA: 7 years minimum
    is_readonly BOOLEAN DEFAULT true, -- Prevent modifications

    -- Timestamp (IMMUTABLE)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- DATA ACCESS LOG TABLE
-- HIPAA: Track every PHI/PII access
-- ============================================

CREATE TABLE data_access_logs (
    access_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Access Details
    access_type VARCHAR(50) CHECK (access_type IN ('read', 'write', 'update', 'delete', 'export', 'print')) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,

    -- PHI/PII Classification
    contains_phi BOOLEAN DEFAULT false,
    contains_pii BOOLEAN DEFAULT false,
    data_classification VARCHAR(50),

    -- Access Context
    access_reason TEXT, -- Required for HIPAA
    ip_address_encrypted BYTEA,
    user_agent_encrypted BYTEA,

    -- Timestamps
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    retention_until DATE NOT NULL
);

-- ============================================
-- BREACH NOTIFICATION LOG
-- HIPAA: Track potential security incidents
-- ============================================

CREATE TABLE breach_notifications (
    breach_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Incident Details
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    description TEXT NOT NULL,

    -- Affected Data
    affected_records_count INTEGER,
    phi_compromised BOOLEAN DEFAULT false,
    pii_compromised BOOLEAN DEFAULT false,

    -- Timeline
    discovered_at TIMESTAMP NOT NULL,
    occurred_at TIMESTAMP,
    contained_at TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Notification Requirements
    requires_notification BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,

    -- Status
    status VARCHAR(50) CHECK (status IN ('investigating', 'contained', 'resolved', 'closed')) DEFAULT 'investigating',

    -- Assigned To
    assigned_to UUID REFERENCES users(user_id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- 1. WE have to pull from EHR integration pull patient data (will be getting patient PII data, diagnostic report from hospital like slab report, test notes, etc. existing insurance details, bills )
-- 1.1: After pull patient data supervisor assign the patient data to medical coder1, coder2,.... codern
-- 1.2 Medical code parsing the data using AI tool
-- 1.3 If needed coder add/update manual coding from UI
-- 1.4 Coder review it and save it ( before save coder can do edit/update/delete manually )
-- 1.5 Before 10 PM ( as per tenant timestamp ) they can save

-- =========================================

-- ============================================
-- Medical code parse result store
-- ============================================

CREATE TABLE medical_code_parse_result(
    medical_code_parse_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parse_result JSONB DEFAULT '{}', -- sample data {"patient_id":"123", "medical_codes":[{"code":"123","desc":"text1"},{"code":"456","desc":"text2"}]}
    is_draft boolean default true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Medical Record Number (Unique per tenant)
    mrn VARCHAR(50) NOT NULL, -- Medical Record Number
    mrn_hash VARCHAR(1200) NOT NULL, -- For lookups

    -- Personal Information (ALL ENCRYPTED - PHI)
    first_name_encrypted BYTEA NOT NULL,
    last_name_encrypted BYTEA NOT NULL,
    middle_name_encrypted BYTEA,
    date_of_birth_encrypted BYTEA NOT NULL, -- PHI
    gender_encrypted BYTEA,
    ssn_encrypted BYTEA, -- Social Security Number - PHI

    -- Contact Information (ENCRYPTED - PII)
    email_encrypted BYTEA,
    email_hash VARCHAR(1200), -- For lookups
    phone_primary_encrypted BYTEA,
    phone_secondary_encrypted BYTEA,

    -- Address (ENCRYPTED - PII)
    address_line1_encrypted BYTEA,
    address_line2_encrypted BYTEA,
    city_encrypted BYTEA,
    state_encrypted BYTEA,
    zip_code_encrypted BYTEA,
    country VARCHAR(50) DEFAULT 'US',

    -- Emergency Contact (ENCRYPTED - PII)
    emergency_contact_name_encrypted BYTEA,
    emergency_contact_phone_encrypted BYTEA,
    emergency_contact_relationship_encrypted BYTEA,

    -- Demographics
    race_encrypted BYTEA,
    ethnicity_encrypted BYTEA,
    preferred_language VARCHAR(10) DEFAULT 'en',
    marital_status_encrypted BYTEA,

    -- Insurance Information (ENCRYPTED - PHI)
    insurance_provider_encrypted BYTEA,
    insurance_policy_number_encrypted BYTEA,
    insurance_group_number_encrypted BYTEA,

    -- Medical Information
    blood_type_encrypted BYTEA,
    allergies_encrypted BYTEA, -- JSON array of allergies
    chronic_conditions_encrypted BYTEA, -- JSON array

    -- Patient Portal Access
    portal_access_enabled BOOLEAN DEFAULT false,
    portal_user_id UUID REFERENCES users(user_id),

    -- Status
    is_active BOOLEAN DEFAULT true,
    deceased BOOLEAN DEFAULT false,
    deceased_date_encrypted BYTEA,

    -- Consent & Privacy
    hipaa_consent_signed BOOLEAN DEFAULT false,
    hipaa_consent_date DATE,
    data_sharing_consent BOOLEAN DEFAULT false,

    -- Audit Trail
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete

    -- Unique constraints
    UNIQUE(tenant_id, mrn),
    UNIQUE(tenant_id, mrn_hash)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Enrollment Tiers
CREATE INDEX idx_enrollment_tiers_name ON enrollment_tiers(tier_name);
CREATE INDEX idx_enrollment_tiers_active ON enrollment_tiers(is_active);

-- Tenants
CREATE INDEX idx_tenants_tier ON tenants(enrollment_tier);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_email_hash ON tenants(contact_email_hash);
CREATE INDEX idx_tenants_baa ON tenants(baa_signed, hipaa_compliant);
CREATE INDEX idx_tenants_trial ON tenants(is_trial, trial_ends_at);

-- Subscriptions
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, end_date);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_hash ON users(tenant_id, email_hash);
CREATE INDEX idx_users_username ON users(tenant_id, username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_mfa ON users(mfa_enabled);
CREATE INDEX idx_users_password_expiry ON users(password_expires_at);

-- User Sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_tenant ON user_sessions(tenant_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_sessions_suspicious ON user_sessions(suspicious_activity) WHERE suspicious_activity = true;

-- Tenant Usage
CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_date ON tenant_usage(usage_date);

-- Audit Logs (CRITICAL for HIPAA)
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_category ON audit_logs(action_category);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_phi ON audit_logs(phi_accessed) WHERE phi_accessed = true;
CREATE INDEX idx_audit_logs_pii ON audit_logs(pii_accessed) WHERE pii_accessed = true;
CREATE INDEX idx_audit_logs_retention ON audit_logs(retention_until);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Data Access Logs
CREATE INDEX idx_data_access_tenant ON data_access_logs(tenant_id);
CREATE INDEX idx_data_access_user ON data_access_logs(user_id);
CREATE INDEX idx_data_access_type ON data_access_logs(access_type);
CREATE INDEX idx_data_access_phi ON data_access_logs(contains_phi) WHERE contains_phi = true;
CREATE INDEX idx_data_access_time ON data_access_logs(accessed_at);

-- Breach Notifications
CREATE INDEX idx_breach_tenant ON breach_notifications(tenant_id);
CREATE INDEX idx_breach_severity ON breach_notifications(severity);
CREATE INDEX idx_breach_status ON breach_notifications(status);
CREATE INDEX idx_breach_discovered ON breach_notifications(discovered_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_tiers_updated_at
BEFORE UPDATE ON enrollment_tiers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breach_notifications_updated_at
BEFORE UPDATE ON breach_notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Prevent Audit Log Modifications
-- HIPAA: Audit logs must be immutable
-- ============================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs cannot be modified or deleted (HIPAA Compliance)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_modification
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_data_access_modification
BEFORE UPDATE OR DELETE ON data_access_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================
-- TRIGGER: Auto-set retention dates
-- HIPAA: 7 years minimum retention
-- ============================================

CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.retention_until IS NULL THEN
        NEW.retention_until := CURRENT_DATE + INTERVAL '7 years';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_audit_log_retention
BEFORE INSERT ON audit_logs
FOR EACH ROW EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_data_access_retention
BEFORE INSERT ON data_access_logs
FOR EACH ROW EXECUTE FUNCTION set_retention_date();

-- ============================================
-- TRIGGER: Check User Limit (HIPAA Enhanced)
-- ============================================

CREATE OR REPLACE FUNCTION check_user_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_current_users INTEGER;
    v_max_users INTEGER;
BEGIN
    -- Count current active users for tenant
    SELECT COUNT(*) INTO v_current_users
    FROM users
    WHERE tenant_id = NEW.tenant_id AND is_active = true AND deleted_at IS NULL;

    -- Get max users allowed
    SELECT max_users INTO v_max_users
    FROM tenants
    WHERE tenant_id = NEW.tenant_id;

    -- Check if limit exceeded
    IF v_current_users >= v_max_users THEN
        RAISE EXCEPTION 'User limit exceeded for tenant. Max allowed: %', v_max_users;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_user_limit_trigger
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION check_user_limit();

-- ============================================
-- TRIGGER: Log all user changes
-- HIPAA: Comprehensive audit trail
-- ============================================

CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'USER_CREATE';
        INSERT INTO audit_logs (
            tenant_id, user_id, action_type, action_category, entity_type, entity_id,
            new_values_hash, performed_by, ip_address_encrypted, phi_accessed, retention_until
        )
        VALUES (
            NEW.tenant_id, NEW.user_id, v_action, 'data_modification', 'user', NEW.user_id,
            md5(NEW.user_id::TEXT), CURRENT_USER, encrypt_data(inet_client_addr()::TEXT, 'encryption_key'),
            false, CURRENT_DATE + INTERVAL '7 years'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'USER_UPDATE';
        INSERT INTO audit_logs (
            tenant_id, user_id, action_type, action_category, entity_type, entity_id,
            old_values_hash, new_values_hash, performed_by, ip_address_encrypted, pii_accessed, retention_until
        )
        VALUES (
            NEW.tenant_id, NEW.user_id, v_action, 'data_modification', 'user', NEW.user_id,
            md5(OLD.user_id::TEXT), md5(NEW.user_id::TEXT), CURRENT_USER,
            encrypt_data(inet_client_addr()::TEXT, 'encryption_key'),
            true, CURRENT_DATE + INTERVAL '7 years'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'USER_DELETE';
        INSERT INTO audit_logs (
            tenant_id, user_id, action_type, action_category, entity_type, entity_id,
            old_values_hash, performed_by, ip_address_encrypted, pii_accessed, retention_until
        )
        VALUES (
            OLD.tenant_id, OLD.user_id, v_action, 'data_deletion', 'user', OLD.user_id,
            md5(OLD.user_id::TEXT), CURRENT_USER, encrypt_data(inet_client_addr()::TEXT, 'encryption_key'),
            true, CURRENT_DATE + INTERVAL '7 years'
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_user_changes();

-- ============================================
-- TRIGGER: Update Last Activity
-- ============================================

CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = CURRENT_TIMESTAMP;

    -- Update user's last activity
    UPDATE users
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_activity_trigger
BEFORE UPDATE ON user_sessions
FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- ============================================
-- INSERT ENROLLMENT TIERS DATA
-- ============================================

INSERT INTO enrollment_tiers (
    tier_name, tier_description, monthly_price, yearly_price,
    max_users, max_storage_gb, max_api_calls_per_day,
    features, hipaa_compliant, data_retention_days
) VALUES
(
    'bronze', 'HIPAA Compliant - Small Practices',
    49.99, 499.99, 5, 25, 5000,
    '{
        "encryption": "AES-256",
        "audit_logs": true,
        "data_retention_years": 7,
        "baa_included": true,
        "mfa_required": true
    }'::jsonb,
    true, 2555
),
(
    'silver', 'HIPAA Compliant - Medium Practices',
    149.99, 1499.99, 25, 100, 25000,
    '{
        "encryption": "AES-256",
        "audit_logs": true,
        "data_retention_years": 7,
        "baa_included": true,
        "mfa_required": true,
        "advanced_reporting": true,
        "breach_notification": true
    }'::jsonb,
    true, 2555
),
(
    'gold', 'HIPAA Compliant - Enterprise',
    399.99, 3999.99, 100, 500, 100000,
    '{
        "encryption": "AES-256",
        "audit_logs": true,
        "data_retention_years": 10,
        "baa_included": true,
        "mfa_required": true,
        "advanced_reporting": true,
        "breach_notification": true,
        "dedicated_security_officer": true,
        "custom_compliance_policies": true,
        "priority_incident_response": true
    }'::jsonb,
    true, 3650
);

-- ============================================
-- HIPAA HELPER FUNCTIONS
-- ============================================

-- Function: Create HIPAA Compliant User
CREATE OR REPLACE FUNCTION create_hipaa_user(
    p_tenant_id UUID,
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_role VARCHAR DEFAULT 'user',
    p_encryption_key TEXT DEFAULT 'your_encryption_key_here'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_password_hash VARCHAR;
    v_email_hash VARCHAR;
BEGIN
    -- Hash password with bcrypt
    v_password_hash := crypt(p_password, gen_salt('bf', 12));

    -- Hash email for lookups
    v_email_hash := encode(digest(p_email, 'sha256'), 'hex');

    -- Insert user with encrypted PII
    INSERT INTO users (
        tenant_id, username, email_encrypted, email_hash, password_hash,
        first_name_encrypted, last_name_encrypted, role,
        mfa_enabled, password_changed_at, password_expires_at
    )
    VALUES (
        p_tenant_id, p_username,
        encrypt_data(p_email, p_encryption_key), v_email_hash, v_password_hash,
        encrypt_data(p_first_name, p_encryption_key),
        encrypt_data(p_last_name, p_encryption_key),
        p_role, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'
    )
    RETURNING user_id INTO v_user_id;

    -- Log the creation
    INSERT INTO audit_logs (
        tenant_id, user_id, action_type, action_category,
        entity_type, entity_id, pii_accessed, performed_by, retention_until
    )
    VALUES (
        p_tenant_id, v_user_id, 'USER_CREATE', 'data_modification',
        'user', v_user_id, true, CURRENT_USER, CURRENT_DATE + INTERVAL '7 years'
    );

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Authenticate HIPAA User
CREATE OR REPLACE FUNCTION authenticate_hipaa_user(
    p_tenant_id UUID,
    p_username VARCHAR,
    p_password VARCHAR,
    p_ip_address TEXT,
    p_encryption_key TEXT DEFAULT 'your_encryption_key_here'
)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR,
    role VARCHAR,
    mfa_required BOOLEAN,
    is_authenticated BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_record RECORD;
    v_login_success BOOLEAN := false;
BEGIN
    -- Get user details
    SELECT
        u.user_id, u.username, u.password_hash, u.failed_login_attempts,
        u.locked_until, u.is_active, u.role, u.mfa_enabled,
        u.password_expires_at, u.deleted_at
    INTO v_user_record
    FROM users u
    WHERE u.tenant_id = p_tenant_id
    AND u.username = p_username;

    -- Check if user exists
    IF v_user_record.user_id IS NULL THEN
        -- Log failed attempt
        INSERT INTO audit_logs (
            tenant_id, action_type, action_category, status,
            performed_by, ip_address_encrypted, retention_until
        )
        VALUES (
            p_tenant_id, 'AUTH_FAILURE', 'authentication', 'failure',
            CURRENT_USER, encrypt_data(p_ip_address, p_encryption_key), CURRENT_DATE + INTERVAL '7 years'
        );

        RETURN QUERY SELECT NULL::UUID AS user_id, NULL::VARCHAR AS username, NULL::VARCHAR AS role, false::BOOLEAN AS mfa_required, false::BOOLEAN AS is_authenticated, 'User not found'::TEXT AS message;
    END IF;

    -- Verify password
    IF crypt(p_password, v_user_record.password_hash) = v_user_record.password_hash THEN
        v_login_success := true;
    ELSE
        v_login_success := false;
    END IF;

    IF v_login_success = false THEN
        -- log failed attempt and return
        INSERT INTO audit_logs (
            tenant_id, user_id, action_type, action_category, status,
            performed_by, ip_address_encrypted, retention_until
        )
        VALUES (
            p_tenant_id, v_user_record.user_id, 'AUTH_FAILURE', 'authentication', 'failure',
            CURRENT_USER, encrypt_data(p_ip_address, p_encryption_key), CURRENT_DATE + INTERVAL '7 years'
        );

        RETURN QUERY SELECT v_user_record.user_id, v_user_record.username, v_user_record.role, v_user_record.mfa_enabled, false::BOOLEAN, 'Invalid credentials'::TEXT;
    END IF;

    -- Success path: log and return user info
    INSERT INTO audit_logs (
        tenant_id, user_id, action_type, action_category, status,
        performed_by, ip_address_encrypted, retention_until
    )
    VALUES (
        p_tenant_id, v_user_record.user_id, 'AUTH_SUCCESS', 'authentication', 'success',
        CURRENT_USER, encrypt_data(p_ip_address, p_encryption_key), CURRENT_DATE + INTERVAL '7 years'
    );

    RETURN QUERY SELECT v_user_record.user_id, v_user_record.username, v_user_record.role, v_user_record.mfa_enabled, true::BOOLEAN, 'Authenticated'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Update session activity (already defined above)
-- ============================================

-- ============================================
-- INSERT ENDS - remaining objects (indexes/triggers) follow
-- ============================================

-- Migration 010: Create Settings and Backup Tables
-- Purpose: Add database persistence for AI settings, security settings, and backup records
-- Author: Panaceon Development Team
-- Date: 2026-01-13

-- =======================
-- TABLE: tenant_ai_settings
-- =======================
CREATE TABLE IF NOT EXISTS tenant_ai_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Model Configuration
    model_provider VARCHAR(50) DEFAULT 'ollama',
    model_name VARCHAR(100) DEFAULT 'mistral',
    model_version VARCHAR(50),

    -- Thresholds
    confidence_threshold INTEGER DEFAULT 75 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
    min_suggestions INTEGER DEFAULT 3,
    max_suggestions INTEGER DEFAULT 10,

    -- Feature Flags
    code_suggestions_enabled BOOLEAN DEFAULT TRUE,
    error_detection_enabled BOOLEAN DEFAULT TRUE,
    compliance_monitoring_enabled BOOLEAN DEFAULT TRUE,
    natural_language_search_enabled BOOLEAN DEFAULT TRUE,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    continuous_learning_enabled BOOLEAN DEFAULT FALSE,
    auto_coding_enabled BOOLEAN DEFAULT FALSE,

    -- Training
    last_training_date TIMESTAMP WITH TIME ZONE,
    training_status VARCHAR(50) DEFAULT 'idle',
    training_error_message TEXT,
    custom_training_data_path VARCHAR(500),

    -- Usage Limits
    daily_suggestion_limit INTEGER DEFAULT 1000,
    current_daily_usage INTEGER DEFAULT 0,
    usage_reset_time TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id)
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_ai_settings_tenant ON tenant_ai_settings(tenant_id);

-- =======================
-- TABLE: tenant_security_settings
-- =======================
CREATE TABLE IF NOT EXISTS tenant_security_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Authentication
    two_factor_required BOOLEAN DEFAULT FALSE,
    two_factor_method VARCHAR(20) DEFAULT 'totp',

    -- SSO
    sso_enabled BOOLEAN DEFAULT FALSE,
    sso_provider VARCHAR(50),
    sso_config JSONB,

    -- Password Policy
    password_policy VARCHAR(50) DEFAULT 'strong',
    password_min_length INTEGER DEFAULT 12,
    password_require_special BOOLEAN DEFAULT TRUE,
    password_require_numbers BOOLEAN DEFAULT TRUE,
    password_require_uppercase BOOLEAN DEFAULT TRUE,
    password_require_lowercase BOOLEAN DEFAULT TRUE,
    password_expiry_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 5,

    -- Session
    session_timeout_minutes INTEGER DEFAULT 30,
    max_concurrent_sessions INTEGER DEFAULT 5,
    session_absolute_timeout_hours INTEGER DEFAULT 24,

    -- Access Control
    ip_restriction_enabled BOOLEAN DEFAULT FALSE,
    allowed_ip_ranges TEXT[],

    -- Data Protection
    data_encryption_enabled BOOLEAN DEFAULT TRUE,
    anonymize_reports BOOLEAN DEFAULT TRUE,
    mask_ssn BOOLEAN DEFAULT TRUE,

    -- Audit & Logging
    audit_logging_enabled BOOLEAN DEFAULT TRUE,
    audit_retention_days INTEGER DEFAULT 2555,
    failed_login_lockout_threshold INTEGER DEFAULT 5,
    failed_login_lockout_duration_minutes INTEGER DEFAULT 30,

    -- Compliance Frameworks
    hipaa_enabled BOOLEAN DEFAULT TRUE,
    hitech_enabled BOOLEAN DEFAULT TRUE,
    gdpr_enabled BOOLEAN DEFAULT FALSE,
    state_privacy_laws TEXT[],

    -- Security Scans
    last_security_scan TIMESTAMP WITH TIME ZONE,
    last_vulnerability_report JSONB,
    compliance_status VARCHAR(50) DEFAULT 'compliant',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id)
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_security_settings_tenant ON tenant_security_settings(tenant_id);

-- =======================
-- TABLE: backup_records
-- =======================
CREATE TABLE IF NOT EXISTS backup_records (
    backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Backup Info
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) DEFAULT 'full',
    backup_scope VARCHAR(50) DEFAULT 'all',

    -- Storage
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_location VARCHAR(500),
    storage_bucket VARCHAR(255),
    storage_path VARCHAR(500),

    -- Size & Duration
    size_bytes BIGINT,
    duration_seconds INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Error
    error_message TEXT,
    error_details JSONB,

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_checksum VARCHAR(64),

    -- Retention
    retention_days INTEGER DEFAULT 30,
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB,
    tables_included TEXT[],
    record_counts JSONB,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id)
);

-- Indexes for backup_records
CREATE INDEX IF NOT EXISTS idx_backups_tenant ON backup_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backup_records(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_backups_expires ON backup_records(expires_at) WHERE NOT deleted;

-- =======================
-- SEED DEFAULT SETTINGS
-- =======================
-- Insert default settings for existing tenants

-- AI Settings
INSERT INTO tenant_ai_settings (tenant_id)
SELECT tenant_id FROM tenants
WHERE tenant_id NOT IN (SELECT tenant_id FROM tenant_ai_settings)
ON CONFLICT (tenant_id) DO NOTHING;

-- Security Settings
INSERT INTO tenant_security_settings (tenant_id)
SELECT tenant_id FROM tenants
WHERE tenant_id NOT IN (SELECT tenant_id FROM tenant_security_settings)
ON CONFLICT (tenant_id) DO NOTHING;

-- =======================
-- COMMENTS
-- =======================
COMMENT ON TABLE tenant_ai_settings IS 'AI model configuration and feature flags per tenant';
COMMENT ON TABLE tenant_security_settings IS 'Security policies and compliance settings per tenant';
COMMENT ON TABLE backup_records IS 'Backup history and metadata per tenant';

COMMENT ON COLUMN tenant_ai_settings.confidence_threshold IS 'Minimum confidence score (0-100) for AI code suggestions';
COMMENT ON COLUMN tenant_security_settings.two_factor_required IS 'Whether 2FA is mandatory for all users';
COMMENT ON COLUMN backup_records.status IS 'pending, in_progress, completed, or failed';

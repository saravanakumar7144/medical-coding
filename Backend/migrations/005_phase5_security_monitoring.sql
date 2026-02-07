-- Phase 5: Security Monitoring & Analytics
-- Migration 005: Security Events and Login Attempts Tracking

-- ==============================================
-- 1. Security Events Table
-- ==============================================
CREATE TABLE IF NOT EXISTS security_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,  -- NULL if user not found/deleted

    -- Event details
    event_type VARCHAR(50) NOT NULL,  -- failed_login, suspicious_activity, password_change, mfa_change, etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'low',  -- low, medium, high, critical

    -- Request details
    ip_address TEXT NOT NULL,  -- Encrypted
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),

    -- Location (derived from IP)
    country VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- Event details (JSON for flexibility)
    details JSONB,

    -- Resolution tracking
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT chk_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_security_events_tenant_created ON security_events(tenant_id, created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, resolved, created_at DESC);
CREATE INDEX idx_security_events_unresolved ON security_events(tenant_id, resolved, severity) WHERE resolved = FALSE;


-- ==============================================
-- 2. Login Attempts Table
-- ==============================================
CREATE TABLE IF NOT EXISTS login_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE SET NULL,  -- NULL if tenant not found
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,  -- NULL for failed attempts with invalid username

    -- Attempt details
    username VARCHAR(255) NOT NULL,  -- What username was used in attempt
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(200),  -- invalid_credentials, account_locked, account_inactive, etc.

    -- Request details
    ip_address TEXT NOT NULL,  -- Encrypted
    user_agent TEXT,

    -- Location (derived from IP)
    country VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- MFA details (if applicable)
    mfa_required BOOLEAN DEFAULT FALSE,
    mfa_success BOOLEAN,
    mfa_method VARCHAR(50),  -- totp, sms, email

    -- Timestamp
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_user ON login_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_login_attempts_username ON login_attempts(username, attempted_at DESC);
CREATE INDEX idx_login_attempts_tenant ON login_attempts(tenant_id, attempted_at DESC);
CREATE INDEX idx_login_attempts_success ON login_attempts(success, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(tenant_id, success, attempted_at DESC) WHERE success = FALSE;


-- ==============================================
-- 3. Failed Login Tracking View
-- ==============================================
CREATE OR REPLACE VIEW failed_login_summary AS
SELECT
    user_id,
    username,
    COUNT(*) as failed_attempts,
    MAX(attempted_at) as last_failed_attempt,
    ARRAY_AGG(DISTINCT ip_address ORDER BY ip_address) as ip_addresses,
    ARRAY_AGG(DISTINCT country ORDER BY country) as countries
FROM login_attempts
WHERE success = FALSE
    AND attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, username
HAVING COUNT(*) >= 3  -- Show users with 3+ failed attempts
ORDER BY COUNT(*) DESC, MAX(attempted_at) DESC;


-- ==============================================
-- 4. Security Metrics View
-- ==============================================
CREATE OR REPLACE VIEW security_metrics_daily AS
SELECT
    DATE(created_at) as date,
    tenant_id,
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_count,
    COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved_count
FROM security_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), tenant_id, event_type, severity
ORDER BY DATE(created_at) DESC, event_count DESC;


-- ==============================================
-- 5. Suspicious Activity Detection Function
-- ==============================================
CREATE OR REPLACE FUNCTION detect_suspicious_login(
    p_user_id UUID,
    p_ip_address TEXT,
    p_country VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    v_recent_countries TEXT[];
    v_rapid_logins INTEGER;
BEGIN
    -- Check 1: Multiple countries in short time (impossible travel)
    SELECT ARRAY_AGG(DISTINCT country)
    INTO v_recent_countries
    FROM login_attempts
    WHERE user_id = p_user_id
        AND attempted_at > NOW() - INTERVAL '1 hour'
        AND success = TRUE
        AND country IS NOT NULL;

    IF ARRAY_LENGTH(v_recent_countries, 1) >= 2 AND NOT (p_country = ANY(v_recent_countries)) THEN
        RETURN TRUE;  -- Login from new country within 1 hour
    END IF;

    -- Check 2: Rapid login attempts (potential brute force)
    SELECT COUNT(*)
    INTO v_rapid_logins
    FROM login_attempts
    WHERE user_id = p_user_id
        AND attempted_at > NOW() - INTERVAL '5 minutes';

    IF v_rapid_logins >= 10 THEN
        RETURN TRUE;  -- 10+ login attempts in 5 minutes
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;


-- ==============================================
-- 6. Trigger to Auto-Create Security Events
-- ==============================================
CREATE OR REPLACE FUNCTION log_failed_login_event()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type VARCHAR(50);
    v_severity VARCHAR(20);
    v_details JSONB;
BEGIN
    -- Only process failed logins
    IF NEW.success = FALSE THEN
        -- Determine event type and severity
        IF NEW.failure_reason = 'account_locked' THEN
            v_event_type := 'failed_login_locked_account';
            v_severity := 'high';
        ELSIF NEW.failure_reason = 'invalid_credentials' THEN
            v_event_type := 'failed_login_invalid_credentials';
            v_severity := 'medium';
        ELSE
            v_event_type := 'failed_login';
            v_severity := 'low';
        END IF;

        -- Build details JSON
        v_details := jsonb_build_object(
            'username', NEW.username,
            'failure_reason', NEW.failure_reason,
            'mfa_required', NEW.mfa_required
        );

        -- Create security event
        INSERT INTO security_events (
            tenant_id,
            user_id,
            event_type,
            severity,
            ip_address,
            user_agent,
            country,
            city,
            latitude,
            longitude,
            details
        ) VALUES (
            NEW.tenant_id,
            NEW.user_id,
            v_event_type,
            v_severity,
            NEW.ip_address,
            NEW.user_agent,
            NEW.country,
            NEW.city,
            NEW.latitude,
            NEW.longitude,
            v_details
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_failed_login
    AFTER INSERT ON login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION log_failed_login_event();


-- ==============================================
-- 7. Data Retention Policy
-- ==============================================
COMMENT ON TABLE security_events IS 'Retain for 7 years per HIPAA requirements';
COMMENT ON TABLE login_attempts IS 'Retain for 7 years per HIPAA requirements';

-- Optional: Create partition by year for better performance with large datasets
-- (Implement when data volume increases)

-- =============================================================================
-- MIGRATION: 008_add_auth_indexes.sql
-- Purpose: Add indexes for authentication-related tables to improve query performance
-- Date: 2026-01-13
-- Author: Claude Opus 4.5
-- =============================================================================

-- ==============================================
-- USER SESSIONS INDEXES
-- ==============================================
-- Index for session lookup by user
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
    ON user_sessions(user_id);

-- Index for expired session cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
    ON user_sessions(expires_at);

-- Index for active session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active 
    ON user_sessions(is_active) WHERE is_active = true;

-- Composite index for session validation queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
    ON user_sessions(user_id, is_active, expires_at);

-- ==============================================
-- PASSWORD RESETS INDEXES
-- ==============================================
-- Index for password reset lookup by user
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id 
    ON password_resets(user_id);

-- Index for expired reset token cleanup
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at 
    ON password_resets(expires_at);

-- Index for token lookup (if token is stored)
CREATE INDEX IF NOT EXISTS idx_password_resets_token 
    ON password_resets(token) WHERE token IS NOT NULL;

-- Composite index for valid reset queries
CREATE INDEX IF NOT EXISTS idx_password_resets_valid 
    ON password_resets(user_id, expires_at, used);

-- ==============================================
-- AUDIT LOGS INDEXES
-- ==============================================
-- Index for tenant-based audit queries (with time ordering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
    ON audit_logs(tenant_id, created_at DESC);

-- Index for user-based audit queries (with time ordering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
    ON audit_logs(user_id, created_at DESC);

-- Index for action-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
    ON audit_logs(action);

-- Index for time-based cleanup queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
    ON audit_logs(created_at);

-- Composite index for filtered audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action 
    ON audit_logs(tenant_id, action, created_at DESC);

-- ==============================================
-- USERS TABLE INDEXES
-- ==============================================
-- Index for last login tracking
CREATE INDEX IF NOT EXISTS idx_users_last_login 
    ON users(last_login_at);

-- Index for locked account queries
CREATE INDEX IF NOT EXISTS idx_users_locked_until 
    ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Index for email verification queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
    ON users(email_verified);

-- Index for activation token lookup
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
    ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- ==============================================
-- TOKEN BLACKLIST INDEXES (if table exists)
-- ==============================================
-- Index for token blacklist lookup
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti 
    ON token_blacklist(jti);

-- Index for expired blacklist cleanup
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at 
    ON token_blacklist(expires_at);

-- ==============================================
-- REFRESH TOKENS INDEXES
-- ==============================================
-- Index for refresh token lookup by user
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
    ON refresh_tokens(user_id);

-- Index for expired refresh token cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at 
    ON refresh_tokens(expires_at);

-- Index for revoked token queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked 
    ON refresh_tokens(revoked) WHERE revoked = true;

-- ==============================================
-- VERIFICATION
-- ==============================================
-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('user_sessions', 'password_resets', 'audit_logs', 'users', 'token_blacklist', 'refresh_tokens')
ORDER BY tablename, indexname;

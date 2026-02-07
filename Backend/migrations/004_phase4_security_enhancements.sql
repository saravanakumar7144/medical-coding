-- ============================================================================
-- Phase 4: Security Enhancements Migration
-- ============================================================================
-- This migration adds:
-- 1. Password history tracking table
-- 2. Password expiry and change tracking fields
-- 3. Indexes for performance
-- ============================================================================

-- Create password_history table for tracking password reuse
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for password_history
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Add password change tracking field to users table (if not exists)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP;

-- Create index for password expiry checks
CREATE INDEX IF NOT EXISTS idx_users_password_expires ON users(password_expires_at);

-- Add comment for documentation
COMMENT ON TABLE password_history IS 'Phase 4: Tracks password history to prevent password reuse';
COMMENT ON COLUMN password_history.user_id IS 'References users table - cascade delete when user is removed';
COMMENT ON COLUMN password_history.password_hash IS 'Bcrypt hash of previous password for comparison';
COMMENT ON COLUMN password_history.created_at IS 'When this password was set';

COMMENT ON COLUMN users.password_changed_at IS 'Phase 4: Last time user changed their password';
COMMENT ON COLUMN users.password_expires_at IS 'Phase 4: When password expires (90 days after change)';

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_password_history_user_id;
-- DROP INDEX IF EXISTS idx_password_history_created_at;
-- DROP INDEX IF EXISTS idx_users_password_expires;
-- DROP TABLE IF EXISTS password_history;
-- ALTER TABLE users DROP COLUMN IF EXISTS password_changed_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS password_expires_at;
-- ============================================================================

-- ============================================================================
-- Data Migration (Optional)
-- ============================================================================
-- Set password_changed_at to current timestamp for existing users
-- This prevents immediate password expiry warnings
UPDATE users
SET password_changed_at = NOW(),
    password_expires_at = NOW() + INTERVAL '90 days'
WHERE password_changed_at IS NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify with:
--
-- -- Check password_history table exists
-- SELECT EXISTS (
--     SELECT FROM information_schema.tables
--     WHERE table_name = 'password_history'
-- );
--
-- -- Check new columns in users table
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('password_changed_at', 'password_expires_at');
--
-- -- Check indexes
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename IN ('password_history', 'users')
-- AND indexname LIKE '%password%';
-- ============================================================================

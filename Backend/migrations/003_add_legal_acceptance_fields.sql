-- Migration: Add legal acceptance fields to users table
-- Sprint 3: Terms & Conditions and Privacy Policy acceptance
-- Date: 2025-12-16

-- Add legal acceptance tracking fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(20);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON users(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_users_privacy_accepted ON users(privacy_policy_accepted);

-- Add comments for documentation
COMMENT ON COLUMN users.terms_accepted IS 'Whether user has accepted Terms & Conditions';
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user accepted Terms & Conditions';
COMMENT ON COLUMN users.terms_version IS 'Version of Terms & Conditions accepted (e.g., "1.0", "1.1")';
COMMENT ON COLUMN users.privacy_policy_accepted IS 'Whether user has accepted Privacy Policy';
COMMENT ON COLUMN users.privacy_policy_accepted_at IS 'Timestamp when user accepted Privacy Policy';
COMMENT ON COLUMN users.privacy_policy_version IS 'Version of Privacy Policy accepted (e.g., "1.0", "1.1")';

-- Note: Existing users will have these fields as FALSE/NULL
-- They will be prompted to accept on next login

-- Migration: Add email_verification_expires column to users table
-- Sprint 2: Add 48-hour expiry to activation tokens
-- Date: 2025-12-16

-- Add email_verification_expires column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Add comment
COMMENT ON COLUMN users.email_verification_expires IS 'Expiry timestamp for email verification token (48 hours from generation)';

-- Optional: Set expiry for existing unverified users to 48 hours from now
-- This gives existing pending users 48 hours to activate
UPDATE users
SET email_verification_expires = NOW() + INTERVAL '48 hours'
WHERE email_verified = FALSE
  AND email_verification_token_hash IS NOT NULL
  AND email_verification_expires IS NULL;

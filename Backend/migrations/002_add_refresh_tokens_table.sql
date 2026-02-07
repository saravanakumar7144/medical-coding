-- Migration: Add refresh_tokens table
-- Sprint 2: Implement refresh token endpoint
-- Date: 2025-12-16

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,

    -- Foreign key to users table
    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication with 7-day expiry';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token (bcrypt)';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Set to TRUE when token is revoked (logout)';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Timestamp when token was last used to refresh access token';

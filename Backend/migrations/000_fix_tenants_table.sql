-- ============================================================================
-- Phase 0: Fix Missing Tenants Table
-- ============================================================================
-- This migration creates the tenants table that should have been created
-- in an earlier phase but is missing from the database.
-- This is required before Phase 8 can run successfully.
-- ============================================================================

-- Create tenants table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    settings JSONB DEFAULT '{}'::jsonb,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Audit fields
    created_by UUID,
    updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(tenant_name);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant isolation table - all data is scoped to a tenant';
COMMENT ON COLUMN tenants.tenant_id IS 'Primary key - UUID for tenant identification';
COMMENT ON COLUMN tenants.tenant_name IS 'Unique tenant name/identifier';
COMMENT ON COLUMN tenants.is_active IS 'Soft delete flag - inactive tenants are blocked';

-- Create default tenant if none exists (for development/testing)
INSERT INTO tenants (tenant_name, contact_email, is_active)
VALUES ('Default Organization', 'admin@example.com', true)
ON CONFLICT (tenant_name) DO NOTHING;

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE '✓ Tenants table created/verified successfully';
END $$;

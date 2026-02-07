-- Migration 007: EHR Polling Schema
-- Adds FHIR integration columns and new tables for EHR/Clearinghouse polling
-- Date: 2025-01-01

-- ============================================================================
-- PART 1: ADD FHIR COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add FHIR columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS fhir_id VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS source_ehr VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS source_organization_id VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS fhir_raw JSONB;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_patients_fhir_id ON patients(fhir_id);
CREATE INDEX IF NOT EXISTS idx_patients_source_ehr ON patients(source_ehr);

-- Add FHIR columns to encounters table
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS fhir_id VARCHAR(100);
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS source_ehr VARCHAR(50);
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS source_organization_id VARCHAR(100);
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS fhir_raw JSONB;
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_encounters_fhir_id ON encounters(fhir_id);
CREATE INDEX IF NOT EXISTS idx_encounters_source_ehr ON encounters(source_ehr);

-- Add FHIR columns to encounter_diagnoses table
ALTER TABLE encounter_diagnoses ADD COLUMN IF NOT EXISTS fhir_id VARCHAR(100);
ALTER TABLE encounter_diagnoses ADD COLUMN IF NOT EXISTS source_ehr VARCHAR(50);
ALTER TABLE encounter_diagnoses ADD COLUMN IF NOT EXISTS fhir_raw JSONB;

CREATE INDEX IF NOT EXISTS idx_encounter_diagnoses_fhir_id ON encounter_diagnoses(fhir_id);

-- Add FHIR columns to encounter_procedures table
ALTER TABLE encounter_procedures ADD COLUMN IF NOT EXISTS fhir_id VARCHAR(100);
ALTER TABLE encounter_procedures ADD COLUMN IF NOT EXISTS source_ehr VARCHAR(50);
ALTER TABLE encounter_procedures ADD COLUMN IF NOT EXISTS fhir_raw JSONB;

CREATE INDEX IF NOT EXISTS idx_encounter_procedures_fhir_id ON encounter_procedures(fhir_id);

-- ============================================================================
-- PART 2: CREATE EHR CONNECTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ehr_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- EHR Configuration
    ehr_type VARCHAR(50) NOT NULL,  -- 'epic', 'athena', 'cerner', 'meditech'
    organization_name VARCHAR(255) NOT NULL,
    organization_id VARCHAR(100),

    -- Connection Settings
    base_url VARCHAR(500) NOT NULL,
    client_id TEXT,  -- Encrypted
    client_secret TEXT,  -- Encrypted
    private_key TEXT,  -- Encrypted - JWT signing key
    public_key_id VARCHAR(100),

    -- Polling Configuration
    poll_interval_seconds INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    use_mock_data BOOLEAN DEFAULT TRUE,

    -- Sync Status
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),
    last_sync_error TEXT,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ehr_connections_tenant_id ON ehr_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ehr_connections_ehr_type ON ehr_connections(ehr_type);
CREATE INDEX IF NOT EXISTS idx_ehr_connections_is_active ON ehr_connections(is_active);

-- ============================================================================
-- PART 3: CREATE SYNC STATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_state (
    sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES ehr_connections(connection_id) ON DELETE CASCADE,

    -- Resource Tracking
    resource_type VARCHAR(50) NOT NULL,  -- 'Patient', 'Encounter', 'Condition', 'Procedure'

    -- Sync Timestamps
    last_sync_time TIMESTAMP,
    next_sync_time TIMESTAMP,

    -- Sync Metrics
    last_sync_status VARCHAR(50) DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,

    -- Pagination State
    continuation_token VARCHAR(500),
    last_processed_id VARCHAR(100),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    -- Unique constraint per connection + resource type
    UNIQUE(connection_id, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_connection_id ON sync_state(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_resource_type ON sync_state(resource_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_last_sync_status ON sync_state(last_sync_status);

-- ============================================================================
-- PART 4: CREATE REFERENCE DATA TABLES
-- ============================================================================

-- ICD-10 Codes Table
CREATE TABLE IF NOT EXISTS icd10_codes (
    code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(500) NOT NULL,

    -- Code Details
    is_billable BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),
    chapter VARCHAR(5),
    block VARCHAR(20),

    -- Clinical Classification
    code_type VARCHAR(50),
    severity VARCHAR(20),
    laterality VARCHAR(20),

    -- Usage Statistics
    usage_frequency INTEGER DEFAULT 0,

    -- Metadata
    effective_date DATE,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_icd10_codes_is_billable ON icd10_codes(is_billable);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_category ON icd10_codes(category);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_is_active ON icd10_codes(is_active);

-- CPT/HCPCS Codes Table
CREATE TABLE IF NOT EXISTS cpt_codes (
    code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(500) NOT NULL,

    -- Code Details
    code_type VARCHAR(10) NOT NULL,  -- 'CPT', 'HCPCS'
    category VARCHAR(100),
    subcategory VARCHAR(100),

    -- RVU Values
    rvu_work NUMERIC(8, 4),
    rvu_facility NUMERIC(8, 4),
    rvu_non_facility NUMERIC(8, 4),
    rvu_malpractice NUMERIC(8, 4),
    rvu_total NUMERIC(8, 4),

    -- Pricing
    facility_fee NUMERIC(10, 2),
    non_facility_fee NUMERIC(10, 2),
    conversion_factor NUMERIC(8, 4),

    -- Modifiers
    global_period INTEGER,
    requires_modifier BOOLEAN DEFAULT FALSE,
    common_modifiers JSONB,

    -- Usage Statistics
    usage_frequency INTEGER DEFAULT 0,

    -- Metadata
    effective_date DATE,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cpt_codes_code_type ON cpt_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_cpt_codes_category ON cpt_codes(category);
CREATE INDEX IF NOT EXISTS idx_cpt_codes_is_active ON cpt_codes(is_active);

-- ============================================================================
-- PART 5: CREATE CLEARINGHOUSE CONNECTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clearinghouse_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Clearinghouse Configuration
    clearinghouse_type VARCHAR(50) NOT NULL,  -- 'stedi', 'availity', 'change_healthcare'
    clearinghouse_name VARCHAR(255) NOT NULL,

    -- Connection Settings
    api_base_url VARCHAR(500),
    api_key TEXT,  -- Encrypted
    api_secret TEXT,  -- Encrypted
    submitter_id VARCHAR(100),

    -- SFTP Settings
    sftp_host VARCHAR(255),
    sftp_port INTEGER DEFAULT 22,
    sftp_username VARCHAR(100),
    sftp_password TEXT,  -- Encrypted
    sftp_private_key TEXT,  -- Encrypted

    -- Polling Configuration
    poll_interval_seconds INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT TRUE,
    use_mock_data BOOLEAN DEFAULT TRUE,

    -- Status
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_connections_tenant_id ON clearinghouse_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_connections_type ON clearinghouse_connections(clearinghouse_type);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_connections_is_active ON clearinghouse_connections(is_active);

-- ============================================================================
-- PART 6: CREATE UNIQUE CONSTRAINT FOR FHIR UPSERT
-- ============================================================================

-- Create unique constraint for patient FHIR UPSERT
-- Only create if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_patients_fhir_source'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT uq_patients_fhir_source
            UNIQUE (fhir_id, source_ehr, source_organization_id);
    END IF;
END $$;

-- Create unique constraint for encounter FHIR UPSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_encounters_fhir_source'
    ) THEN
        ALTER TABLE encounters ADD CONSTRAINT uq_encounters_fhir_source
            UNIQUE (fhir_id, source_ehr, source_organization_id);
    END IF;
END $$;

-- Create unique constraint for diagnosis FHIR UPSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_diagnoses_fhir_source'
    ) THEN
        ALTER TABLE encounter_diagnoses ADD CONSTRAINT uq_diagnoses_fhir_source
            UNIQUE (fhir_id, source_ehr);
    END IF;
END $$;

-- Create unique constraint for procedure FHIR UPSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_procedures_fhir_source'
    ) THEN
        ALTER TABLE encounter_procedures ADD CONSTRAINT uq_procedures_fhir_source
            UNIQUE (fhir_id, source_ehr);
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 007_ehr_polling_schema completed successfully';
END $$;

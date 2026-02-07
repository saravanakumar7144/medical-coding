-- ============================================================================
-- PHASE 8: COMPREHENSIVE EHR INTEGRATION - MEDICAL CODING, BILLING & CLAIMS
-- ============================================================================
-- This migration creates the complete infrastructure for:
--   - Patient management with demographics
--   - Encounter tracking (visits, admissions)
--   - Diagnosis coding (ICD-10) with AI assistance
--   - Procedure coding (CPT/HCPCS) with AI assistance
--   - Insurance information and authorization
--   - Claims submission and tracking
--   - Denial management and appeals
--   - Clearinghouse integration (837/835 transactions)
-- ============================================================================

-- ============================================================================
-- PATIENTS TABLE - Core patient demographics and identification
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Patient Identifiers
    mrn VARCHAR(50) NOT NULL, -- Medical Record Number (unique per tenant)
    ssn TEXT, -- Encrypted Social Security Number
    external_patient_id VARCHAR(100), -- ID from external EHR system

    -- Demographics (PII - encrypted where indicated)
    first_name TEXT NOT NULL, -- Encrypted
    middle_name TEXT, -- Encrypted
    last_name TEXT NOT NULL, -- Encrypted
    date_of_birth DATE NOT NULL, -- Encrypted
    gender VARCHAR(20),

    -- Contact Information (Encrypted)
    email TEXT, -- Encrypted
    phone_primary TEXT, -- Encrypted
    phone_secondary TEXT, -- Encrypted

    -- Address (Encrypted)
    address_line1 TEXT, -- Encrypted
    address_line2 TEXT, -- Encrypted
    city TEXT, -- Encrypted
    state VARCHAR(2), -- Encrypted
    zip_code VARCHAR(10), -- Encrypted
    country VARCHAR(3) DEFAULT 'USA',

    -- Emergency Contact (Encrypted)
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship VARCHAR(50),

    -- Clinical Information
    primary_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    preferred_language VARCHAR(50),
    race VARCHAR(100),
    ethnicity VARCHAR(100),
    marital_status VARCHAR(20),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deceased BOOLEAN DEFAULT FALSE,
    deceased_date DATE,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    -- Indexes
    CONSTRAINT uk_patient_mrn_tenant UNIQUE (tenant_id, mrn),
    CONSTRAINT chk_patient_gender CHECK (gender IN ('M', 'F', 'O', 'U'))
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_provider ON patients(primary_provider_id);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);


-- ============================================================================
-- INSURANCE PAYERS TABLE - Insurance companies and payers
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_payers (
    payer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Payer Identification
    payer_name VARCHAR(255) NOT NULL,
    payer_code VARCHAR(50), -- NUCC Health Plan Identifier or Payer ID
    naic_code VARCHAR(20), -- National Association of Insurance Commissioners code
    clearinghouse_payer_id VARCHAR(100), -- ID used by clearinghouse

    -- Payer Details
    payer_type VARCHAR(50), -- Medicare, Medicaid, Commercial, etc.
    is_electronic_claims_enabled BOOLEAN DEFAULT TRUE,
    is_electronic_era_enabled BOOLEAN DEFAULT TRUE, -- Electronic Remittance Advice

    -- Contact Information
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),

    -- Configuration
    claim_submission_format VARCHAR(20) DEFAULT '837P', -- 837P (Professional), 837I (Institutional)
    era_format VARCHAR(20) DEFAULT '835',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT chk_payer_type CHECK (payer_type IN ('Medicare', 'Medicaid', 'Commercial', 'Self-Pay', 'Workers Comp', 'Other'))
);

CREATE INDEX IF NOT EXISTS idx_insurance_payers_code ON insurance_payers(payer_code);
CREATE INDEX IF NOT EXISTS idx_insurance_payers_active ON insurance_payers(is_active);


-- ============================================================================
-- PATIENT INSURANCE TABLE - Patient insurance coverage information
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_insurance (
    insurance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES insurance_payers(payer_id) ON DELETE RESTRICT,

    -- Insurance Details
    policy_number TEXT NOT NULL, -- Encrypted
    group_number TEXT, -- Encrypted
    plan_name VARCHAR(255),
    plan_type VARCHAR(50), -- HMO, PPO, EPO, POS, etc.

    -- Coverage Period
    coverage_start_date DATE NOT NULL,
    coverage_end_date DATE,

    -- Priority
    priority INTEGER NOT NULL DEFAULT 1, -- 1=Primary, 2=Secondary, 3=Tertiary

    -- Policyholder Information
    relationship_to_insured VARCHAR(50), -- Self, Spouse, Child, Other
    insured_first_name TEXT, -- Encrypted
    insured_last_name TEXT, -- Encrypted
    insured_dob DATE, -- Encrypted
    insured_ssn TEXT, -- Encrypted
    insured_gender VARCHAR(1),

    -- Authorization
    requires_authorization BOOLEAN DEFAULT FALSE,
    authorization_phone VARCHAR(20),

    -- Copay/Deductible
    copay_amount DECIMAL(10, 2),
    deductible_amount DECIMAL(10, 2),
    deductible_met DECIMAL(10, 2) DEFAULT 0.00,
    out_of_pocket_max DECIMAL(10, 2),
    out_of_pocket_met DECIMAL(10, 2) DEFAULT 0.00,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(50) DEFAULT 'Not Verified',
    verification_date TIMESTAMP,
    verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_insurance_priority CHECK (priority IN (1, 2, 3)),
    CONSTRAINT chk_relationship CHECK (relationship_to_insured IN ('Self', 'Spouse', 'Child', 'Parent', 'Other')),
    CONSTRAINT chk_plan_type CHECK (plan_type IN ('HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'POS', 'Other'))
);

CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_payer ON patient_insurance(payer_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_priority ON patient_insurance(priority);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_active ON patient_insurance(is_active);


-- ============================================================================
-- ENCOUNTERS TABLE - Patient visits and encounters
-- ============================================================================
CREATE TABLE IF NOT EXISTS encounters (
    encounter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,

    -- Encounter Identification
    encounter_number VARCHAR(50) NOT NULL, -- Unique encounter number
    external_encounter_id VARCHAR(100), -- ID from external EHR

    -- Encounter Details
    encounter_type VARCHAR(50) NOT NULL, -- Office Visit, Inpatient, Emergency, Telemedicine, etc.
    encounter_class VARCHAR(50), -- IMP (Inpatient), AMB (Ambulatory), EMER (Emergency), etc.
    service_date DATE NOT NULL,
    service_end_date DATE,

    -- Provider Information
    rendering_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    referring_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    supervising_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Location
    facility_id UUID, -- Link to facilities table if exists
    facility_name VARCHAR(255),
    place_of_service VARCHAR(2), -- CMS Place of Service codes

    -- Clinical Information
    chief_complaint TEXT,
    clinical_notes TEXT,
    discharge_disposition VARCHAR(50),
    admission_source VARCHAR(50),

    -- Insurance
    primary_insurance_id UUID REFERENCES patient_insurance(insurance_id) ON DELETE SET NULL,
    secondary_insurance_id UUID REFERENCES patient_insurance(insurance_id) ON DELETE SET NULL,

    -- Authorization
    authorization_number VARCHAR(50),
    authorization_required BOOLEAN DEFAULT FALSE,
    authorization_obtained BOOLEAN DEFAULT FALSE,

    -- Status
    encounter_status VARCHAR(50) DEFAULT 'In Progress',
    coding_status VARCHAR(50) DEFAULT 'Not Started',
    billing_status VARCHAR(50) DEFAULT 'Not Ready',

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,
    locked_for_coding BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    locked_at TIMESTAMP,

    CONSTRAINT uk_encounter_number_tenant UNIQUE (tenant_id, encounter_number),
    CONSTRAINT chk_encounter_type CHECK (encounter_type IN ('Office Visit', 'Inpatient', 'Emergency', 'Telemedicine', 'Observation', 'Outpatient Surgery', 'Other')),
    CONSTRAINT chk_encounter_status CHECK (encounter_status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show')),
    CONSTRAINT chk_coding_status CHECK (coding_status IN ('Not Started', 'In Progress', 'Completed', 'Reviewed', 'Finalized')),
    CONSTRAINT chk_billing_status CHECK (billing_status IN ('Not Ready', 'Ready', 'Submitted', 'Paid', 'Denied', 'Appealed'))
);

CREATE INDEX IF NOT EXISTS idx_encounters_tenant ON encounters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(service_date);
CREATE INDEX IF NOT EXISTS idx_encounters_provider ON encounters(rendering_provider_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(encounter_status);
CREATE INDEX IF NOT EXISTS idx_encounters_coding_status ON encounters(coding_status);
CREATE INDEX IF NOT EXISTS idx_encounters_billing_status ON encounters(billing_status);


-- ============================================================================
-- ENCOUNTER DIAGNOSES TABLE - ICD-10 diagnoses for encounters
-- ============================================================================
CREATE TABLE IF NOT EXISTS encounter_diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(encounter_id) ON DELETE CASCADE,

    -- Diagnosis Code
    icd10_code VARCHAR(10) NOT NULL, -- References icd10 table
    diagnosis_description VARCHAR(500),

    -- Diagnosis Details
    diagnosis_type VARCHAR(50), -- Primary, Secondary, Admitting, etc.
    present_on_admission VARCHAR(1), -- Y, N, U, W (for inpatient claims)
    diagnosis_order INTEGER NOT NULL DEFAULT 1,

    -- AI Assistance
    ai_suggested BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    ai_reasoning TEXT,

    -- Validation
    validated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    validated_at TIMESTAMP,
    validation_notes TEXT,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_diagnosis_type CHECK (diagnosis_type IN ('Primary', 'Secondary', 'Admitting', 'Complication', 'Comorbidity')),
    CONSTRAINT chk_poa CHECK (present_on_admission IN ('Y', 'N', 'U', 'W', NULL))
);

CREATE INDEX IF NOT EXISTS idx_encounter_diagnoses_encounter ON encounter_diagnoses(encounter_id);
CREATE INDEX IF NOT EXISTS idx_encounter_diagnoses_code ON encounter_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_encounter_diagnoses_ai ON encounter_diagnoses(ai_suggested);


-- ============================================================================
-- ENCOUNTER PROCEDURES TABLE - CPT/HCPCS procedures for encounters
-- ============================================================================
CREATE TABLE IF NOT EXISTS encounter_procedures (
    procedure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(encounter_id) ON DELETE CASCADE,

    -- Procedure Code
    procedure_code VARCHAR(10) NOT NULL, -- CPT or HCPCS code
    code_type VARCHAR(10) NOT NULL, -- 'CPT' or 'HCPCS'
    procedure_description VARCHAR(500),

    -- Procedure Details
    procedure_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    units DECIMAL(10, 2) DEFAULT 1.00,

    -- Modifiers
    modifier_1 VARCHAR(2),
    modifier_2 VARCHAR(2),
    modifier_3 VARCHAR(2),
    modifier_4 VARCHAR(2),

    -- Provider
    performing_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Pricing
    charge_amount DECIMAL(10, 2),
    allowed_amount DECIMAL(10, 2),

    -- AI Assistance
    ai_suggested BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5, 4),
    ai_reasoning TEXT,

    -- Validation
    validated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    validated_at TIMESTAMP,
    validation_notes TEXT,

    -- NCCI Edits (National Correct Coding Initiative)
    ncci_conflict BOOLEAN DEFAULT FALSE,
    ncci_override_reason TEXT,

    -- Authorization
    requires_authorization BOOLEAN DEFAULT FALSE,
    authorization_number VARCHAR(50),
    authorization_status VARCHAR(50),

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_code_type CHECK (code_type IN ('CPT', 'HCPCS')),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_encounter_procedures_encounter ON encounter_procedures(encounter_id);
CREATE INDEX IF NOT EXISTS idx_encounter_procedures_code ON encounter_procedures(procedure_code);
CREATE INDEX IF NOT EXISTS idx_encounter_procedures_date ON encounter_procedures(procedure_date);
CREATE INDEX IF NOT EXISTS idx_encounter_procedures_ai ON encounter_procedures(ai_suggested);


-- ============================================================================
-- CLAIMS TABLE - Insurance claims submission and tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Claim Identification
    claim_number VARCHAR(50) NOT NULL, -- Internal claim number
    external_claim_id VARCHAR(100), -- Clearinghouse/payer claim ID
    clearinghouse_trace_number VARCHAR(100),

    -- Linked Entities
    encounter_id UUID NOT NULL REFERENCES encounters(encounter_id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES insurance_payers(payer_id) ON DELETE RESTRICT,
    insurance_id UUID REFERENCES patient_insurance(insurance_id) ON DELETE RESTRICT,

    -- Claim Type
    claim_type VARCHAR(20) NOT NULL, -- Professional (837P), Institutional (837I)
    claim_frequency_code VARCHAR(1), -- 1=Original, 7=Replacement, 8=Void

    -- Service Information
    service_date_from DATE NOT NULL,
    service_date_to DATE,
    total_charge_amount DECIMAL(10, 2) NOT NULL,

    -- Billing Provider
    billing_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    billing_npi VARCHAR(10),
    billing_tax_id VARCHAR(20),

    -- Submission
    submission_date TIMESTAMP,
    submission_method VARCHAR(50), -- Electronic, Paper, Clearinghouse
    submitted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Status
    claim_status VARCHAR(50) DEFAULT 'Draft',
    adjudication_status VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending',

    -- Financial
    allowed_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),
    patient_responsibility DECIMAL(10, 2),
    adjustment_amount DECIMAL(10, 2),

    -- Payment
    payment_date DATE,
    check_number VARCHAR(50),
    check_date DATE,

    -- Clearinghouse
    clearinghouse_name VARCHAR(100),
    clearinghouse_status VARCHAR(50),
    clearinghouse_response TEXT,
    clearinghouse_error_code VARCHAR(20),

    -- Denial/Rejection
    is_denied BOOLEAN DEFAULT FALSE,
    denial_date DATE,
    denial_reason_code VARCHAR(20),
    denial_reason_text TEXT,

    -- Appeal
    is_appealed BOOLEAN DEFAULT FALSE,
    appeal_date DATE,
    appeal_level INTEGER,
    appeal_status VARCHAR(50),

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT uk_claim_number_tenant UNIQUE (tenant_id, claim_number),
    CONSTRAINT chk_claim_type CHECK (claim_type IN ('Professional', 'Institutional', 'Dental', 'Vision')),
    CONSTRAINT chk_claim_status CHECK (claim_status IN ('Draft', 'Ready', 'Submitted', 'Accepted', 'Rejected', 'Denied', 'Paid', 'Partial Payment', 'Appealed', 'Void')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('Pending', 'Partial', 'Paid', 'Denied', 'Adjusted')),
    CONSTRAINT chk_submission_method CHECK (submission_method IN ('Electronic', 'Paper', 'Clearinghouse', 'Direct'))
);

CREATE INDEX IF NOT EXISTS idx_claims_tenant ON claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_claims_encounter ON claims(encounter_id);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_payer ON claims(payer_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_payment_status ON claims(payment_status);
CREATE INDEX IF NOT EXISTS idx_claims_submission_date ON claims(submission_date);
CREATE INDEX IF NOT EXISTS idx_claims_service_date ON claims(service_date_from);
CREATE INDEX IF NOT EXISTS idx_claims_denied ON claims(is_denied);


-- ============================================================================
-- CLAIM LINE ITEMS TABLE - Individual services/procedures on a claim
-- ============================================================================
CREATE TABLE IF NOT EXISTS claim_line_items (
    line_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,

    -- Line Item Details
    line_number INTEGER NOT NULL,
    procedure_id UUID REFERENCES encounter_procedures(procedure_id) ON DELETE SET NULL,

    -- Service Information
    procedure_code VARCHAR(10) NOT NULL,
    code_type VARCHAR(10) NOT NULL,
    procedure_description VARCHAR(500),
    service_date DATE NOT NULL,

    -- Modifiers
    modifier_1 VARCHAR(2),
    modifier_2 VARCHAR(2),
    modifier_3 VARCHAR(2),
    modifier_4 VARCHAR(2),

    -- Diagnosis Pointers
    diagnosis_pointer_1 INTEGER,
    diagnosis_pointer_2 INTEGER,
    diagnosis_pointer_3 INTEGER,
    diagnosis_pointer_4 INTEGER,

    -- Quantity and Pricing
    quantity INTEGER DEFAULT 1,
    units DECIMAL(10, 2) DEFAULT 1.00,
    charge_amount DECIMAL(10, 2) NOT NULL,
    allowed_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),
    adjustment_amount DECIMAL(10, 2),

    -- Adjustment Codes
    adjustment_group_code VARCHAR(5),
    adjustment_reason_code VARCHAR(10),
    adjustment_reason_text TEXT,

    -- Status
    line_status VARCHAR(50) DEFAULT 'Submitted',
    is_denied BOOLEAN DEFAULT FALSE,
    denial_reason_code VARCHAR(20),
    denial_reason_text TEXT,

    -- Provider
    rendering_provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    rendering_npi VARCHAR(10),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT chk_line_status CHECK (line_status IN ('Submitted', 'Accepted', 'Denied', 'Paid', 'Partial Payment', 'Adjusted'))
);

CREATE INDEX IF NOT EXISTS idx_claim_line_items_claim ON claim_line_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_line_items_procedure ON claim_line_items(procedure_id);
CREATE INDEX IF NOT EXISTS idx_claim_line_items_denied ON claim_line_items(is_denied);


-- ============================================================================
-- CLAIM DENIALS TABLE - Detailed denial tracking and management
-- ============================================================================
CREATE TABLE IF NOT EXISTS claim_denials (
    denial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,

    -- Denial Information
    denial_date DATE NOT NULL,
    denial_type VARCHAR(50) NOT NULL, -- Technical, Clinical, Eligibility, Authorization, etc.
    denial_category VARCHAR(50), -- Preventable, Non-preventable, Pending Review

    -- Denial Codes
    denial_reason_code VARCHAR(20),
    denial_reason_text TEXT NOT NULL,
    remark_code VARCHAR(20),
    remark_text TEXT,

    -- Claim Adjustment Reason Codes (CARC)
    carc_code VARCHAR(10),
    carc_description TEXT,

    -- Remittance Advice Remark Codes (RARC)
    rarc_code VARCHAR(10),
    rarc_description TEXT,

    -- Financial Impact
    denied_amount DECIMAL(10, 2),

    -- Root Cause Analysis
    root_cause VARCHAR(100),
    preventable BOOLEAN,
    responsible_party VARCHAR(100), -- Billing, Clinical, Patient, Payer

    -- Resolution
    resolution_strategy VARCHAR(100), -- Appeal, Rebill, Write-off, Patient Responsibility
    resolution_status VARCHAR(50) DEFAULT 'Pending',
    resolution_date DATE,
    resolution_notes TEXT,

    -- Appeal Information
    appeal_deadline DATE,
    appeal_filed_date DATE,
    appeal_level INTEGER,
    appeal_outcome VARCHAR(50),
    appeal_recovered_amount DECIMAL(10, 2),

    -- Assignment
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,

    -- Priority
    priority VARCHAR(20) DEFAULT 'Medium',

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_denial_type CHECK (denial_type IN ('Technical', 'Clinical', 'Eligibility', 'Authorization', 'Coding', 'Medical Necessity', 'Timely Filing', 'Duplicate', 'Other')),
    CONSTRAINT chk_resolution_strategy CHECK (resolution_strategy IN ('Appeal', 'Rebill', 'Correct and Resubmit', 'Write-off', 'Patient Responsibility', 'Under Review')),
    CONSTRAINT chk_resolution_status CHECK (resolution_status IN ('Pending', 'In Progress', 'Appealed', 'Resolved', 'Closed', 'Write-off')),
    CONSTRAINT chk_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'))
);

CREATE INDEX IF NOT EXISTS idx_claim_denials_claim ON claim_denials(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_denials_date ON claim_denials(denial_date);
CREATE INDEX IF NOT EXISTS idx_claim_denials_status ON claim_denials(resolution_status);
CREATE INDEX IF NOT EXISTS idx_claim_denials_assigned ON claim_denials(assigned_to);
CREATE INDEX IF NOT EXISTS idx_claim_denials_priority ON claim_denials(priority);


-- ============================================================================
-- CLEARINGHOUSE TRANSACTIONS TABLE - Track all clearinghouse communications
-- ============================================================================
CREATE TABLE IF NOT EXISTS clearinghouse_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,

    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL, -- 837 (Claim), 835 (ERA), 277 (Status), 270/271 (Eligibility)
    transaction_direction VARCHAR(10) NOT NULL, -- Outbound, Inbound
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Clearinghouse
    clearinghouse_name VARCHAR(100),
    clearinghouse_id VARCHAR(100),
    trace_number VARCHAR(100),

    -- File Information
    file_name VARCHAR(255),
    file_format VARCHAR(20), -- X12, HL7, FHIR
    file_size INTEGER,
    file_content TEXT, -- Store actual transaction content

    -- Status
    transaction_status VARCHAR(50) DEFAULT 'Sent',
    error_code VARCHAR(50),
    error_message TEXT,

    -- Response
    response_received_at TIMESTAMP,
    response_status VARCHAR(50),
    response_content TEXT,

    -- Acknowledgment
    acknowledgment_code VARCHAR(50),
    acknowledgment_message TEXT,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('837P', '837I', '835', '277', '270', '271', 'Other')),
    CONSTRAINT chk_transaction_direction CHECK (transaction_direction IN ('Outbound', 'Inbound')),
    CONSTRAINT chk_transaction_status CHECK (transaction_status IN ('Sent', 'Received', 'Accepted', 'Rejected', 'Error', 'Processing'))
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_trans_claim ON clearinghouse_transactions(claim_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_trans_type ON clearinghouse_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_trans_date ON clearinghouse_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_trans_status ON clearinghouse_transactions(transaction_status);


-- ============================================================================
-- CLAIM NOTES TABLE - Communication and notes about claims
-- ============================================================================
CREATE TABLE IF NOT EXISTS claim_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,

    -- Note Details
    note_type VARCHAR(50) NOT NULL, -- Follow-up, Internal, Payer Communication, etc.
    note_text TEXT NOT NULL,

    -- Communication
    communication_date DATE,
    communication_method VARCHAR(50), -- Phone, Email, Portal, Fax
    contacted_person VARCHAR(100),
    reference_number VARCHAR(50),

    -- Follow-up
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,
    followup_assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Visibility
    is_internal BOOLEAN DEFAULT TRUE,
    is_visible_to_patient BOOLEAN DEFAULT FALSE,

    -- Audit
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMP,

    CONSTRAINT chk_note_type CHECK (note_type IN ('Follow-up', 'Internal', 'Payer Communication', 'Patient Communication', 'Denial Analysis', 'Appeal', 'Other'))
);

CREATE INDEX IF NOT EXISTS idx_claim_notes_claim ON claim_notes(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_notes_followup ON claim_notes(requires_followup, followup_date);


-- ============================================================================
-- REMITTANCE ADVICE TABLE - ERA (835) processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS remittance_advice (
    era_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    payer_id UUID REFERENCES insurance_payers(payer_id) ON DELETE SET NULL,

    -- ERA Identification
    check_number VARCHAR(50),
    check_date DATE NOT NULL,
    check_amount DECIMAL(12, 2) NOT NULL,

    -- Payer Information
    payer_name VARCHAR(255),
    payer_identifier VARCHAR(100),

    -- File Information
    file_name VARCHAR(255),
    trace_number VARCHAR(100),
    received_date TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Status
    processing_status VARCHAR(50) DEFAULT 'Received',
    posted_date TIMESTAMP,
    posted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Raw Data
    raw_835_data TEXT, -- Store raw 835 transaction

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,

    CONSTRAINT chk_era_status CHECK (processing_status IN ('Received', 'Processing', 'Posted', 'Error', 'Rejected'))
);

CREATE INDEX IF NOT EXISTS idx_remittance_advice_tenant ON remittance_advice(tenant_id);
CREATE INDEX IF NOT EXISTS idx_remittance_advice_payer ON remittance_advice(payer_id);
CREATE INDEX IF NOT EXISTS idx_remittance_advice_check ON remittance_advice(check_number);
CREATE INDEX IF NOT EXISTS idx_remittance_advice_date ON remittance_advice(check_date);


-- ============================================================================
-- ERA LINE ITEMS TABLE - Individual claim payments in ERA
-- ============================================================================
CREATE TABLE IF NOT EXISTS era_line_items (
    era_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    era_id UUID NOT NULL REFERENCES remittance_advice(era_id) ON DELETE CASCADE,
    claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,

    -- Claim Information
    patient_control_number VARCHAR(50),
    claim_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),

    -- Adjustments
    contractual_adjustment DECIMAL(10, 2),
    non_contractual_adjustment DECIMAL(10, 2),
    patient_responsibility DECIMAL(10, 2),

    -- Reason Codes
    adjustment_group_code VARCHAR(5),
    reason_codes JSONB, -- Array of adjustment reason codes
    remark_codes JSONB, -- Array of remark codes

    -- Status
    claim_status_code VARCHAR(10),
    claim_status_description TEXT,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_era_line_items_era ON era_line_items(era_id);
CREATE INDEX IF NOT EXISTS idx_era_line_items_claim ON era_line_items(claim_id);


-- ============================================================================
-- VIEWS FOR REPORTING AND DASHBOARDS
-- ============================================================================

-- View: Claim Summary with Key Metrics
CREATE OR REPLACE VIEW vw_claim_summary AS
SELECT
    c.claim_id,
    c.claim_number,
    c.tenant_id,
    c.claim_status,
    c.payment_status,
    c.is_denied,
    c.submission_date,
    c.service_date_from,
    c.total_charge_amount,
    c.allowed_amount,
    c.paid_amount,
    c.patient_responsibility,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    p.mrn,
    ip.payer_name,
    e.encounter_number,
    e.encounter_type,
    COUNT(DISTINCT cd.denial_id) AS denial_count,
    CASE
        WHEN c.paid_amount IS NOT NULL AND c.paid_amount > 0 THEN
            ROUND((c.paid_amount / NULLIF(c.total_charge_amount, 0) * 100), 2)
        ELSE 0
    END AS payment_percentage
FROM claims c
JOIN patients p ON c.patient_id = p.patient_id
JOIN encounters e ON c.encounter_id = e.encounter_id
JOIN insurance_payers ip ON c.payer_id = ip.payer_id
LEFT JOIN claim_denials cd ON c.claim_id = cd.claim_id
GROUP BY c.claim_id, c.claim_number, c.tenant_id, c.claim_status, c.payment_status,
         c.is_denied, c.submission_date, c.service_date_from, c.total_charge_amount,
         c.allowed_amount, c.paid_amount, c.patient_responsibility,
         p.first_name, p.last_name, p.mrn, ip.payer_name,
         e.encounter_number, e.encounter_type;

-- View: Denial Analysis
CREATE OR REPLACE VIEW vw_denial_analysis AS
SELECT
    cd.denial_id,
    cd.denial_date,
    cd.denial_type,
    cd.denial_category,
    cd.denial_reason_code,
    cd.denied_amount,
    cd.resolution_status,
    cd.priority,
    c.claim_number,
    c.tenant_id,
    p.mrn,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    ip.payer_name,
    u.username AS assigned_to_name
FROM claim_denials cd
JOIN claims c ON cd.claim_id = c.claim_id
JOIN patients p ON c.patient_id = p.patient_id
JOIN insurance_payers ip ON c.payer_id = ip.payer_id
LEFT JOIN users u ON cd.assigned_to = u.user_id;

-- View: Revenue Cycle Metrics
CREATE OR REPLACE VIEW vw_revenue_cycle_metrics AS
SELECT
    c.tenant_id,
    DATE_TRUNC('month', c.service_date_from) AS service_month,
    COUNT(DISTINCT c.claim_id) AS total_claims,
    SUM(c.total_charge_amount) AS total_charges,
    SUM(c.allowed_amount) AS total_allowed,
    SUM(c.paid_amount) AS total_paid,
    SUM(CASE WHEN c.is_denied THEN 1 ELSE 0 END) AS denied_claims,
    ROUND(
        SUM(CASE WHEN c.is_denied THEN 1 ELSE 0 END)::DECIMAL /
        NULLIF(COUNT(DISTINCT c.claim_id), 0) * 100, 2
    ) AS denial_rate,
    ROUND(
        SUM(c.paid_amount) / NULLIF(SUM(c.total_charge_amount), 0) * 100, 2
    ) AS collection_rate,
    AVG(
        CASE WHEN c.payment_date IS NOT NULL AND c.submission_date IS NOT NULL
        THEN EXTRACT(DAY FROM c.payment_date - c.submission_date)
        ELSE NULL END
    ) AS avg_days_to_payment
FROM claims c
WHERE c.claim_status != 'Draft'
GROUP BY c.tenant_id, DATE_TRUNC('month', c.service_date_from);


-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables
DROP TRIGGER IF EXISTS trg_patients_timestamp ON patients;
CREATE TRIGGER trg_patients_timestamp
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_patient_insurance_timestamp ON patient_insurance;
CREATE TRIGGER trg_patient_insurance_timestamp
    BEFORE UPDATE ON patient_insurance
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_encounters_timestamp ON encounters;
CREATE TRIGGER trg_encounters_timestamp
    BEFORE UPDATE ON encounters
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_encounter_diagnoses_timestamp ON encounter_diagnoses;
CREATE TRIGGER trg_encounter_diagnoses_timestamp
    BEFORE UPDATE ON encounter_diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_encounter_procedures_timestamp ON encounter_procedures;
CREATE TRIGGER trg_encounter_procedures_timestamp
    BEFORE UPDATE ON encounter_procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_claims_timestamp ON claims;
CREATE TRIGGER trg_claims_timestamp
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_claim_denials_timestamp ON claim_denials;
CREATE TRIGGER trg_claim_denials_timestamp
    BEFORE UPDATE ON claim_denials
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_claim_notes_timestamp ON claim_notes;
CREATE TRIGGER trg_claim_notes_timestamp
    BEFORE UPDATE ON claim_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();


-- Function: Auto-create claim on encounter completion
CREATE OR REPLACE FUNCTION auto_create_claim_on_encounter_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.billing_status = 'Ready' AND OLD.billing_status != 'Ready' THEN
        -- Auto-create claim when encounter is ready for billing
        INSERT INTO claims (
            tenant_id,
            claim_number,
            encounter_id,
            patient_id,
            payer_id,
            insurance_id,
            claim_type,
            claim_frequency_code,
            service_date_from,
            service_date_to,
            total_charge_amount,
            billing_provider_id,
            claim_status,
            created_by
        )
        SELECT
            NEW.tenant_id,
            'CLM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
            NEW.encounter_id,
            NEW.patient_id,
            pi.payer_id,
            NEW.primary_insurance_id,
            CASE
                WHEN NEW.encounter_type IN ('Office Visit', 'Telemedicine') THEN 'Professional'
                WHEN NEW.encounter_type IN ('Inpatient', 'Observation') THEN 'Institutional'
                ELSE 'Professional'
            END,
            '1', -- Original claim
            NEW.service_date,
            NEW.service_end_date,
            COALESCE((SELECT SUM(charge_amount) FROM encounter_procedures WHERE encounter_id = NEW.encounter_id), 0),
            NEW.rendering_provider_id,
            'Draft',
            NEW.updated_by
        FROM patient_insurance pi
        WHERE pi.insurance_id = NEW.primary_insurance_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_claim ON encounters;
CREATE TRIGGER trg_auto_create_claim
    AFTER UPDATE ON encounters
    FOR EACH ROW
    WHEN (NEW.billing_status = 'Ready' AND OLD.billing_status != 'Ready')
    EXECUTE FUNCTION auto_create_claim_on_encounter_completion();


-- ============================================================================
-- SAMPLE DATA INSERTS (FOR TESTING)
-- ============================================================================

-- Insert sample insurance payers
INSERT INTO insurance_payers (payer_name, payer_code, payer_type, is_active)
VALUES
    ('Medicare', 'CMS00', 'Medicare', TRUE),
    ('Medicaid', 'MCD00', 'Medicaid', TRUE),
    ('Blue Cross Blue Shield', 'BCBS', 'Commercial', TRUE),
    ('Aetna', 'AETNA', 'Commercial', TRUE),
    ('UnitedHealthcare', 'UHC', 'Commercial', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- NOTE: Permissions are managed at the application level via FastAPI dependencies.
-- All database access is controlled through the API layer using JWT tokens and tenant isolation.
-- No database-level role grants are needed.


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Phase 8 EHR Integration migration completed successfully!' AS status;

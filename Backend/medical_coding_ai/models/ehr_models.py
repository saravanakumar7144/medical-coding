"""
Phase 8: EHR Integration Models
Comprehensive models for medical coding, billing, and claims management

Includes:
- Patient management
- Encounters and visits
- Diagnoses (ICD-10)
- Procedures (CPT/HCPCS)
- Insurance and payers
- Claims and denials
- Clearinghouse integration
- Remittance advice (ERA)
"""

from sqlalchemy import Column, String, Boolean, DateTime, Date, Integer, Numeric, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..utils.db import Base
import uuid
import datetime


class Patient(Base):
    """Patient demographics and identification"""
    __tablename__ = 'patients'

    patient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)

    # FHIR Integration Fields
    fhir_id = Column(String(100), index=True)  # FHIR resource ID from EHR
    source_ehr = Column(String(50))  # 'epic', 'athena', 'cerner', 'meditech'
    source_organization_id = Column(String(100))  # EHR organization identifier
    fhir_raw = Column(JSONB)  # Complete FHIR resource for reference
    last_synced_at = Column(DateTime)  # Last sync from EHR

    # Patient Identifiers
    mrn = Column(String(50), nullable=False, index=True)
    ssn = Column(Text)  # Encrypted
    external_patient_id = Column(String(100))

    # Demographics (PII - encrypted)
    first_name = Column(Text, nullable=False)
    middle_name = Column(Text)
    last_name = Column(Text, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20))

    # Contact Information (Encrypted)
    email = Column(Text)
    phone_primary = Column(Text)
    phone_secondary = Column(Text)

    # Address (Encrypted)
    address_line1 = Column(Text)
    address_line2 = Column(Text)
    city = Column(Text)
    state = Column(String(2))
    zip_code = Column(String(10))
    country = Column(String(3), default='USA')

    # Emergency Contact (Encrypted)
    emergency_contact_name = Column(Text)
    emergency_contact_phone = Column(Text)
    emergency_contact_relationship = Column(String(50))

    # Clinical Information
    primary_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    preferred_language = Column(String(50))
    race = Column(String(100))
    ethnicity = Column(String(100))
    marital_status = Column(String(20))

    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_deceased = Column(Boolean, default=False)
    deceased_date = Column(Date)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    insurance_policies = relationship("PatientInsurance", back_populates="patient", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="patient")


class InsurancePayer(Base):
    """Insurance companies and payers"""
    __tablename__ = 'insurance_payers'

    payer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Payer Identification
    payer_name = Column(String(255), nullable=False)
    payer_code = Column(String(50), index=True)
    naic_code = Column(String(20))
    clearinghouse_payer_id = Column(String(100))

    # Payer Details
    payer_type = Column(String(50))
    is_electronic_claims_enabled = Column(Boolean, default=True)
    is_electronic_era_enabled = Column(Boolean, default=True)

    # Contact Information
    phone = Column(String(20))
    fax = Column(String(20))
    email = Column(String(100))
    website = Column(String(255))

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(2))
    zip_code = Column(String(10))

    # Configuration
    claim_submission_format = Column(String(20), default='837P')
    era_format = Column(String(20), default='835')

    # Status
    is_active = Column(Boolean, default=True, index=True)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)

    # Relationships
    patient_insurance = relationship("PatientInsurance", back_populates="payer")
    claims = relationship("Claim", back_populates="payer")


class PatientInsurance(Base):
    """Patient insurance coverage information"""
    __tablename__ = 'patient_insurance'

    insurance_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.patient_id', ondelete='CASCADE'), nullable=False, index=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey('insurance_payers.payer_id', ondelete='RESTRICT'), nullable=False, index=True)

    # Insurance Details
    policy_number = Column(Text, nullable=False)  # Encrypted
    group_number = Column(Text)  # Encrypted
    plan_name = Column(String(255))
    plan_type = Column(String(50))

    # Coverage Period
    coverage_start_date = Column(Date, nullable=False)
    coverage_end_date = Column(Date)

    # Priority
    priority = Column(Integer, nullable=False, default=1, index=True)

    # Policyholder Information
    relationship_to_insured = Column(String(50))
    insured_first_name = Column(Text)
    insured_last_name = Column(Text)
    insured_dob = Column(Date)
    insured_ssn = Column(Text)
    insured_gender = Column(String(1))

    # Authorization
    requires_authorization = Column(Boolean, default=False)
    authorization_phone = Column(String(20))

    # Copay/Deductible
    copay_amount = Column(Numeric(10, 2))
    deductible_amount = Column(Numeric(10, 2))
    deductible_met = Column(Numeric(10, 2), default=0.00)
    out_of_pocket_max = Column(Numeric(10, 2))
    out_of_pocket_met = Column(Numeric(10, 2), default=0.00)

    # Status
    is_active = Column(Boolean, default=True, index=True)
    verification_status = Column(String(50), default='Not Verified')
    verification_date = Column(DateTime)
    verified_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    patient = relationship("Patient", back_populates="insurance_policies")
    payer = relationship("InsurancePayer", back_populates="patient_insurance")


class Encounter(Base):
    """Patient visits and encounters"""
    __tablename__ = 'encounters'

    encounter_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.patient_id', ondelete='CASCADE'), nullable=False, index=True)

    # FHIR Integration Fields
    fhir_id = Column(String(100), index=True)  # FHIR Encounter resource ID
    source_ehr = Column(String(50))  # 'epic', 'athena', 'cerner', 'meditech'
    source_organization_id = Column(String(100))
    fhir_raw = Column(JSONB)  # Complete FHIR Encounter resource
    last_synced_at = Column(DateTime)

    # Encounter Identification
    encounter_number = Column(String(50), nullable=False)
    external_encounter_id = Column(String(100))

    # Encounter Details
    encounter_type = Column(String(50), nullable=False)
    encounter_class = Column(String(50))
    service_date = Column(Date, nullable=False, index=True)
    service_end_date = Column(Date)

    # Provider Information
    rendering_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    referring_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    supervising_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Location
    facility_id = Column(UUID(as_uuid=True))
    facility_name = Column(String(255))
    place_of_service = Column(String(2))

    # Clinical Information
    chief_complaint = Column(Text)
    clinical_notes = Column(Text)
    discharge_disposition = Column(String(50))
    admission_source = Column(String(50))

    # Insurance
    primary_insurance_id = Column(UUID(as_uuid=True), ForeignKey('patient_insurance.insurance_id', ondelete='SET NULL'))
    secondary_insurance_id = Column(UUID(as_uuid=True), ForeignKey('patient_insurance.insurance_id', ondelete='SET NULL'))

    # Authorization
    authorization_number = Column(String(50))
    authorization_required = Column(Boolean, default=False)
    authorization_obtained = Column(Boolean, default=False)

    # Status
    encounter_status = Column(String(50), default='In Progress', index=True)
    coding_status = Column(String(50), default='Not Started', index=True)
    billing_status = Column(String(50), default='Not Ready', index=True)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)
    locked_for_coding = Column(Boolean, default=False)
    locked_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    locked_at = Column(DateTime)

    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    diagnoses = relationship("EncounterDiagnosis", back_populates="encounter", cascade="all, delete-orphan")
    procedures = relationship("EncounterProcedure", back_populates="encounter", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="encounter")


class EncounterDiagnosis(Base):
    """ICD-10 diagnoses for encounters"""
    __tablename__ = 'encounter_diagnoses'

    diagnosis_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id = Column(UUID(as_uuid=True), ForeignKey('encounters.encounter_id', ondelete='CASCADE'), nullable=False, index=True)

    # FHIR Integration Fields
    fhir_id = Column(String(100), index=True)  # FHIR Condition resource ID
    source_ehr = Column(String(50))
    fhir_raw = Column(JSONB)  # Complete FHIR Condition resource

    # Diagnosis Code
    icd10_code = Column(String(10), nullable=False, index=True)
    diagnosis_description = Column(String(500))

    # Diagnosis Details
    diagnosis_type = Column(String(50))
    present_on_admission = Column(String(1))
    diagnosis_order = Column(Integer, nullable=False, default=1)

    # AI Assistance
    ai_suggested = Column(Boolean, default=False, index=True)
    ai_confidence_score = Column(Numeric(5, 4))
    ai_reasoning = Column(Text)

    # Validation
    validated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    validated_at = Column(DateTime)
    validation_notes = Column(Text)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    encounter = relationship("Encounter", back_populates="diagnoses")


class EncounterProcedure(Base):
    """CPT/HCPCS procedures for encounters"""
    __tablename__ = 'encounter_procedures'

    procedure_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id = Column(UUID(as_uuid=True), ForeignKey('encounters.encounter_id', ondelete='CASCADE'), nullable=False, index=True)

    # FHIR Integration Fields
    fhir_id = Column(String(100), index=True)  # FHIR Procedure resource ID
    source_ehr = Column(String(50))
    fhir_raw = Column(JSONB)  # Complete FHIR Procedure resource

    # Procedure Code
    procedure_code = Column(String(10), nullable=False, index=True)
    code_type = Column(String(10), nullable=False)
    procedure_description = Column(String(500))

    # Procedure Details
    procedure_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, default=1)
    units = Column(Numeric(10, 2), default=1.00)

    # Modifiers
    modifier_1 = Column(String(2))
    modifier_2 = Column(String(2))
    modifier_3 = Column(String(2))
    modifier_4 = Column(String(2))

    # Provider
    performing_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Pricing
    charge_amount = Column(Numeric(10, 2))
    allowed_amount = Column(Numeric(10, 2))

    # AI Assistance
    ai_suggested = Column(Boolean, default=False, index=True)
    ai_confidence_score = Column(Numeric(5, 4))
    ai_reasoning = Column(Text)

    # Validation
    validated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    validated_at = Column(DateTime)
    validation_notes = Column(Text)

    # NCCI Edits
    ncci_conflict = Column(Boolean, default=False)
    ncci_override_reason = Column(Text)

    # Authorization
    requires_authorization = Column(Boolean, default=False)
    authorization_number = Column(String(50))
    authorization_status = Column(String(50))

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    encounter = relationship("Encounter", back_populates="procedures")
    claim_line_items = relationship("ClaimLineItem", back_populates="procedure")


class Claim(Base):
    """Insurance claims submission and tracking"""
    __tablename__ = 'claims'

    claim_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)

    # Claim Identification
    claim_number = Column(String(50), nullable=False)
    external_claim_id = Column(String(100))
    clearinghouse_trace_number = Column(String(100))

    # Linked Entities
    encounter_id = Column(UUID(as_uuid=True), ForeignKey('encounters.encounter_id', ondelete='RESTRICT'), nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.patient_id', ondelete='RESTRICT'), nullable=False, index=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey('insurance_payers.payer_id', ondelete='RESTRICT'), nullable=False, index=True)
    insurance_id = Column(UUID(as_uuid=True), ForeignKey('patient_insurance.insurance_id', ondelete='RESTRICT'))

    # Claim Type
    claim_type = Column(String(20), nullable=False)
    claim_frequency_code = Column(String(1))

    # Service Information
    service_date_from = Column(Date, nullable=False, index=True)
    service_date_to = Column(Date)
    total_charge_amount = Column(Numeric(10, 2), nullable=False)

    # Billing Provider
    billing_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    billing_npi = Column(String(10))
    billing_tax_id = Column(String(20))

    # Submission
    submission_date = Column(DateTime, index=True)
    submission_method = Column(String(50))
    submitted_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Status
    claim_status = Column(String(50), default='Draft', index=True)
    adjudication_status = Column(String(50))
    payment_status = Column(String(50), default='Pending', index=True)

    # Financial
    allowed_amount = Column(Numeric(10, 2))
    paid_amount = Column(Numeric(10, 2))
    patient_responsibility = Column(Numeric(10, 2))
    adjustment_amount = Column(Numeric(10, 2))

    # Payment
    payment_date = Column(Date)
    check_number = Column(String(50))
    check_date = Column(Date)

    # Clearinghouse
    clearinghouse_name = Column(String(100))
    clearinghouse_status = Column(String(50))
    clearinghouse_response = Column(Text)
    clearinghouse_error_code = Column(String(20))

    # Denial/Rejection
    is_denied = Column(Boolean, default=False, index=True)
    denial_date = Column(Date)
    denial_reason_code = Column(String(20))
    denial_reason_text = Column(Text)

    # Appeal
    is_appealed = Column(Boolean, default=False)
    appeal_date = Column(Date)
    appeal_level = Column(Integer)
    appeal_status = Column(String(50))

    # Notes
    notes = Column(Text)
    internal_notes = Column(Text)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    encounter = relationship("Encounter", back_populates="claims")
    patient = relationship("Patient", back_populates="claims")
    payer = relationship("InsurancePayer", back_populates="claims")
    line_items = relationship("ClaimLineItem", back_populates="claim", cascade="all, delete-orphan")
    denials = relationship("ClaimDenial", back_populates="claim", cascade="all, delete-orphan")
    notes_list = relationship("ClaimNote", back_populates="claim", cascade="all, delete-orphan")
    clearinghouse_transactions = relationship("ClearinghouseTransaction", back_populates="claim")


class ClaimLineItem(Base):
    """Individual services/procedures on a claim"""
    __tablename__ = 'claim_line_items'

    line_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey('claims.claim_id', ondelete='CASCADE'), nullable=False, index=True)

    # Line Item Details
    line_number = Column(Integer, nullable=False)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey('encounter_procedures.procedure_id', ondelete='SET NULL'), index=True)

    # Service Information
    procedure_code = Column(String(10), nullable=False)
    code_type = Column(String(10), nullable=False)
    procedure_description = Column(String(500))
    service_date = Column(Date, nullable=False)

    # Modifiers
    modifier_1 = Column(String(2))
    modifier_2 = Column(String(2))
    modifier_3 = Column(String(2))
    modifier_4 = Column(String(2))

    # Diagnosis Pointers
    diagnosis_pointer_1 = Column(Integer)
    diagnosis_pointer_2 = Column(Integer)
    diagnosis_pointer_3 = Column(Integer)
    diagnosis_pointer_4 = Column(Integer)

    # Quantity and Pricing
    quantity = Column(Integer, default=1)
    units = Column(Numeric(10, 2), default=1.00)
    charge_amount = Column(Numeric(10, 2), nullable=False)
    allowed_amount = Column(Numeric(10, 2))
    paid_amount = Column(Numeric(10, 2))
    adjustment_amount = Column(Numeric(10, 2))

    # Adjustment Codes
    adjustment_group_code = Column(String(5))
    adjustment_reason_code = Column(String(10))
    adjustment_reason_text = Column(Text)

    # Status
    line_status = Column(String(50), default='Submitted')
    is_denied = Column(Boolean, default=False, index=True)
    denial_reason_code = Column(String(20))
    denial_reason_text = Column(Text)

    # Provider
    rendering_provider_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    rendering_npi = Column(String(10))

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)

    # Relationships
    claim = relationship("Claim", back_populates="line_items")
    procedure = relationship("EncounterProcedure", back_populates="claim_line_items")


class ClaimDenial(Base):
    """Detailed denial tracking and management"""
    __tablename__ = 'claim_denials'

    denial_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey('claims.claim_id', ondelete='CASCADE'), nullable=False, index=True)

    # Denial Information
    denial_date = Column(Date, nullable=False, index=True)
    denial_type = Column(String(50), nullable=False)
    denial_category = Column(String(50))

    # Denial Codes
    denial_reason_code = Column(String(20))
    denial_reason_text = Column(Text, nullable=False)
    remark_code = Column(String(20))
    remark_text = Column(Text)

    # CARC and RARC codes
    carc_code = Column(String(10))
    carc_description = Column(Text)
    rarc_code = Column(String(10))
    rarc_description = Column(Text)

    # Financial Impact
    denied_amount = Column(Numeric(10, 2))

    # Root Cause Analysis
    root_cause = Column(String(100))
    preventable = Column(Boolean)
    responsible_party = Column(String(100))

    # Resolution
    resolution_strategy = Column(String(100))
    resolution_status = Column(String(50), default='Pending', index=True)
    resolution_date = Column(Date)
    resolution_notes = Column(Text)

    # Appeal Information
    appeal_deadline = Column(Date)
    appeal_filed_date = Column(Date)
    appeal_level = Column(Integer)
    appeal_outcome = Column(String(50))
    appeal_recovered_amount = Column(Numeric(10, 2))

    # Assignment
    assigned_to = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'), index=True)
    assigned_at = Column(DateTime)

    # Priority
    priority = Column(String(20), default='Medium', index=True)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    claim = relationship("Claim", back_populates="denials")


class ClearinghouseTransaction(Base):
    """Track all clearinghouse communications"""
    __tablename__ = 'clearinghouse_transactions'

    transaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey('claims.claim_id', ondelete='SET NULL'), index=True)

    # Transaction Details
    transaction_type = Column(String(50), nullable=False, index=True)
    transaction_direction = Column(String(10), nullable=False)
    transaction_date = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, index=True)

    # Clearinghouse
    clearinghouse_name = Column(String(100))
    clearinghouse_id = Column(String(100))
    trace_number = Column(String(100))

    # File Information
    file_name = Column(String(255))
    file_format = Column(String(20))
    file_size = Column(Integer)
    file_content = Column(Text)

    # Status
    transaction_status = Column(String(50), default='Sent', index=True)
    error_code = Column(String(50))
    error_message = Column(Text)

    # Response
    response_received_at = Column(DateTime)
    response_status = Column(String(50))
    response_content = Column(Text)

    # Acknowledgment
    acknowledgment_code = Column(String(50))
    acknowledgment_message = Column(Text)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="clearinghouse_transactions")


class ClaimNote(Base):
    """Communication and notes about claims"""
    __tablename__ = 'claim_notes'

    note_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey('claims.claim_id', ondelete='CASCADE'), nullable=False, index=True)

    # Note Details
    note_type = Column(String(50), nullable=False)
    note_text = Column(Text, nullable=False)

    # Communication
    communication_date = Column(Date)
    communication_method = Column(String(50))
    contacted_person = Column(String(100))
    reference_number = Column(String(50))

    # Follow-up
    requires_followup = Column(Boolean, default=False)
    followup_date = Column(Date, index=True)
    followup_assigned_to = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Visibility
    is_internal = Column(Boolean, default=True)
    is_visible_to_patient = Column(Boolean, default=False)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    claim = relationship("Claim", back_populates="notes_list")


class RemittanceAdvice(Base):
    """ERA (835) processing"""
    __tablename__ = 'remittance_advice'

    era_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey('insurance_payers.payer_id', ondelete='SET NULL'), index=True)

    # ERA Identification
    check_number = Column(String(50), index=True)
    check_date = Column(Date, nullable=False, index=True)
    check_amount = Column(Numeric(12, 2), nullable=False)

    # Payer Information
    payer_name = Column(String(255))
    payer_identifier = Column(String(100))

    # File Information
    file_name = Column(String(255))
    trace_number = Column(String(100))
    received_date = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Status
    processing_status = Column(String(50), default='Received')
    posted_date = Column(DateTime)
    posted_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))

    # Raw Data
    raw_835_data = Column(Text)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)

    # Relationships
    line_items = relationship("ERALineItem", back_populates="era", cascade="all, delete-orphan")


class ERALineItem(Base):
    """Individual claim payments in ERA"""
    __tablename__ = 'era_line_items'

    era_line_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    era_id = Column(UUID(as_uuid=True), ForeignKey('remittance_advice.era_id', ondelete='CASCADE'), nullable=False, index=True)
    claim_id = Column(UUID(as_uuid=True), ForeignKey('claims.claim_id', ondelete='SET NULL'), index=True)

    # Claim Information
    patient_control_number = Column(String(50))
    claim_amount = Column(Numeric(10, 2))
    paid_amount = Column(Numeric(10, 2))

    # Adjustments
    contractual_adjustment = Column(Numeric(10, 2))
    non_contractual_adjustment = Column(Numeric(10, 2))
    patient_responsibility = Column(Numeric(10, 2))

    # Reason Codes
    adjustment_group_code = Column(String(5))
    reason_codes = Column(JSONB)
    remark_codes = Column(JSONB)

    # Status
    claim_status_code = Column(String(10))
    claim_status_description = Column(Text)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    # Relationships
    era = relationship("RemittanceAdvice", back_populates="line_items")


# ============================================================================
# EHR POLLING INTEGRATION MODELS
# ============================================================================

class EHRConnection(Base):
    """EHR system connection configuration for polling"""
    __tablename__ = 'ehr_connections'

    connection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)

    # EHR Configuration
    ehr_type = Column(String(50), nullable=False, index=True)  # 'epic', 'athena', 'cerner', 'meditech'
    organization_name = Column(String(255), nullable=False)
    organization_id = Column(String(100))  # External org ID in EHR system

    # Connection Settings
    base_url = Column(String(500), nullable=False)  # FHIR API base URL
    client_id = Column(Text)  # Encrypted - OAuth client ID
    client_secret = Column(Text)  # Encrypted - OAuth client secret
    private_key = Column(Text)  # Encrypted - JWT signing key (for Epic Backend Services)
    public_key_id = Column(String(100))  # Key ID for JWT

    # Polling Configuration
    poll_interval_seconds = Column(Integer, default=30)
    is_active = Column(Boolean, default=True, index=True)
    use_mock_data = Column(Boolean, default=True)  # Use mock FHIR data for testing

    # Sync Status
    last_sync_at = Column(DateTime)
    last_sync_status = Column(String(50))
    last_sync_error = Column(Text)

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

    # Relationships
    sync_states = relationship("SyncState", back_populates="connection", cascade="all, delete-orphan")


class SyncState(Base):
    """Track sync state for each resource type per EHR connection"""
    __tablename__ = 'sync_state'

    sync_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_id = Column(UUID(as_uuid=True), ForeignKey('ehr_connections.connection_id', ondelete='CASCADE'), nullable=False, index=True)

    # Resource Tracking
    resource_type = Column(String(50), nullable=False, index=True)  # 'Patient', 'Encounter', 'Condition', 'Procedure'

    # Sync Timestamps
    last_sync_time = Column(DateTime)  # Last successful sync time
    next_sync_time = Column(DateTime)  # Scheduled next sync

    # Sync Metrics
    last_sync_status = Column(String(50), default='pending')  # 'success', 'error', 'in_progress', 'pending'
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_error_message = Column(Text)

    # Pagination State (for resumable sync)
    continuation_token = Column(String(500))  # FHIR pagination token
    last_processed_id = Column(String(100))  # Last processed resource ID

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)

    # Relationships
    connection = relationship("EHRConnection", back_populates="sync_states")


# ============================================================================
# REFERENCE DATA MODELS
# ============================================================================

class ICD10Code(Base):
    """ICD-10-CM code reference data"""
    __tablename__ = 'icd10_codes'

    code = Column(String(10), primary_key=True)
    description = Column(String(500), nullable=False)

    # Code Details
    is_billable = Column(Boolean, default=True, index=True)
    category = Column(String(100))  # e.g., 'Infectious diseases', 'Neoplasms'
    chapter = Column(String(5))  # ICD-10 chapter (1-22)
    block = Column(String(20))  # Block range (e.g., 'A00-A09')

    # Clinical Classification
    code_type = Column(String(50))  # 'diagnosis', 'external_cause', 'health_status'
    severity = Column(String(20))  # 'mild', 'moderate', 'severe' if applicable
    laterality = Column(String(20))  # 'left', 'right', 'bilateral', 'unspecified'

    # Usage Statistics (can be updated periodically)
    usage_frequency = Column(Integer, default=0)  # How often this code is used

    # Metadata
    effective_date = Column(Date)
    expiration_date = Column(Date)
    is_active = Column(Boolean, default=True, index=True)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)


class CPTCode(Base):
    """CPT/HCPCS code reference data"""
    __tablename__ = 'cpt_codes'

    code = Column(String(10), primary_key=True)
    description = Column(String(500), nullable=False)

    # Code Details
    code_type = Column(String(10), nullable=False, index=True)  # 'CPT', 'HCPCS'
    category = Column(String(100))  # e.g., 'E/M', 'Surgery', 'Radiology'
    subcategory = Column(String(100))

    # RVU Values (Relative Value Units)
    rvu_work = Column(Numeric(8, 4))  # Physician work RVU
    rvu_facility = Column(Numeric(8, 4))  # Facility practice expense RVU
    rvu_non_facility = Column(Numeric(8, 4))  # Non-facility practice expense RVU
    rvu_malpractice = Column(Numeric(8, 4))  # Malpractice RVU
    rvu_total = Column(Numeric(8, 4))  # Total RVU

    # Pricing
    facility_fee = Column(Numeric(10, 2))  # Medicare facility rate
    non_facility_fee = Column(Numeric(10, 2))  # Medicare non-facility rate
    conversion_factor = Column(Numeric(8, 4))  # CMS conversion factor

    # Modifiers
    global_period = Column(Integer)  # Global surgical period in days (0, 10, 90)
    requires_modifier = Column(Boolean, default=False)
    common_modifiers = Column(JSONB)  # ['26', '59', 'TC', etc.]

    # Usage Statistics
    usage_frequency = Column(Integer, default=0)

    # Metadata
    effective_date = Column(Date)
    expiration_date = Column(Date)
    is_active = Column(Boolean, default=True, index=True)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime)


class ClearinghouseConnection(Base):
    """Clearinghouse connection configuration"""
    __tablename__ = 'clearinghouse_connections'

    connection_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False, index=True)

    # Clearinghouse Configuration
    clearinghouse_type = Column(String(50), nullable=False, index=True)  # 'stedi', 'availity', 'change_healthcare'
    clearinghouse_name = Column(String(255), nullable=False)

    # Connection Settings
    api_base_url = Column(String(500))
    api_key = Column(Text)  # Encrypted
    api_secret = Column(Text)  # Encrypted
    submitter_id = Column(String(100))  # Submitter ID for EDI

    # SFTP Settings (if applicable)
    sftp_host = Column(String(255))
    sftp_port = Column(Integer, default=22)
    sftp_username = Column(String(100))
    sftp_password = Column(Text)  # Encrypted
    sftp_private_key = Column(Text)  # Encrypted

    # Polling Configuration
    poll_interval_seconds = Column(Integer, default=300)  # 5 minutes default
    is_active = Column(Boolean, default=True, index=True)
    use_mock_data = Column(Boolean, default=True)

    # Status
    last_sync_at = Column(DateTime)
    last_sync_status = Column(String(50))

    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='SET NULL'))
    updated_at = Column(DateTime)

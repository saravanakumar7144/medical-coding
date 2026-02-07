"""
Phase 8: Claims Management API
Comprehensive endpoints for medical coding, billing, and claims

Endpoints include:
- Patient management (CRUD)
- Encounter tracking
- Diagnosis and procedure coding
- Insurance management
- Claims submission and tracking
- Denial management
- Clearinghouse integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import date, datetime, timedelta
import uuid

from ..utils.db import get_db
from ..api.deps import get_current_user
from ..models.user_models import User
from ..models.ehr_models import (
    Patient, Encounter, EncounterDiagnosis, EncounterProcedure,
    InsurancePayer, PatientInsurance, Claim, ClaimLineItem,
    ClaimDenial, ClaimNote, ClearinghouseTransaction,
    RemittanceAdvice, ERALineItem
)
from ..utils.crypto import encrypt, decrypt

router = APIRouter()


# ============================================================================
# PYDANTIC MODELS - Request/Response Schemas
# ============================================================================

class PatientCreate(BaseModel):
    mrn: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    date_of_birth: date
    gender: Optional[str] = None
    email: Optional[str] = None
    phone_primary: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    ssn: Optional[str] = None
    primary_provider_id: Optional[uuid.UUID] = None


class PatientResponse(BaseModel):
    patient_id: uuid.UUID
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EncounterCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_type: str
    service_date: date
    rendering_provider_id: Optional[uuid.UUID] = None
    primary_insurance_id: Optional[uuid.UUID] = None
    chief_complaint: Optional[str] = None
    place_of_service: Optional[str] = None


class EncounterResponse(BaseModel):
    encounter_id: uuid.UUID
    encounter_number: str
    patient_id: uuid.UUID
    encounter_type: str
    service_date: date
    encounter_status: str
    coding_status: str
    billing_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisCreate(BaseModel):
    icd10_code: str
    diagnosis_description: str
    diagnosis_type: str = 'Primary'
    diagnosis_order: int = 1
    ai_suggested: bool = False
    ai_confidence_score: Optional[float] = None
    ai_reasoning: Optional[str] = None


class DiagnosisResponse(BaseModel):
    diagnosis_id: uuid.UUID
    icd10_code: str
    diagnosis_description: str
    diagnosis_type: str
    diagnosis_order: int
    ai_suggested: bool
    validated_by: Optional[uuid.UUID]

    class Config:
        from_attributes = True


class ProcedureCreate(BaseModel):
    procedure_code: str
    code_type: str  # 'CPT' or 'HCPCS'
    procedure_description: str
    procedure_date: date
    quantity: int = 1
    charge_amount: float
    modifier_1: Optional[str] = None
    modifier_2: Optional[str] = None
    ai_suggested: bool = False
    ai_confidence_score: Optional[float] = None


class ProcedureResponse(BaseModel):
    procedure_id: uuid.UUID
    procedure_code: str
    code_type: str
    procedure_description: str
    procedure_date: date
    charge_amount: float
    ai_suggested: bool
    validated_by: Optional[uuid.UUID]

    class Config:
        from_attributes = True


class ClaimCreate(BaseModel):
    encounter_id: uuid.UUID
    payer_id: uuid.UUID
    insurance_id: uuid.UUID
    claim_type: str = 'Professional'
    submission_method: str = 'Electronic'


class ClaimResponse(BaseModel):
    claim_id: uuid.UUID
    claim_number: str
    encounter_id: uuid.UUID
    patient_id: uuid.UUID
    payer_id: uuid.UUID
    claim_type: str
    claim_status: str
    payment_status: str
    total_charge_amount: float
    paid_amount: Optional[float]
    submission_date: Optional[datetime]
    is_denied: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DenialCreate(BaseModel):
    claim_id: uuid.UUID
    denial_date: date
    denial_type: str
    denial_reason_code: Optional[str] = None
    denial_reason_text: str
    denied_amount: float
    priority: str = 'Medium'
    resolution_strategy: Optional[str] = None


class DenialResponse(BaseModel):
    denial_id: uuid.UUID
    claim_id: uuid.UUID
    denial_date: date
    denial_type: str
    denial_reason_text: str
    denied_amount: float
    resolution_status: str
    priority: str
    assigned_to: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class ClaimNoteCreate(BaseModel):
    note_type: str
    note_text: str
    communication_method: Optional[str] = None
    requires_followup: bool = False
    followup_date: Optional[date] = None


class DashboardMetrics(BaseModel):
    total_claims: int
    claims_pending: int
    claims_paid: int
    claims_denied: int
    total_charges: float
    total_paid: float
    denial_rate: float
    avg_days_to_payment: Optional[float]


# ============================================================================
# PATIENT ENDPOINTS
# ============================================================================

@router.post('/patients', response_model=PatientResponse)
async def create_patient(
    payload: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new patient record"""

    # Encrypt PII fields (only TEXT columns)
    encrypted_first_name = encrypt(payload.first_name)
    encrypted_last_name = encrypt(payload.last_name)
    # DON'T encrypt date_of_birth - it's a DATE column, not TEXT
    encrypted_email = encrypt(payload.email) if payload.email else None
    encrypted_phone = encrypt(payload.phone_primary) if payload.phone_primary else None
    encrypted_ssn = encrypt(payload.ssn) if payload.ssn else None

    # Create patient
    new_patient = Patient(
        tenant_id=current_user.tenant_id,
        mrn=payload.mrn,
        first_name=encrypted_first_name,
        middle_name=payload.middle_name,
        last_name=encrypted_last_name,
        date_of_birth=payload.date_of_birth,  # Store as native DATE
        gender=payload.gender,
        email=encrypted_email,
        phone_primary=encrypted_phone,
        ssn=encrypted_ssn,
        address_line1=encrypt(payload.address_line1) if payload.address_line1 else None,
        city=encrypt(payload.city) if payload.city else None,
        state=payload.state,  # Don't encrypt VARCHAR fields
        zip_code=payload.zip_code,  # Don't encrypt VARCHAR fields
        primary_provider_id=payload.primary_provider_id,
        created_by=current_user.user_id
    )

    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)

    # Decrypt for response
    return PatientResponse(
        patient_id=new_patient.patient_id,
        mrn=new_patient.mrn,
        first_name=decrypt(new_patient.first_name),
        last_name=decrypt(new_patient.last_name),
        date_of_birth=new_patient.date_of_birth,  # Already a date object, no decryption needed
        gender=new_patient.gender,
        is_active=new_patient.is_active,
        created_at=new_patient.created_at
    )


@router.get('/patients', response_model=List[PatientResponse])
async def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all patients for the current tenant"""

    query = select(Patient).where(Patient.tenant_id == current_user.tenant_id)

    if active_only:
        query = query.where(Patient.is_active == True)

    if search:
        # Search in MRN (unencrypted)
        query = query.where(Patient.mrn.ilike(f'%{search}%'))

    query = query.offset(skip).limit(limit).order_by(Patient.created_at.desc())

    result = await db.execute(query)
    patients = result.scalars().all()

    # Decrypt PII for response
    return [
        PatientResponse(
            patient_id=p.patient_id,
            mrn=p.mrn,
            first_name=decrypt(p.first_name),
            last_name=decrypt(p.last_name),
            date_of_birth=p.date_of_birth,  # Already a date object, no decryption needed
            gender=p.gender,
            is_active=p.is_active,
            created_at=p.created_at
        )
        for p in patients
    ]


@router.get('/patients/{patient_id}', response_model=PatientResponse)
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific patient by ID"""

    query = select(Patient).where(
        Patient.patient_id == patient_id,
        Patient.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    return PatientResponse(
        patient_id=patient.patient_id,
        mrn=patient.mrn,
        first_name=decrypt(patient.first_name),
        last_name=decrypt(patient.last_name),
        date_of_birth=patient.date_of_birth,  # Already a date object, no decryption needed
        gender=patient.gender,
        is_active=patient.is_active,
        created_at=patient.created_at
    )


# ============================================================================
# ENCOUNTER ENDPOINTS
# ============================================================================

@router.post('/encounters', response_model=EncounterResponse)
async def create_encounter(
    payload: EncounterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new encounter"""

    # Verify patient exists and belongs to tenant
    patient_query = select(Patient).where(
        Patient.patient_id == payload.patient_id,
        Patient.tenant_id == current_user.tenant_id
    )
    patient_result = await db.execute(patient_query)
    patient = patient_result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    # Generate unique encounter number
    encounter_number = f'ENC-{datetime.now().strftime("%Y%m%d")}-{uuid.uuid4().hex[:8].upper()}'

    new_encounter = Encounter(
        tenant_id=current_user.tenant_id,
        patient_id=payload.patient_id,
        encounter_number=encounter_number,
        encounter_type=payload.encounter_type,
        service_date=payload.service_date,
        rendering_provider_id=payload.rendering_provider_id or current_user.user_id,
        primary_insurance_id=payload.primary_insurance_id,
        chief_complaint=payload.chief_complaint,
        place_of_service=payload.place_of_service,
        encounter_status='In Progress',
        coding_status='Not Started',
        billing_status='Not Ready',
        created_by=current_user.user_id
    )

    db.add(new_encounter)
    await db.commit()
    await db.refresh(new_encounter)

    return EncounterResponse.from_orm(new_encounter)


@router.get('/encounters', response_model=List[EncounterResponse])
async def list_encounters(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    patient_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    coding_status: Optional[str] = None,  # Filter by coding status (Pending, In Progress, Finalized)
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List encounters with filtering"""

    query = select(Encounter).where(Encounter.tenant_id == current_user.tenant_id)

    if patient_id:
        query = query.where(Encounter.patient_id == patient_id)

    if status:
        query = query.where(Encounter.encounter_status == status)

    if coding_status:
        query = query.where(Encounter.coding_status == coding_status)

    if date_from:
        query = query.where(Encounter.service_date >= date_from)

    if date_to:
        query = query.where(Encounter.service_date <= date_to)

    query = query.offset(skip).limit(limit).order_by(Encounter.service_date.desc())

    result = await db.execute(query)
    encounters = result.scalars().all()

    return [EncounterResponse.from_orm(e) for e in encounters]


@router.post('/encounters/{encounter_id}/diagnoses', response_model=DiagnosisResponse)
async def add_diagnosis_to_encounter(
    encounter_id: uuid.UUID,
    payload: DiagnosisCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a diagnosis code to an encounter"""

    # Verify encounter exists
    encounter_query = select(Encounter).where(
        Encounter.encounter_id == encounter_id,
        Encounter.tenant_id == current_user.tenant_id
    )
    encounter_result = await db.execute(encounter_query)
    encounter = encounter_result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail='Encounter not found')

    new_diagnosis = EncounterDiagnosis(
        encounter_id=encounter_id,
        icd10_code=payload.icd10_code,
        diagnosis_description=payload.diagnosis_description,
        diagnosis_type=payload.diagnosis_type,
        diagnosis_order=payload.diagnosis_order,
        ai_suggested=payload.ai_suggested,
        ai_confidence_score=payload.ai_confidence_score,
        ai_reasoning=payload.ai_reasoning,
        created_by=current_user.user_id
    )

    db.add(new_diagnosis)

    # Update encounter coding status
    if encounter.coding_status == 'Not Started':
        encounter.coding_status = 'In Progress'
        encounter.updated_by = current_user.user_id

    await db.commit()
    await db.refresh(new_diagnosis)

    return DiagnosisResponse.from_orm(new_diagnosis)


@router.post('/encounters/{encounter_id}/procedures', response_model=ProcedureResponse)
async def add_procedure_to_encounter(
    encounter_id: uuid.UUID,
    payload: ProcedureCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a procedure code to an encounter"""

    # Verify encounter exists
    encounter_query = select(Encounter).where(
        Encounter.encounter_id == encounter_id,
        Encounter.tenant_id == current_user.tenant_id
    )
    encounter_result = await db.execute(encounter_query)
    encounter = encounter_result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail='Encounter not found')

    new_procedure = EncounterProcedure(
        encounter_id=encounter_id,
        procedure_code=payload.procedure_code,
        code_type=payload.code_type,
        procedure_description=payload.procedure_description,
        procedure_date=payload.procedure_date,
        quantity=payload.quantity,
        charge_amount=payload.charge_amount,
        modifier_1=payload.modifier_1,
        modifier_2=payload.modifier_2,
        ai_suggested=payload.ai_suggested,
        ai_confidence_score=payload.ai_confidence_score,
        performing_provider_id=current_user.user_id,
        created_by=current_user.user_id
    )

    db.add(new_procedure)

    # Update encounter coding status
    if encounter.coding_status == 'Not Started':
        encounter.coding_status = 'In Progress'
        encounter.updated_by = current_user.user_id

    await db.commit()
    await db.refresh(new_procedure)

    return ProcedureResponse.from_orm(new_procedure)


@router.put('/encounters/{encounter_id}/mark-ready-for-billing')
async def mark_encounter_ready_for_billing(
    encounter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark encounter as ready for billing - auto-creates claim"""

    # Get encounter with diagnoses and procedures
    query = select(Encounter).options(
        selectinload(Encounter.diagnoses),
        selectinload(Encounter.procedures)
    ).where(
        Encounter.encounter_id == encounter_id,
        Encounter.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    encounter = result.scalar_one_or_none()

    if not encounter:
        raise HTTPException(status_code=404, detail='Encounter not found')

    # Validate encounter has required information
    if not encounter.diagnoses:
        raise HTTPException(status_code=400, detail='Encounter must have at least one diagnosis')

    if not encounter.procedures:
        raise HTTPException(status_code=400, detail='Encounter must have at least one procedure')

    if not encounter.primary_insurance_id:
        raise HTTPException(status_code=400, detail='Encounter must have primary insurance')

    # Update encounter status
    encounter.coding_status = 'Finalized'
    encounter.billing_status = 'Ready'
    encounter.updated_by = current_user.user_id
    encounter.updated_at = datetime.utcnow()

    await db.commit()

    return {"message": "Encounter marked as ready for billing. Claim will be auto-created."}


# ============================================================================
# CLAIM ENDPOINTS
# ============================================================================

@router.get('/claims', response_model=List[ClaimResponse])
async def list_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    denied_only: bool = False,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List claims with filtering"""

    query = select(Claim).where(Claim.tenant_id == current_user.tenant_id)

    if status:
        query = query.where(Claim.claim_status == status)

    if payment_status:
        query = query.where(Claim.payment_status == payment_status)

    if denied_only:
        query = query.where(Claim.is_denied == True)

    if date_from:
        query = query.where(Claim.service_date_from >= date_from)

    if date_to:
        query = query.where(Claim.service_date_from <= date_to)

    query = query.offset(skip).limit(limit).order_by(Claim.created_at.desc())

    result = await db.execute(query)
    claims = result.scalars().all()

    return [ClaimResponse.from_orm(c) for c in claims]


@router.get('/claims/{claim_id}', response_model=ClaimResponse)
async def get_claim(
    claim_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed claim information"""

    query = select(Claim).options(
        selectinload(Claim.line_items),
        selectinload(Claim.denials),
        selectinload(Claim.notes_list)
    ).where(
        Claim.claim_id == claim_id,
        Claim.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail='Claim not found')

    return ClaimResponse.from_orm(claim)


@router.post('/claims/{claim_id}/submit')
async def submit_claim(
    claim_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a claim to clearinghouse/payer"""

    query = select(Claim).where(
        Claim.claim_id == claim_id,
        Claim.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail='Claim not found')

    if claim.claim_status != 'Ready' and claim.claim_status != 'Draft':
        raise HTTPException(status_code=400, detail=f'Cannot submit claim with status: {claim.claim_status}')

    # Update claim status
    claim.claim_status = 'Submitted'
    claim.submission_date = datetime.utcnow()
    claim.submitted_by = current_user.user_id
    claim.updated_by = current_user.user_id
    claim.updated_at = datetime.utcnow()

    # Create clearinghouse transaction record
    transaction = ClearinghouseTransaction(
        claim_id=claim_id,
        transaction_type=claim.claim_type[:4].upper(),  # '837P' or '837I'
        transaction_direction='Outbound',
        transaction_status='Sent',
        clearinghouse_name=claim.clearinghouse_name or 'Default Clearinghouse',
        created_by=current_user.user_id
    )

    db.add(transaction)
    await db.commit()

    return {"message": "Claim submitted successfully", "claim_id": str(claim_id)}


# ============================================================================
# DENIAL ENDPOINTS
# ============================================================================

@router.post('/denials', response_model=DenialResponse)
async def create_denial(
    payload: DenialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a denial record for a claim"""

    # Verify claim exists
    claim_query = select(Claim).where(
        Claim.claim_id == payload.claim_id,
        Claim.tenant_id == current_user.tenant_id
    )
    claim_result = await db.execute(claim_query)
    claim = claim_result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail='Claim not found')

    new_denial = ClaimDenial(
        claim_id=payload.claim_id,
        denial_date=payload.denial_date,
        denial_type=payload.denial_type,
        denial_reason_code=payload.denial_reason_code,
        denial_reason_text=payload.denial_reason_text,
        denied_amount=payload.denied_amount,
        priority=payload.priority,
        resolution_strategy=payload.resolution_strategy,
        resolution_status='Pending',
        created_by=current_user.user_id
    )

    db.add(new_denial)

    # Update claim status
    claim.is_denied = True
    claim.denial_date = payload.denial_date
    claim.denial_reason_code = payload.denial_reason_code
    claim.denial_reason_text = payload.denial_reason_text
    claim.claim_status = 'Denied'
    claim.updated_by = current_user.user_id
    claim.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(new_denial)

    return DenialResponse.from_orm(new_denial)


@router.get('/denials', response_model=List[DenialResponse])
async def list_denials(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_me: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List denials with filtering"""

    # Join with claims to filter by tenant
    query = select(ClaimDenial).join(Claim).where(Claim.tenant_id == current_user.tenant_id)

    if status:
        query = query.where(ClaimDenial.resolution_status == status)

    if priority:
        query = query.where(ClaimDenial.priority == priority)

    if assigned_to_me:
        query = query.where(ClaimDenial.assigned_to == current_user.user_id)

    query = query.offset(skip).limit(limit).order_by(ClaimDenial.denial_date.desc())

    result = await db.execute(query)
    denials = result.scalars().all()

    return [DenialResponse.from_orm(d) for d in denials]


@router.put('/denials/{denial_id}/assign')
async def assign_denial(
    denial_id: uuid.UUID,
    assigned_to: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign a denial to a user"""

    query = select(ClaimDenial).join(Claim).where(
        ClaimDenial.denial_id == denial_id,
        Claim.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    denial = result.scalar_one_or_none()

    if not denial:
        raise HTTPException(status_code=404, detail='Denial not found')

    denial.assigned_to = assigned_to
    denial.assigned_at = datetime.utcnow()
    denial.updated_by = current_user.user_id
    denial.updated_at = datetime.utcnow()

    await db.commit()

    return {"message": "Denial assigned successfully"}


@router.put('/denials/{denial_id}/resolve')
async def resolve_denial(
    denial_id: uuid.UUID,
    resolution_notes: str,
    resolution_strategy: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a denial as resolved"""

    query = select(ClaimDenial).join(Claim).where(
        ClaimDenial.denial_id == denial_id,
        Claim.tenant_id == current_user.tenant_id
    )
    result = await db.execute(query)
    denial = result.scalar_one_or_none()

    if not denial:
        raise HTTPException(status_code=404, detail='Denial not found')

    denial.resolution_status = 'Resolved'
    denial.resolution_date = date.today()
    denial.resolution_notes = resolution_notes
    denial.resolution_strategy = resolution_strategy
    denial.updated_by = current_user.user_id
    denial.updated_at = datetime.utcnow()

    await db.commit()

    return {"message": "Denial resolved successfully"}


# ============================================================================
# CLAIM NOTES
# ============================================================================

@router.post('/claims/{claim_id}/notes')
async def add_claim_note(
    claim_id: uuid.UUID,
    payload: ClaimNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a note to a claim"""

    # Verify claim exists
    claim_query = select(Claim).where(
        Claim.claim_id == claim_id,
        Claim.tenant_id == current_user.tenant_id
    )
    claim_result = await db.execute(claim_query)
    claim = claim_result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail='Claim not found')

    new_note = ClaimNote(
        claim_id=claim_id,
        note_type=payload.note_type,
        note_text=payload.note_text,
        communication_method=payload.communication_method,
        requires_followup=payload.requires_followup,
        followup_date=payload.followup_date,
        created_by=current_user.user_id
    )

    db.add(new_note)
    await db.commit()

    return {"message": "Note added successfully"}


# ============================================================================
# DASHBOARD & METRICS
# ============================================================================

@router.get('/dashboard/metrics', response_model=DashboardMetrics)
async def get_dashboard_metrics(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get claims dashboard metrics"""

    # Default to last 30 days if no dates provided
    if not date_from:
        date_from = date.today() - timedelta(days=30)
    if not date_to:
        date_to = date.today()

    # Build base query
    base_query = select(Claim).where(
        Claim.tenant_id == current_user.tenant_id,
        Claim.service_date_from >= date_from,
        Claim.service_date_from <= date_to
    )

    # Total claims
    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total_claims = total_result.scalar() or 0

    # Claims by status
    pending_result = await db.execute(
        select(func.count()).select_from(base_query.where(Claim.claim_status.in_(['Draft', 'Ready', 'Submitted'])).subquery())
    )
    claims_pending = pending_result.scalar() or 0

    paid_result = await db.execute(
        select(func.count()).select_from(base_query.where(Claim.payment_status == 'Paid').subquery())
    )
    claims_paid = paid_result.scalar() or 0

    denied_result = await db.execute(
        select(func.count()).select_from(base_query.where(Claim.is_denied == True).subquery())
    )
    claims_denied = denied_result.scalar() or 0

    # Financial metrics
    charges_result = await db.execute(
        select(func.sum(Claim.total_charge_amount)).select_from(base_query.subquery())
    )
    total_charges = float(charges_result.scalar() or 0)

    paid_result = await db.execute(
        select(func.sum(Claim.paid_amount)).select_from(base_query.where(Claim.paid_amount.isnot(None)).subquery())
    )
    total_paid = float(paid_result.scalar() or 0)

    # Denial rate
    denial_rate = (claims_denied / total_claims * 100) if total_claims > 0 else 0

    # Average days to payment
    days_query = select(
        func.avg(
            func.extract('day', Claim.payment_date - Claim.submission_date)
        )
    ).select_from(base_query.where(
        Claim.payment_date.isnot(None),
        Claim.submission_date.isnot(None)
    ).subquery())

    days_result = await db.execute(days_query)
    avg_days = days_result.scalar()

    return DashboardMetrics(
        total_claims=total_claims,
        claims_pending=claims_pending,
        claims_paid=claims_paid,
        claims_denied=claims_denied,
        total_charges=total_charges,
        total_paid=total_paid,
        denial_rate=round(denial_rate, 2),
        avg_days_to_payment=round(avg_days, 1) if avg_days else None
    )

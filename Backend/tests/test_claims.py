"""
Claims API Unit Tests
Tests for Phase 8: Medical Coding, Billing, and Claims Management

Tests cover:
- Patient management (CRUD)
- Encounter tracking
- Diagnosis and procedure coding
- Claims submission and tracking
- Denial management
- Dashboard metrics
"""

import pytest
import uuid
from datetime import date, datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from passlib.context import CryptContext

from medical_coding_ai.models.user_models import User
from medical_coding_ai.models.ehr_models import (
    Patient, Encounter, EncounterDiagnosis, EncounterProcedure,
    InsurancePayer, PatientInsurance, Claim, ClaimDenial, ClaimNote
)
from medical_coding_ai.utils.crypto import encrypt, decrypt


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
async def test_patient(db_session: AsyncSession, activated_user):
    """Create a test patient for claims testing"""
    from medical_coding_ai.utils.crypto import encrypt

    patient = Patient(
        patient_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        mrn=f"MRN-{uuid.uuid4().hex[:8].upper()}",
        first_name=encrypt("Test"),
        last_name=encrypt("Patient"),
        date_of_birth=date(1985, 5, 15),
        gender="Male",
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)
    return patient


@pytest.fixture
async def test_insurance_payer(db_session: AsyncSession, activated_user):
    """Create a test insurance payer"""
    payer = InsurancePayer(
        payer_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        payer_name="Test Insurance Co",
        payer_type="Commercial",
        payer_identifier="TEST123",
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(payer)
    await db_session.commit()
    await db_session.refresh(payer)
    return payer


@pytest.fixture
async def test_patient_insurance(db_session: AsyncSession, activated_user, test_patient, test_insurance_payer):
    """Create test patient insurance"""
    insurance = PatientInsurance(
        insurance_id=uuid.uuid4(),
        patient_id=test_patient.patient_id,
        payer_id=test_insurance_payer.payer_id,
        subscriber_id=f"SUB-{uuid.uuid4().hex[:8].upper()}",
        group_number="GRP001",
        plan_name="Test Plan",
        is_primary=True,
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(insurance)
    await db_session.commit()
    await db_session.refresh(insurance)
    return insurance


@pytest.fixture
async def test_encounter(db_session: AsyncSession, activated_user, test_patient, test_patient_insurance):
    """Create a test encounter"""
    encounter = Encounter(
        encounter_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        patient_id=test_patient.patient_id,
        encounter_number=f"ENC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}",
        encounter_type="Office Visit",
        service_date=date.today(),
        rendering_provider_id=activated_user.user_id,
        primary_insurance_id=test_patient_insurance.insurance_id,
        encounter_status="In Progress",
        coding_status="Not Started",
        billing_status="Not Ready",
        created_by=activated_user.user_id
    )
    db_session.add(encounter)
    await db_session.commit()
    await db_session.refresh(encounter)
    return encounter


@pytest.fixture
async def test_claim(db_session: AsyncSession, activated_user, test_patient, test_encounter, test_insurance_payer):
    """Create a test claim"""
    claim = Claim(
        claim_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        claim_number=f"CLM-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}",
        encounter_id=test_encounter.encounter_id,
        patient_id=test_patient.patient_id,
        payer_id=test_insurance_payer.payer_id,
        claim_type="Professional",
        claim_status="Draft",
        payment_status="Pending",
        total_charge_amount=250.00,
        service_date_from=date.today(),
        service_date_to=date.today(),
        is_denied=False,
        created_by=activated_user.user_id
    )
    db_session.add(claim)
    await db_session.commit()
    await db_session.refresh(claim)
    return claim


# ============================================================================
# Patient Endpoint Tests
# ============================================================================


class TestPatientEndpoints:
    """Test patient management endpoints"""

    @pytest.mark.asyncio
    async def test_create_patient(self, client: AsyncClient, auth_headers):
        """Test creating a new patient"""
        patient_data = {
            "mrn": f"MRN-{uuid.uuid4().hex[:8].upper()}",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1980-01-15",
            "gender": "Male",
            "email": "john.doe@example.com",
            "phone_primary": "555-123-4567"
        }

        response = await client.post(
            "/api/claims/patients",
            json=patient_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mrn"] == patient_data["mrn"]
        assert data["first_name"] == patient_data["first_name"]
        assert data["last_name"] == patient_data["last_name"]
        assert data["is_active"] is True
        assert "patient_id" in data

    @pytest.mark.asyncio
    async def test_list_patients(self, client: AsyncClient, auth_headers, test_patient):
        """Test listing patients"""
        response = await client.get(
            "/api/claims/patients",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_patient_by_id(self, client: AsyncClient, auth_headers, test_patient):
        """Test getting a patient by ID"""
        response = await client.get(
            f"/api/claims/patients/{test_patient.patient_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["patient_id"] == str(test_patient.patient_id)

    @pytest.mark.asyncio
    async def test_get_patient_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent patient"""
        fake_id = uuid.uuid4()
        response = await client.get(
            f"/api/claims/patients/{fake_id}",
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_list_patients_with_search(self, client: AsyncClient, auth_headers, test_patient):
        """Test searching patients by MRN"""
        response = await client.get(
            f"/api/claims/patients?search={test_patient.mrn[:5]}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_patients_pagination(self, client: AsyncClient, auth_headers):
        """Test patient listing pagination"""
        response = await client.get(
            "/api/claims/patients?skip=0&limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10


# ============================================================================
# Encounter Endpoint Tests
# ============================================================================


class TestEncounterEndpoints:
    """Test encounter management endpoints"""

    @pytest.mark.asyncio
    async def test_create_encounter(self, client: AsyncClient, auth_headers, test_patient, test_patient_insurance):
        """Test creating a new encounter"""
        encounter_data = {
            "patient_id": str(test_patient.patient_id),
            "encounter_type": "Office Visit",
            "service_date": date.today().isoformat(),
            "primary_insurance_id": str(test_patient_insurance.insurance_id),
            "chief_complaint": "Annual checkup"
        }

        response = await client.post(
            "/api/claims/encounters",
            json=encounter_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["patient_id"] == str(test_patient.patient_id)
        assert data["encounter_type"] == "Office Visit"
        assert data["coding_status"] == "Not Started"
        assert data["billing_status"] == "Not Ready"
        assert "encounter_id" in data
        assert "encounter_number" in data

    @pytest.mark.asyncio
    async def test_create_encounter_patient_not_found(self, client: AsyncClient, auth_headers):
        """Test creating encounter for non-existent patient"""
        encounter_data = {
            "patient_id": str(uuid.uuid4()),
            "encounter_type": "Office Visit",
            "service_date": date.today().isoformat()
        }

        response = await client.post(
            "/api/claims/encounters",
            json=encounter_data,
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "Patient not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_list_encounters(self, client: AsyncClient, auth_headers, test_encounter):
        """Test listing encounters"""
        response = await client.get(
            "/api/claims/encounters",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_encounters_by_patient(self, client: AsyncClient, auth_headers, test_encounter, test_patient):
        """Test listing encounters for a specific patient"""
        response = await client.get(
            f"/api/claims/encounters?patient_id={test_patient.patient_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for enc in data:
            assert enc["patient_id"] == str(test_patient.patient_id)

    @pytest.mark.asyncio
    async def test_list_encounters_by_coding_status(self, client: AsyncClient, auth_headers, test_encounter):
        """Test filtering encounters by coding status"""
        response = await client.get(
            "/api/claims/encounters?coding_status=Not Started",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for enc in data:
            assert enc["coding_status"] == "Not Started"

    @pytest.mark.asyncio
    async def test_list_encounters_date_filter(self, client: AsyncClient, auth_headers, test_encounter):
        """Test filtering encounters by date range"""
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()

        response = await client.get(
            f"/api/claims/encounters?date_from={date_from}&date_to={date_to}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ============================================================================
# Diagnosis & Procedure Tests
# ============================================================================


class TestDiagnosisProcedureEndpoints:
    """Test diagnosis and procedure coding endpoints"""

    @pytest.mark.asyncio
    async def test_add_diagnosis_to_encounter(self, client: AsyncClient, auth_headers, test_encounter):
        """Test adding a diagnosis to an encounter"""
        diagnosis_data = {
            "icd10_code": "J06.9",
            "diagnosis_description": "Acute upper respiratory infection, unspecified",
            "diagnosis_type": "Primary",
            "diagnosis_order": 1,
            "ai_suggested": False
        }

        response = await client.post(
            f"/api/claims/encounters/{test_encounter.encounter_id}/diagnoses",
            json=diagnosis_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["icd10_code"] == "J06.9"
        assert data["diagnosis_type"] == "Primary"
        assert data["diagnosis_order"] == 1
        assert "diagnosis_id" in data

    @pytest.mark.asyncio
    async def test_add_diagnosis_updates_coding_status(
        self,
        client: AsyncClient,
        auth_headers,
        test_encounter,
        db_session: AsyncSession
    ):
        """Test that adding diagnosis updates encounter coding status"""
        diagnosis_data = {
            "icd10_code": "J06.9",
            "diagnosis_description": "Acute upper respiratory infection",
            "diagnosis_type": "Primary",
            "diagnosis_order": 1
        }

        response = await client.post(
            f"/api/claims/encounters/{test_encounter.encounter_id}/diagnoses",
            json=diagnosis_data,
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify encounter coding status updated
        await db_session.refresh(test_encounter)
        assert test_encounter.coding_status == "In Progress"

    @pytest.mark.asyncio
    async def test_add_diagnosis_encounter_not_found(self, client: AsyncClient, auth_headers):
        """Test adding diagnosis to non-existent encounter"""
        diagnosis_data = {
            "icd10_code": "J06.9",
            "diagnosis_description": "Test diagnosis",
            "diagnosis_type": "Primary",
            "diagnosis_order": 1
        }

        response = await client.post(
            f"/api/claims/encounters/{uuid.uuid4()}/diagnoses",
            json=diagnosis_data,
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "Encounter not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_add_procedure_to_encounter(self, client: AsyncClient, auth_headers, test_encounter):
        """Test adding a procedure to an encounter"""
        procedure_data = {
            "procedure_code": "99213",
            "code_type": "CPT",
            "procedure_description": "Office visit, established patient, moderate complexity",
            "procedure_date": date.today().isoformat(),
            "quantity": 1,
            "charge_amount": 150.00,
            "ai_suggested": False
        }

        response = await client.post(
            f"/api/claims/encounters/{test_encounter.encounter_id}/procedures",
            json=procedure_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["procedure_code"] == "99213"
        assert data["code_type"] == "CPT"
        assert data["charge_amount"] == 150.00
        assert "procedure_id" in data

    @pytest.mark.asyncio
    async def test_add_ai_suggested_diagnosis(self, client: AsyncClient, auth_headers, test_encounter):
        """Test adding an AI-suggested diagnosis"""
        diagnosis_data = {
            "icd10_code": "E11.9",
            "diagnosis_description": "Type 2 diabetes mellitus without complications",
            "diagnosis_type": "Secondary",
            "diagnosis_order": 2,
            "ai_suggested": True,
            "ai_confidence_score": 0.92,
            "ai_reasoning": "Based on HbA1c > 6.5% and patient history"
        }

        response = await client.post(
            f"/api/claims/encounters/{test_encounter.encounter_id}/diagnoses",
            json=diagnosis_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["ai_suggested"] is True


# ============================================================================
# Encounter Billing Ready Tests
# ============================================================================


class TestEncounterBillingReady:
    """Test marking encounters as ready for billing"""

    @pytest.mark.asyncio
    async def test_mark_ready_for_billing_without_diagnosis(
        self,
        client: AsyncClient,
        auth_headers,
        test_encounter
    ):
        """Test cannot mark ready without diagnosis"""
        response = await client.put(
            f"/api/claims/encounters/{test_encounter.encounter_id}/mark-ready-for-billing",
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "at least one diagnosis" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_mark_ready_for_billing_without_procedure(
        self,
        client: AsyncClient,
        auth_headers,
        test_encounter,
        db_session: AsyncSession
    ):
        """Test cannot mark ready without procedure"""
        # Add a diagnosis first
        diagnosis = EncounterDiagnosis(
            diagnosis_id=uuid.uuid4(),
            encounter_id=test_encounter.encounter_id,
            icd10_code="J06.9",
            diagnosis_description="Test diagnosis",
            diagnosis_type="Primary",
            diagnosis_order=1
        )
        db_session.add(diagnosis)
        await db_session.commit()

        response = await client.put(
            f"/api/claims/encounters/{test_encounter.encounter_id}/mark-ready-for-billing",
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "at least one procedure" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_mark_ready_for_billing_without_insurance(
        self,
        client: AsyncClient,
        auth_headers,
        test_encounter,
        db_session: AsyncSession
    ):
        """Test cannot mark ready without insurance"""
        # Remove insurance from encounter
        test_encounter.primary_insurance_id = None
        await db_session.commit()

        # Add diagnosis
        diagnosis = EncounterDiagnosis(
            diagnosis_id=uuid.uuid4(),
            encounter_id=test_encounter.encounter_id,
            icd10_code="J06.9",
            diagnosis_description="Test diagnosis",
            diagnosis_type="Primary",
            diagnosis_order=1
        )
        db_session.add(diagnosis)

        # Add procedure
        procedure = EncounterProcedure(
            procedure_id=uuid.uuid4(),
            encounter_id=test_encounter.encounter_id,
            procedure_code="99213",
            code_type="CPT",
            procedure_description="Test procedure",
            procedure_date=date.today(),
            charge_amount=150.00
        )
        db_session.add(procedure)
        await db_session.commit()

        response = await client.put(
            f"/api/claims/encounters/{test_encounter.encounter_id}/mark-ready-for-billing",
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "insurance" in response.json()["detail"].lower()


# ============================================================================
# Claims Endpoint Tests
# ============================================================================


class TestClaimEndpoints:
    """Test claims management endpoints"""

    @pytest.mark.asyncio
    async def test_list_claims(self, client: AsyncClient, auth_headers, test_claim):
        """Test listing claims"""
        response = await client.get(
            "/api/claims/claims",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_claims_by_status(self, client: AsyncClient, auth_headers, test_claim):
        """Test filtering claims by status"""
        response = await client.get(
            "/api/claims/claims?status=Draft",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        for claim in data:
            assert claim["claim_status"] == "Draft"

    @pytest.mark.asyncio
    async def test_list_claims_denied_only(self, client: AsyncClient, auth_headers):
        """Test filtering for denied claims only"""
        response = await client.get(
            "/api/claims/claims?denied_only=true",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        for claim in data:
            assert claim["is_denied"] is True

    @pytest.mark.asyncio
    async def test_get_claim_by_id(self, client: AsyncClient, auth_headers, test_claim):
        """Test getting a claim by ID"""
        response = await client.get(
            f"/api/claims/claims/{test_claim.claim_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["claim_id"] == str(test_claim.claim_id)
        assert data["claim_number"] == test_claim.claim_number

    @pytest.mark.asyncio
    async def test_get_claim_not_found(self, client: AsyncClient, auth_headers):
        """Test getting a non-existent claim"""
        response = await client.get(
            f"/api/claims/claims/{uuid.uuid4()}",
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_submit_claim(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test submitting a claim"""
        # Set claim status to Ready
        test_claim.claim_status = "Ready"
        await db_session.commit()

        response = await client.post(
            f"/api/claims/claims/{test_claim.claim_id}/submit",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "submitted successfully" in data["message"].lower()

        # Verify claim status updated
        await db_session.refresh(test_claim)
        assert test_claim.claim_status == "Submitted"
        assert test_claim.submission_date is not None

    @pytest.mark.asyncio
    async def test_submit_claim_wrong_status(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test cannot submit claim with wrong status"""
        test_claim.claim_status = "Submitted"
        await db_session.commit()

        response = await client.post(
            f"/api/claims/claims/{test_claim.claim_id}/submit",
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "Cannot submit" in response.json()["detail"]


# ============================================================================
# Denial Endpoint Tests
# ============================================================================


class TestDenialEndpoints:
    """Test denial management endpoints"""

    @pytest.mark.asyncio
    async def test_create_denial(self, client: AsyncClient, auth_headers, test_claim):
        """Test creating a denial record"""
        denial_data = {
            "claim_id": str(test_claim.claim_id),
            "denial_date": date.today().isoformat(),
            "denial_type": "Clinical",
            "denial_reason_code": "CO-45",
            "denial_reason_text": "Charges exceed your contracted/legislated fee arrangement.",
            "denied_amount": 100.00,
            "priority": "High"
        }

        response = await client.post(
            "/api/claims/denials",
            json=denial_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["claim_id"] == str(test_claim.claim_id)
        assert data["denial_type"] == "Clinical"
        assert data["denied_amount"] == 100.00
        assert data["resolution_status"] == "Pending"
        assert "denial_id" in data

    @pytest.mark.asyncio
    async def test_create_denial_claim_not_found(self, client: AsyncClient, auth_headers):
        """Test creating denial for non-existent claim"""
        denial_data = {
            "claim_id": str(uuid.uuid4()),
            "denial_date": date.today().isoformat(),
            "denial_type": "Clinical",
            "denial_reason_text": "Test denial",
            "denied_amount": 100.00
        }

        response = await client.post(
            "/api/claims/denials",
            json=denial_data,
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "Claim not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_list_denials(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test listing denials"""
        # Create a denial
        denial = ClaimDenial(
            denial_id=uuid.uuid4(),
            claim_id=test_claim.claim_id,
            denial_date=date.today(),
            denial_type="Clinical",
            denial_reason_text="Test denial",
            denied_amount=100.00,
            resolution_status="Pending",
            priority="High"
        )
        db_session.add(denial)
        await db_session.commit()

        response = await client.get(
            "/api/claims/denials",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_list_denials_by_status(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test filtering denials by status"""
        # Create a denial
        denial = ClaimDenial(
            denial_id=uuid.uuid4(),
            claim_id=test_claim.claim_id,
            denial_date=date.today(),
            denial_type="Clinical",
            denial_reason_text="Test denial",
            denied_amount=100.00,
            resolution_status="Pending",
            priority="High"
        )
        db_session.add(denial)
        await db_session.commit()

        response = await client.get(
            "/api/claims/denials?status=Pending",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert d["resolution_status"] == "Pending"

    @pytest.mark.asyncio
    async def test_list_denials_by_priority(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test filtering denials by priority"""
        # Create a high priority denial
        denial = ClaimDenial(
            denial_id=uuid.uuid4(),
            claim_id=test_claim.claim_id,
            denial_date=date.today(),
            denial_type="Clinical",
            denial_reason_text="Urgent denial",
            denied_amount=500.00,
            resolution_status="Pending",
            priority="High"
        )
        db_session.add(denial)
        await db_session.commit()

        response = await client.get(
            "/api/claims/denials?priority=High",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        for d in data:
            assert d["priority"] == "High"

    @pytest.mark.asyncio
    async def test_assign_denial(self, client: AsyncClient, auth_headers, test_claim, activated_user, db_session: AsyncSession):
        """Test assigning a denial to a user"""
        # Create a denial
        denial = ClaimDenial(
            denial_id=uuid.uuid4(),
            claim_id=test_claim.claim_id,
            denial_date=date.today(),
            denial_type="Clinical",
            denial_reason_text="Test denial",
            denied_amount=100.00,
            resolution_status="Pending",
            priority="High"
        )
        db_session.add(denial)
        await db_session.commit()

        response = await client.put(
            f"/api/claims/denials/{denial.denial_id}/assign?assigned_to={activated_user.user_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert "assigned successfully" in response.json()["message"].lower()

        # Verify assignment
        await db_session.refresh(denial)
        assert denial.assigned_to == activated_user.user_id
        assert denial.assigned_at is not None

    @pytest.mark.asyncio
    async def test_resolve_denial(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test resolving a denial"""
        # Create a denial
        denial = ClaimDenial(
            denial_id=uuid.uuid4(),
            claim_id=test_claim.claim_id,
            denial_date=date.today(),
            denial_type="Clinical",
            denial_reason_text="Test denial",
            denied_amount=100.00,
            resolution_status="Pending",
            priority="High"
        )
        db_session.add(denial)
        await db_session.commit()

        response = await client.put(
            f"/api/claims/denials/{denial.denial_id}/resolve",
            params={
                "resolution_notes": "Submitted corrected claim with updated documentation",
                "resolution_strategy": "Corrected Claim Submission"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        assert "resolved successfully" in response.json()["message"].lower()

        # Verify resolution
        await db_session.refresh(denial)
        assert denial.resolution_status == "Resolved"
        assert denial.resolution_date == date.today()

    @pytest.mark.asyncio
    async def test_resolve_denial_not_found(self, client: AsyncClient, auth_headers):
        """Test resolving a non-existent denial"""
        response = await client.put(
            f"/api/claims/denials/{uuid.uuid4()}/resolve",
            params={
                "resolution_notes": "Test",
                "resolution_strategy": "Test"
            },
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ============================================================================
# Claim Notes Tests
# ============================================================================


class TestClaimNoteEndpoints:
    """Test claim notes endpoints"""

    @pytest.mark.asyncio
    async def test_add_claim_note(self, client: AsyncClient, auth_headers, test_claim):
        """Test adding a note to a claim"""
        note_data = {
            "note_type": "Internal",
            "note_text": "Contacted payer regarding denial. Awaiting response.",
            "communication_method": "Phone",
            "requires_followup": True,
            "followup_date": (date.today() + timedelta(days=3)).isoformat()
        }

        response = await client.post(
            f"/api/claims/claims/{test_claim.claim_id}/notes",
            json=note_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert "added successfully" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_add_claim_note_not_found(self, client: AsyncClient, auth_headers):
        """Test adding note to non-existent claim"""
        note_data = {
            "note_type": "Internal",
            "note_text": "Test note"
        }

        response = await client.post(
            f"/api/claims/claims/{uuid.uuid4()}/notes",
            json=note_data,
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ============================================================================
# Dashboard Metrics Tests
# ============================================================================


class TestDashboardMetrics:
    """Test dashboard metrics endpoint"""

    @pytest.mark.asyncio
    async def test_get_dashboard_metrics(self, client: AsyncClient, auth_headers):
        """Test getting dashboard metrics"""
        response = await client.get(
            "/api/claims/dashboard/metrics",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_claims" in data
        assert "claims_pending" in data
        assert "claims_paid" in data
        assert "claims_denied" in data
        assert "total_charges" in data
        assert "total_paid" in data
        assert "denial_rate" in data

    @pytest.mark.asyncio
    async def test_get_dashboard_metrics_with_date_range(self, client: AsyncClient, auth_headers):
        """Test getting dashboard metrics with date range filter"""
        date_from = (date.today() - timedelta(days=30)).isoformat()
        date_to = date.today().isoformat()

        response = await client.get(
            f"/api/claims/dashboard/metrics?date_from={date_from}&date_to={date_to}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_claims" in data
        assert "denial_rate" in data

    @pytest.mark.asyncio
    async def test_dashboard_metrics_calculations(self, client: AsyncClient, auth_headers, test_claim, db_session: AsyncSession):
        """Test dashboard metrics are calculated correctly"""
        # Create additional claims for metrics
        paid_claim = Claim(
            claim_id=uuid.uuid4(),
            tenant_id=test_claim.tenant_id,
            claim_number=f"CLM-PAID-{uuid.uuid4().hex[:8]}",
            encounter_id=test_claim.encounter_id,
            patient_id=test_claim.patient_id,
            payer_id=test_claim.payer_id,
            claim_type="Professional",
            claim_status="Closed",
            payment_status="Paid",
            total_charge_amount=200.00,
            paid_amount=180.00,
            service_date_from=date.today(),
            is_denied=False
        )
        db_session.add(paid_claim)

        denied_claim = Claim(
            claim_id=uuid.uuid4(),
            tenant_id=test_claim.tenant_id,
            claim_number=f"CLM-DENIED-{uuid.uuid4().hex[:8]}",
            encounter_id=test_claim.encounter_id,
            patient_id=test_claim.patient_id,
            payer_id=test_claim.payer_id,
            claim_type="Professional",
            claim_status="Denied",
            payment_status="Denied",
            total_charge_amount=150.00,
            service_date_from=date.today(),
            is_denied=True
        )
        db_session.add(denied_claim)
        await db_session.commit()

        response = await client.get(
            "/api/claims/dashboard/metrics",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify we have claims counted
        assert data["total_claims"] >= 3  # At least our 3 test claims
        assert data["claims_denied"] >= 1


# ============================================================================
# Authorization Tests
# ============================================================================


class TestClaimsAuthorization:
    """Test authorization for claims endpoints"""

    @pytest.mark.asyncio
    async def test_endpoints_require_authentication(self, client: AsyncClient):
        """Test that claims endpoints require authentication"""
        endpoints = [
            ("GET", "/api/claims/patients"),
            ("GET", "/api/claims/encounters"),
            ("GET", "/api/claims/claims"),
            ("GET", "/api/claims/denials"),
            ("GET", "/api/claims/dashboard/metrics"),
        ]

        for method, endpoint in endpoints:
            if method == "GET":
                response = await client.get(endpoint)
            elif method == "POST":
                response = await client.post(endpoint)

            assert response.status_code == 401, f"Endpoint {endpoint} should require authentication"


# ============================================================================
# Tenant Isolation Tests
# ============================================================================


class TestTenantIsolation:
    """Test tenant isolation in claims"""

    @pytest.mark.asyncio
    async def test_patient_tenant_isolation(self, client: AsyncClient, auth_headers, db_session: AsyncSession):
        """Test that patients from other tenants are not accessible"""
        # Create a patient in a different tenant
        other_tenant_id = uuid.uuid4()
        other_patient = Patient(
            patient_id=uuid.uuid4(),
            tenant_id=other_tenant_id,
            mrn="OTHER-MRN-001",
            first_name=encrypt("Other"),
            last_name=encrypt("Patient"),
            date_of_birth=date(1990, 1, 1),
            is_active=True
        )
        db_session.add(other_patient)
        await db_session.commit()

        # Try to access the patient
        response = await client.get(
            f"/api/claims/patients/{other_patient.patient_id}",
            headers=auth_headers
        )

        # Should not find the patient (tenant isolation)
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_claim_tenant_isolation(self, client: AsyncClient, auth_headers, db_session: AsyncSession):
        """Test that claims from other tenants are not accessible"""
        # Create a claim in a different tenant
        other_tenant_id = uuid.uuid4()
        other_claim = Claim(
            claim_id=uuid.uuid4(),
            tenant_id=other_tenant_id,
            claim_number="OTHER-CLM-001",
            encounter_id=uuid.uuid4(),
            patient_id=uuid.uuid4(),
            payer_id=uuid.uuid4(),
            claim_type="Professional",
            claim_status="Draft",
            payment_status="Pending",
            total_charge_amount=100.00,
            service_date_from=date.today(),
            is_denied=False
        )
        db_session.add(other_claim)
        await db_session.commit()

        # Try to access the claim
        response = await client.get(
            f"/api/claims/claims/{other_claim.claim_id}",
            headers=auth_headers
        )

        # Should not find the claim (tenant isolation)
        assert response.status_code == 404

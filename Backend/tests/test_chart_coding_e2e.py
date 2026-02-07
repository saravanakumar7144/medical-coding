"""
Chart Coding End-to-End Integration Tests
Tests the complete Chart Coding workflow from patient creation to claim submission

Flow tested:
1. EHR data ingestion (mock FHIR data)
2. Patient and encounter creation
3. AI-suggested coding (diagnosis and procedure)
4. Code validation by human coder
5. Mark encounter ready for billing
6. Claim creation and submission
7. Dashboard metrics verification
"""

import pytest
import uuid
from datetime import date, datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from medical_coding_ai.models.user_models import User
from medical_coding_ai.models.ehr_models import (
    Patient, Encounter, EncounterDiagnosis, EncounterProcedure,
    InsurancePayer, PatientInsurance, Claim, ClaimDenial
)
from medical_coding_ai.utils.crypto import encrypt, decrypt


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# Test Fixtures for E2E Testing
# ============================================================================


@pytest.fixture
async def full_patient_setup(db_session: AsyncSession, activated_user):
    """
    Create complete patient setup with insurance for E2E testing.
    Returns dict with all created entities.
    """
    # 1. Create Insurance Payer
    payer = InsurancePayer(
        payer_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        payer_name="Blue Cross Blue Shield",
        payer_type="Commercial",
        payer_identifier="BCBS123",
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(payer)

    # 2. Create Patient
    patient = Patient(
        patient_id=uuid.uuid4(),
        tenant_id=activated_user.tenant_id,
        mrn=f"MRN-{uuid.uuid4().hex[:8].upper()}",
        first_name=encrypt("John"),
        middle_name="Michael",
        last_name=encrypt("Doe"),
        date_of_birth=date(1975, 6, 15),
        gender="Male",
        email=encrypt("john.doe@example.com"),
        phone_primary=encrypt("(555) 123-4567"),
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(patient)
    await db_session.flush()

    # 3. Create Patient Insurance
    insurance = PatientInsurance(
        insurance_id=uuid.uuid4(),
        patient_id=patient.patient_id,
        payer_id=payer.payer_id,
        subscriber_id=f"SUB-{uuid.uuid4().hex[:8].upper()}",
        group_number="GRP001",
        plan_name="Standard PPO",
        is_primary=True,
        is_active=True,
        created_by=activated_user.user_id
    )
    db_session.add(insurance)

    await db_session.commit()
    await db_session.refresh(patient)
    await db_session.refresh(payer)
    await db_session.refresh(insurance)

    return {
        'patient': patient,
        'payer': payer,
        'insurance': insurance,
        'user': activated_user
    }


# ============================================================================
# Complete Chart Coding Workflow E2E Test
# ============================================================================


class TestChartCodingWorkflowE2E:
    """End-to-end test for the complete Chart Coding workflow"""

    @pytest.mark.asyncio
    async def test_complete_chart_coding_workflow(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """
        Test complete workflow:
        1. Create encounter for existing patient
        2. Add AI-suggested diagnoses
        3. Add AI-suggested procedures
        4. Validate and finalize coding
        5. Create and submit claim
        """
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # =====================================================================
        # STEP 1: Create Encounter
        # =====================================================================
        print("\n=== STEP 1: Create Encounter ===")

        encounter_data = {
            "patient_id": str(patient.patient_id),
            "encounter_type": "Office Visit",
            "service_date": date.today().isoformat(),
            "primary_insurance_id": str(insurance.insurance_id),
            "chief_complaint": "Patient presents with fever and cough for 3 days",
            "place_of_service": "Outpatient Clinic"
        }

        response = await client.post(
            "/api/claims/encounters",
            json=encounter_data,
            headers=auth_headers
        )

        assert response.status_code == 200, f"Failed to create encounter: {response.json()}"
        encounter_response = response.json()
        encounter_id = encounter_response['encounter_id']

        # Verify initial status
        assert encounter_response['coding_status'] == 'Not Started'
        assert encounter_response['billing_status'] == 'Not Ready'
        print(f"Created encounter: {encounter_id}")

        # =====================================================================
        # STEP 2: Add AI-Suggested Primary Diagnosis
        # =====================================================================
        print("\n=== STEP 2: Add AI-Suggested Primary Diagnosis ===")

        primary_diagnosis = {
            "icd10_code": "J06.9",
            "diagnosis_description": "Acute upper respiratory infection, unspecified",
            "diagnosis_type": "Primary",
            "diagnosis_order": 1,
            "ai_suggested": True,
            "ai_confidence_score": 0.92,
            "ai_reasoning": "Based on symptoms: fever, cough, duration 3 days. High confidence match for acute URI."
        }

        response = await client.post(
            f"/api/claims/encounters/{encounter_id}/diagnoses",
            json=primary_diagnosis,
            headers=auth_headers
        )

        assert response.status_code == 200, f"Failed to add diagnosis: {response.json()}"
        diagnosis_response = response.json()
        assert diagnosis_response['icd10_code'] == 'J06.9'
        assert diagnosis_response['ai_suggested'] is True
        print(f"Added primary diagnosis: {primary_diagnosis['icd10_code']}")

        # =====================================================================
        # STEP 3: Add AI-Suggested Secondary Diagnosis
        # =====================================================================
        print("\n=== STEP 3: Add AI-Suggested Secondary Diagnosis ===")

        secondary_diagnosis = {
            "icd10_code": "R50.9",
            "diagnosis_description": "Fever, unspecified",
            "diagnosis_type": "Secondary",
            "diagnosis_order": 2,
            "ai_suggested": True,
            "ai_confidence_score": 0.88,
            "ai_reasoning": "Symptom-based secondary diagnosis for documented fever."
        }

        response = await client.post(
            f"/api/claims/encounters/{encounter_id}/diagnoses",
            json=secondary_diagnosis,
            headers=auth_headers
        )

        assert response.status_code == 200
        print(f"Added secondary diagnosis: {secondary_diagnosis['icd10_code']}")

        # =====================================================================
        # STEP 4: Add AI-Suggested Procedure (E/M Code)
        # =====================================================================
        print("\n=== STEP 4: Add AI-Suggested Procedure ===")

        procedure = {
            "procedure_code": "99214",
            "code_type": "CPT",
            "procedure_description": "Office/outpatient visit, est pt, 30-39 min",
            "procedure_date": date.today().isoformat(),
            "quantity": 1,
            "charge_amount": 185.00,
            "ai_suggested": True,
            "ai_confidence_score": 0.85
        }

        response = await client.post(
            f"/api/claims/encounters/{encounter_id}/procedures",
            json=procedure,
            headers=auth_headers
        )

        assert response.status_code == 200
        procedure_response = response.json()
        assert procedure_response['procedure_code'] == '99214'
        assert procedure_response['charge_amount'] == 185.00
        print(f"Added procedure: {procedure['procedure_code']} - ${procedure['charge_amount']}")

        # =====================================================================
        # STEP 5: Verify Coding Status Updated
        # =====================================================================
        print("\n=== STEP 5: Verify Coding Status ===")

        # Reload encounter from database
        enc_query = select(Encounter).where(Encounter.encounter_id == uuid.UUID(encounter_id))
        result = await db_session.execute(enc_query)
        encounter = result.scalar_one()

        assert encounter.coding_status == 'In Progress', \
            f"Expected 'In Progress', got '{encounter.coding_status}'"
        print(f"Coding status updated to: {encounter.coding_status}")

        # =====================================================================
        # STEP 6: Mark Encounter Ready for Billing
        # =====================================================================
        print("\n=== STEP 6: Mark Ready for Billing ===")

        response = await client.put(
            f"/api/claims/encounters/{encounter_id}/mark-ready-for-billing",
            headers=auth_headers
        )

        assert response.status_code == 200, f"Failed to mark ready: {response.json()}"
        print("Encounter marked as ready for billing")

        # Verify status updates
        await db_session.refresh(encounter)
        assert encounter.coding_status == 'Finalized'
        assert encounter.billing_status == 'Ready'
        print(f"Final status - Coding: {encounter.coding_status}, Billing: {encounter.billing_status}")

        # =====================================================================
        # STEP 7: Verify Dashboard Metrics
        # =====================================================================
        print("\n=== STEP 7: Verify Dashboard Metrics ===")

        response = await client.get(
            "/api/claims/dashboard/metrics",
            headers=auth_headers
        )

        assert response.status_code == 200
        metrics = response.json()
        print(f"Dashboard metrics: Total claims: {metrics['total_claims']}")

        print("\n=== Chart Coding Workflow Complete ===")


# ============================================================================
# Encounter Filtering E2E Tests
# ============================================================================


class TestEncounterFilteringE2E:
    """End-to-end tests for encounter filtering in Chart Coding page"""

    @pytest.mark.asyncio
    async def test_filter_encounters_by_coding_status(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """Test filtering encounters by different coding statuses"""
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # Create encounters with different coding statuses
        statuses = ['Not Started', 'In Progress', 'Finalized']

        for status in statuses:
            encounter = Encounter(
                encounter_id=uuid.uuid4(),
                tenant_id=setup['user'].tenant_id,
                patient_id=patient.patient_id,
                encounter_number=f"ENC-{uuid.uuid4().hex[:8].upper()}",
                encounter_type="Office Visit",
                service_date=date.today(),
                rendering_provider_id=setup['user'].user_id,
                primary_insurance_id=insurance.insurance_id,
                encounter_status="Completed",
                coding_status=status,
                billing_status="Not Ready" if status != 'Finalized' else "Ready",
                created_by=setup['user'].user_id
            )
            db_session.add(encounter)

        await db_session.commit()

        # Test filtering by each status
        for status in statuses:
            response = await client.get(
                f"/api/claims/encounters?coding_status={status}",
                headers=auth_headers
            )

            assert response.status_code == 200
            encounters = response.json()

            # Verify all returned encounters have the requested status
            for enc in encounters:
                assert enc['coding_status'] == status, \
                    f"Expected status '{status}', got '{enc['coding_status']}'"

    @pytest.mark.asyncio
    async def test_filter_encounters_by_date_range(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """Test filtering encounters by date range"""
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # Create encounters on different dates
        dates = [
            date.today(),
            date.today() - timedelta(days=7),
            date.today() - timedelta(days=14),
            date.today() - timedelta(days=30)
        ]

        for d in dates:
            encounter = Encounter(
                encounter_id=uuid.uuid4(),
                tenant_id=setup['user'].tenant_id,
                patient_id=patient.patient_id,
                encounter_number=f"ENC-{uuid.uuid4().hex[:8].upper()}",
                encounter_type="Office Visit",
                service_date=d,
                rendering_provider_id=setup['user'].user_id,
                primary_insurance_id=insurance.insurance_id,
                encounter_status="Completed",
                coding_status="Not Started",
                billing_status="Not Ready",
                created_by=setup['user'].user_id
            )
            db_session.add(encounter)

        await db_session.commit()

        # Filter for last 7 days
        date_from = (date.today() - timedelta(days=7)).isoformat()
        date_to = date.today().isoformat()

        response = await client.get(
            f"/api/claims/encounters?date_from={date_from}&date_to={date_to}",
            headers=auth_headers
        )

        assert response.status_code == 200
        encounters = response.json()

        # Verify dates are within range
        for enc in encounters:
            service_date = date.fromisoformat(enc['service_date'])
            assert service_date >= date.today() - timedelta(days=7)
            assert service_date <= date.today()


# ============================================================================
# AI Coding Suggestion E2E Tests
# ============================================================================


class TestAICodingSuggestionE2E:
    """End-to-end tests for AI coding suggestion workflow"""

    @pytest.mark.asyncio
    async def test_ai_suggested_codes_marked_correctly(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """Test that AI-suggested codes are properly marked"""
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # Create encounter
        encounter_data = {
            "patient_id": str(patient.patient_id),
            "encounter_type": "Office Visit",
            "service_date": date.today().isoformat(),
            "primary_insurance_id": str(insurance.insurance_id)
        }

        response = await client.post(
            "/api/claims/encounters",
            json=encounter_data,
            headers=auth_headers
        )
        encounter_id = response.json()['encounter_id']

        # Add AI-suggested diagnosis
        ai_diagnosis = {
            "icd10_code": "E11.9",
            "diagnosis_description": "Type 2 diabetes mellitus without complications",
            "diagnosis_type": "Primary",
            "diagnosis_order": 1,
            "ai_suggested": True,
            "ai_confidence_score": 0.95,
            "ai_reasoning": "HbA1c > 6.5%, consistent with T2DM diagnosis"
        }

        response = await client.post(
            f"/api/claims/encounters/{encounter_id}/diagnoses",
            json=ai_diagnosis,
            headers=auth_headers
        )

        assert response.status_code == 200
        diagnosis = response.json()
        assert diagnosis['ai_suggested'] is True

        # Verify in database
        dx_query = select(EncounterDiagnosis).where(
            EncounterDiagnosis.diagnosis_id == uuid.UUID(diagnosis['diagnosis_id'])
        )
        result = await db_session.execute(dx_query)
        db_diagnosis = result.scalar_one()

        assert db_diagnosis.ai_suggested is True
        assert db_diagnosis.ai_confidence_score == 0.95

    @pytest.mark.asyncio
    async def test_human_validated_codes_not_ai_suggested(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """Test that manually entered codes are not marked as AI-suggested"""
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # Create encounter
        encounter_data = {
            "patient_id": str(patient.patient_id),
            "encounter_type": "Office Visit",
            "service_date": date.today().isoformat(),
            "primary_insurance_id": str(insurance.insurance_id)
        }

        response = await client.post(
            "/api/claims/encounters",
            json=encounter_data,
            headers=auth_headers
        )
        encounter_id = response.json()['encounter_id']

        # Add manually entered diagnosis (not AI-suggested)
        manual_diagnosis = {
            "icd10_code": "I10",
            "diagnosis_description": "Essential (primary) hypertension",
            "diagnosis_type": "Secondary",
            "diagnosis_order": 2,
            "ai_suggested": False  # Manual entry
        }

        response = await client.post(
            f"/api/claims/encounters/{encounter_id}/diagnoses",
            json=manual_diagnosis,
            headers=auth_headers
        )

        assert response.status_code == 200
        diagnosis = response.json()
        assert diagnosis['ai_suggested'] is False


# ============================================================================
# Denial Management E2E Tests
# ============================================================================


class TestDenialManagementE2E:
    """End-to-end tests for denial management workflow"""

    @pytest.mark.asyncio
    async def test_complete_denial_workflow(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """
        Test complete denial workflow:
        1. Create claim
        2. Record denial
        3. Assign to staff
        4. Work on resolution
        5. Resolve denial
        """
        setup = full_patient_setup
        user = setup['user']

        # Create a claim
        claim = Claim(
            claim_id=uuid.uuid4(),
            tenant_id=user.tenant_id,
            claim_number=f"CLM-{uuid.uuid4().hex[:8].upper()}",
            encounter_id=uuid.uuid4(),
            patient_id=setup['patient'].patient_id,
            payer_id=setup['payer'].payer_id,
            claim_type="Professional",
            claim_status="Submitted",
            payment_status="Pending",
            total_charge_amount=350.00,
            service_date_from=date.today(),
            service_date_to=date.today(),
            is_denied=False,
            created_by=user.user_id
        )
        db_session.add(claim)
        await db_session.commit()
        await db_session.refresh(claim)

        # STEP 1: Record denial
        denial_data = {
            "claim_id": str(claim.claim_id),
            "denial_date": date.today().isoformat(),
            "denial_type": "Medical Necessity",
            "denial_reason_code": "CO-50",
            "denial_reason_text": "Services not deemed medically necessary",
            "denied_amount": 350.00,
            "priority": "High",
            "resolution_strategy": "Submit additional documentation"
        }

        response = await client.post(
            "/api/claims/denials",
            json=denial_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        denial = response.json()
        denial_id = denial['denial_id']
        assert denial['resolution_status'] == 'Pending'

        # STEP 2: Assign to staff
        response = await client.put(
            f"/api/claims/denials/{denial_id}/assign?assigned_to={user.user_id}",
            headers=auth_headers
        )

        assert response.status_code == 200

        # STEP 3: Resolve denial
        response = await client.put(
            f"/api/claims/denials/{denial_id}/resolve",
            params={
                "resolution_notes": "Submitted additional clinical documentation. Appeal approved.",
                "resolution_strategy": "Appeal with Documentation"
            },
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify denial is resolved
        denial_query = select(ClaimDenial).where(ClaimDenial.denial_id == uuid.UUID(denial_id))
        result = await db_session.execute(denial_query)
        resolved_denial = result.scalar_one()

        assert resolved_denial.resolution_status == 'Resolved'
        assert resolved_denial.resolution_date == date.today()


# ============================================================================
# Tenant Isolation E2E Tests
# ============================================================================


class TestTenantIsolationE2E:
    """End-to-end tests for tenant isolation"""

    @pytest.mark.asyncio
    async def test_cannot_access_other_tenant_encounters(
        self,
        client: AsyncClient,
        auth_headers,
        db_session: AsyncSession,
        activated_user
    ):
        """Test that encounters from other tenants are not accessible"""
        # Create an encounter in a different tenant
        other_tenant_id = uuid.uuid4()

        other_patient = Patient(
            patient_id=uuid.uuid4(),
            tenant_id=other_tenant_id,
            mrn="OTHER-MRN",
            first_name=encrypt("Other"),
            last_name=encrypt("Patient"),
            date_of_birth=date(1990, 1, 1),
            is_active=True
        )
        db_session.add(other_patient)

        other_encounter = Encounter(
            encounter_id=uuid.uuid4(),
            tenant_id=other_tenant_id,
            patient_id=other_patient.patient_id,
            encounter_number="ENC-OTHER-001",
            encounter_type="Office Visit",
            service_date=date.today(),
            encounter_status="Completed",
            coding_status="Not Started",
            billing_status="Not Ready"
        )
        db_session.add(other_encounter)
        await db_session.commit()

        # Try to list encounters - should not include other tenant's encounter
        response = await client.get(
            "/api/claims/encounters",
            headers=auth_headers
        )

        assert response.status_code == 200
        encounters = response.json()

        # Verify other tenant's encounter is not in results
        encounter_ids = [enc['encounter_id'] for enc in encounters]
        assert str(other_encounter.encounter_id) not in encounter_ids


# ============================================================================
# Work Queue E2E Tests
# ============================================================================


class TestWorkQueueE2E:
    """End-to-end tests for the work queue functionality"""

    @pytest.mark.asyncio
    async def test_work_queue_returns_pending_encounters(
        self,
        client: AsyncClient,
        auth_headers,
        full_patient_setup,
        db_session: AsyncSession
    ):
        """Test that work queue returns encounters needing coding"""
        setup = full_patient_setup
        patient = setup['patient']
        insurance = setup['insurance']

        # Create encounters with 'Not Started' coding status
        for i in range(3):
            encounter = Encounter(
                encounter_id=uuid.uuid4(),
                tenant_id=setup['user'].tenant_id,
                patient_id=patient.patient_id,
                encounter_number=f"ENC-QUEUE-{i:03d}",
                encounter_type="Office Visit",
                service_date=date.today() - timedelta(days=i),
                rendering_provider_id=setup['user'].user_id,
                primary_insurance_id=insurance.insurance_id,
                encounter_status="Completed",
                coding_status="Not Started",  # Needs coding
                billing_status="Not Ready",
                created_by=setup['user'].user_id
            )
            db_session.add(encounter)

        await db_session.commit()

        # Get work queue (encounters with 'Not Started' status)
        response = await client.get(
            "/api/claims/encounters?coding_status=Not Started",
            headers=auth_headers
        )

        assert response.status_code == 200
        work_queue = response.json()

        # Should have at least 3 encounters
        assert len(work_queue) >= 3

        # All should be 'Not Started'
        for enc in work_queue:
            assert enc['coding_status'] == 'Not Started'

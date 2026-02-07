"""
EHR Poller Unit Tests
Tests for Phase 8: EHR Integration Pollers

Tests cover:
- Base Poller functionality
- Epic Poller implementation
- Mock FHIR data generation
- FHIR to canonical transformations
- Scheduler management
- Sync cycle operations
- Metrics tracking
"""

import pytest
import uuid
import json
from datetime import datetime, date, timedelta
from typing import Dict, List, Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

from pollers.base_poller import BasePoller
from pollers.epic.epic_poller import EpicPoller
from pollers.epic.mappers import EpicMappers
from pollers.scheduler import (
    get_scheduler,
    start_pollers,
    stop_pollers,
    add_poller,
    remove_poller,
    get_poller_status,
    active_pollers
)


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def epic_config():
    """Epic poller configuration for testing"""
    return {
        'base_url': 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
        'client_id': 'test-client-id',
        'private_key': None,
        'poll_interval_seconds': 30,
        'use_mock_data': True
    }


@pytest.fixture
def epic_poller(epic_config):
    """Create an Epic poller instance for testing"""
    return EpicPoller(
        connection_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        config=epic_config,
        db_session_factory=None
    )


@pytest.fixture
def mock_fhir_patient():
    """Mock FHIR Patient resource"""
    return {
        "resourceType": "Patient",
        "id": "epic-patient-12345",
        "meta": {
            "versionId": "1",
            "lastUpdated": "2024-12-27T10:30:00.000Z",
            "source": "epic"
        },
        "identifier": [
            {
                "use": "usual",
                "type": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]
                },
                "system": "urn:oid:2.16.840.1.113883.19.5",
                "value": "MRN-001234"
            }
        ],
        "active": True,
        "name": [
            {
                "use": "official",
                "family": "Smith",
                "given": ["John", "Michael"]
            }
        ],
        "telecom": [
            {"system": "phone", "value": "(555) 555-1234", "use": "home"},
            {"system": "email", "value": "john.smith@example.com"}
        ],
        "gender": "male",
        "birthDate": "1985-03-15",
        "address": [
            {
                "use": "home",
                "line": ["123 Main Street"],
                "city": "Springfield",
                "state": "IL",
                "postalCode": "62701"
            }
        ]
    }


@pytest.fixture
def mock_fhir_encounter():
    """Mock FHIR Encounter resource"""
    return {
        "resourceType": "Encounter",
        "id": "epic-encounter-67890",
        "meta": {
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        },
        "identifier": [
            {
                "system": "urn:oid:1.2.36.146.595.217.0.1",
                "value": "ENC123456"
            }
        ],
        "status": "finished",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        },
        "subject": {
            "reference": "Patient/epic-patient-12345"
        },
        "period": {
            "start": f"{date.today()}T08:00:00Z",
            "end": f"{date.today()}T09:30:00Z"
        },
        "reasonCode": [
            {
                "coding": [{"system": "http://snomed.info/sct", "code": "386661006", "display": "Fever"}]
            }
        ]
    }


@pytest.fixture
def mock_fhir_condition():
    """Mock FHIR Condition resource"""
    return {
        "resourceType": "Condition",
        "id": "epic-condition-11111",
        "meta": {
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        },
        "clinicalStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
        },
        "verificationStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "confirmed"}]
        },
        "category": [
            {
                "coding": [
                    {"system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "encounter-diagnosis"}
                ]
            }
        ],
        "code": {
            "coding": [
                {"system": "http://hl7.org/fhir/sid/icd-10-cm", "code": "J06.9", "display": "Acute URI"}
            ],
            "text": "Acute upper respiratory infection, unspecified"
        },
        "encounter": {
            "reference": "Encounter/epic-encounter-67890"
        },
        "recordedDate": datetime.utcnow().isoformat() + "Z"
    }


@pytest.fixture
def mock_fhir_procedure():
    """Mock FHIR Procedure resource"""
    return {
        "resourceType": "Procedure",
        "id": "epic-procedure-22222",
        "meta": {
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        },
        "status": "completed",
        "code": {
            "coding": [
                {"system": "http://www.ama-assn.org/go/cpt", "code": "99213", "display": "Office visit, est pt"}
            ],
            "text": "Office/outpatient visit, established patient"
        },
        "encounter": {
            "reference": "Encounter/epic-encounter-67890"
        },
        "performedDateTime": f"{date.today()}T10:00:00Z"
    }


# ============================================================================
# Epic Poller Initialization Tests
# ============================================================================


class TestEpicPollerInitialization:
    """Test Epic poller initialization and configuration"""

    def test_poller_initialization(self, epic_config):
        """Test poller initializes correctly"""
        connection_id = uuid.uuid4()
        tenant_id = uuid.uuid4()

        poller = EpicPoller(
            connection_id=connection_id,
            tenant_id=tenant_id,
            config=epic_config,
            db_session_factory=None
        )

        assert poller.connection_id == connection_id
        assert poller.tenant_id == tenant_id
        assert poller.poll_interval == 30
        assert poller.use_mock_data is True
        assert poller.EHR_TYPE == 'epic'

    def test_poller_default_config(self):
        """Test poller with minimal config uses defaults"""
        poller = EpicPoller(
            connection_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            config={},
            db_session_factory=None
        )

        assert poller.poll_interval == 30  # Default
        assert poller.use_mock_data is True  # Default

    def test_poller_initial_metrics(self, epic_poller):
        """Test poller has zero metrics on initialization"""
        assert epic_poller.metrics['total_syncs'] == 0
        assert epic_poller.metrics['successful_syncs'] == 0
        assert epic_poller.metrics['failed_syncs'] == 0
        assert epic_poller.metrics['records_processed'] == 0
        assert epic_poller.metrics['last_error'] is None

    def test_poller_not_running_initially(self, epic_poller):
        """Test poller is not running on initialization"""
        assert epic_poller.is_running is False


# ============================================================================
# Epic Poller Lifecycle Tests
# ============================================================================


class TestEpicPollerLifecycle:
    """Test poller start/stop lifecycle"""

    def test_start_poller(self, epic_poller):
        """Test starting the poller"""
        epic_poller.start()
        assert epic_poller.is_running is True

    def test_stop_poller(self, epic_poller):
        """Test stopping the poller"""
        epic_poller.start()
        epic_poller.stop()
        assert epic_poller.is_running is False

    def test_get_status(self, epic_poller):
        """Test getting poller status"""
        epic_poller.start()
        status = epic_poller.get_status()

        assert 'connection_id' in status
        assert 'tenant_id' in status
        assert 'is_running' in status
        assert status['is_running'] is True
        assert 'metrics' in status
        assert 'use_mock_data' in status
        assert status['use_mock_data'] is True


# ============================================================================
# Epic Authentication Tests
# ============================================================================


class TestEpicAuthentication:
    """Test Epic authentication"""

    @pytest.mark.asyncio
    async def test_mock_authentication(self, epic_poller):
        """Test mock authentication returns fake token"""
        token = await epic_poller.authenticate()
        assert token == "mock-epic-access-token"

    @pytest.mark.asyncio
    async def test_ensure_authenticated(self, epic_poller):
        """Test _ensure_authenticated gets token"""
        await epic_poller._ensure_authenticated()
        assert epic_poller._access_token is not None


# ============================================================================
# Mock Data Generation Tests
# ============================================================================


class TestMockDataGeneration:
    """Test mock FHIR data generation"""

    def test_generate_mock_patients(self, epic_poller):
        """Test mock patient generation"""
        patients = epic_poller._generate_mock_patients()

        assert isinstance(patients, list)
        assert len(patients) >= 3  # Generates 3-7 patients
        assert len(patients) <= 7

        for patient in patients:
            assert patient['resourceType'] == 'Patient'
            assert 'id' in patient
            assert 'identifier' in patient
            assert 'name' in patient
            assert 'gender' in patient
            assert 'birthDate' in patient

    def test_generate_mock_encounters(self, epic_poller):
        """Test mock encounter generation"""
        patient_ids = ['patient-1', 'patient-2']
        encounters = epic_poller._generate_mock_encounters(patient_ids)

        assert isinstance(encounters, list)
        assert len(encounters) >= 2  # At least 1 per patient

        for encounter in encounters:
            assert encounter['resourceType'] == 'Encounter'
            assert 'id' in encounter
            assert 'status' in encounter
            assert 'class' in encounter
            assert 'subject' in encounter

    def test_generate_mock_conditions(self, epic_poller):
        """Test mock condition generation with ICD-10 codes"""
        encounter_ids = ['enc-1', 'enc-2']
        conditions = epic_poller._generate_mock_conditions(encounter_ids)

        assert isinstance(conditions, list)
        assert len(conditions) >= 2  # At least 1 per encounter

        for condition in conditions:
            assert condition['resourceType'] == 'Condition'
            assert 'id' in condition
            assert 'code' in condition
            assert 'coding' in condition['code']
            # Verify ICD-10 system
            coding = condition['code']['coding'][0]
            assert coding['system'] == 'http://hl7.org/fhir/sid/icd-10-cm'
            assert coding['code']  # Has a code

    def test_generate_mock_procedures(self, epic_poller):
        """Test mock procedure generation with CPT codes"""
        encounter_ids = ['enc-1', 'enc-2']
        procedures = epic_poller._generate_mock_procedures(encounter_ids)

        assert isinstance(procedures, list)
        assert len(procedures) >= 2

        for procedure in procedures:
            assert procedure['resourceType'] == 'Procedure'
            assert 'id' in procedure
            assert procedure['status'] == 'completed'
            assert 'code' in procedure
            # Verify CPT system
            coding = procedure['code']['coding'][0]
            assert coding['system'] == 'http://www.ama-assn.org/go/cpt'

    def test_mock_patient_gender_name_consistency(self, epic_poller):
        """Test mock patients have gender-appropriate names"""
        # Generate many patients to test both genders
        for _ in range(5):
            patients = epic_poller._generate_mock_patients()
            for patient in patients:
                gender = patient['gender']
                name = patient['name'][0]
                first_name = name['given'][0]

                # Male names
                male_names = ['John', 'Michael', 'David', 'Robert', 'William', 'James', 'Christopher', 'Daniel', 'Matthew', 'Anthony']
                # Female names
                female_names = ['Jane', 'Sarah', 'Emily', 'Jessica', 'Ashley', 'Jennifer', 'Amanda', 'Lisa', 'Michelle', 'Elizabeth']

                if gender == 'male':
                    assert first_name in male_names, f"Male patient has female name: {first_name}"
                else:
                    assert first_name in female_names, f"Female patient has male name: {first_name}"


# ============================================================================
# FHIR Data Fetching Tests
# ============================================================================


class TestFHIRDataFetching:
    """Test FHIR data fetching methods"""

    @pytest.mark.asyncio
    async def test_fetch_patients_mock(self, epic_poller):
        """Test fetching patients with mock data"""
        patients = await epic_poller.fetch_patients()

        assert isinstance(patients, list)
        assert len(patients) > 0

        for patient in patients:
            assert patient['resourceType'] == 'Patient'

    @pytest.mark.asyncio
    async def test_fetch_encounters_mock(self, epic_poller):
        """Test fetching encounters with mock data"""
        patient_ids = ['patient-1', 'patient-2']
        encounters = await epic_poller.fetch_encounters(patient_ids=patient_ids)

        assert isinstance(encounters, list)
        assert len(encounters) > 0

    @pytest.mark.asyncio
    async def test_fetch_conditions_mock(self, epic_poller):
        """Test fetching conditions with mock data"""
        encounter_ids = ['enc-1']
        conditions = await epic_poller.fetch_conditions(encounter_ids=encounter_ids)

        assert isinstance(conditions, list)
        assert len(conditions) > 0

    @pytest.mark.asyncio
    async def test_fetch_procedures_mock(self, epic_poller):
        """Test fetching procedures with mock data"""
        encounter_ids = ['enc-1']
        procedures = await epic_poller.fetch_procedures(encounter_ids=encounter_ids)

        assert isinstance(procedures, list)
        assert len(procedures) > 0


# ============================================================================
# FHIR Transformation Tests
# ============================================================================


class TestFHIRTransformations:
    """Test FHIR to canonical transformations"""

    def test_transform_patient(self, epic_poller, mock_fhir_patient):
        """Test patient transformation"""
        canonical = epic_poller.transform_patient(mock_fhir_patient)

        assert 'fhir_id' in canonical
        assert canonical['fhir_id'] == 'epic-patient-12345'
        assert 'source_ehr' in canonical
        assert canonical['source_ehr'] == 'epic'
        assert 'mrn' in canonical

    def test_transform_encounter(self, epic_poller, mock_fhir_encounter):
        """Test encounter transformation"""
        canonical = epic_poller.transform_encounter(mock_fhir_encounter)

        assert 'fhir_id' in canonical
        assert canonical['fhir_id'] == 'epic-encounter-67890'
        assert 'source_ehr' in canonical
        assert 'encounter_status' in canonical

    def test_transform_condition(self, epic_poller, mock_fhir_condition):
        """Test condition transformation"""
        canonical = epic_poller.transform_condition(mock_fhir_condition)

        assert 'fhir_id' in canonical
        assert 'source_ehr' in canonical
        assert 'icd10_code' in canonical
        assert canonical['icd10_code'] == 'J06.9'

    def test_transform_procedure(self, epic_poller, mock_fhir_procedure):
        """Test procedure transformation"""
        canonical = epic_poller.transform_procedure(mock_fhir_procedure)

        assert 'fhir_id' in canonical
        assert 'source_ehr' in canonical
        assert 'procedure_code' in canonical
        assert canonical['procedure_code'] == '99213'


# ============================================================================
# Epic Mappers Tests
# ============================================================================


class TestEpicMappers:
    """Test Epic FHIR mappers"""

    @pytest.fixture
    def mappers(self):
        return EpicMappers()

    def test_map_patient_extracts_mrn(self, mappers, mock_fhir_patient):
        """Test MRN extraction from patient identifiers"""
        result = mappers.map_patient(mock_fhir_patient, 'epic')
        assert result['mrn'] == 'MRN-001234'

    def test_map_patient_extracts_name(self, mappers, mock_fhir_patient):
        """Test name extraction from patient"""
        result = mappers.map_patient(mock_fhir_patient, 'epic')
        assert result['first_name'] == 'John'
        assert result['last_name'] == 'Smith'

    def test_map_patient_extracts_demographics(self, mappers, mock_fhir_patient):
        """Test demographic extraction - FHIR 'male' transforms to 'M' for database"""
        result = mappers.map_patient(mock_fhir_patient, 'epic')
        assert result['gender'] == 'M'  # Mapper transforms 'male' -> 'M'
        # date_of_birth is returned as date object, not string
        from datetime import date
        assert result['date_of_birth'] == date(1985, 3, 15)

    def test_map_patient_extracts_address(self, mappers, mock_fhir_patient):
        """Test address extraction"""
        result = mappers.map_patient(mock_fhir_patient, 'epic')
        assert result['city'] == 'Springfield'
        assert result['state'] == 'IL'
        assert result['zip_code'] == '62701'

    def test_map_encounter_extracts_status(self, mappers, mock_fhir_encounter):
        """Test encounter status extraction - FHIR 'finished' transforms to 'Completed'"""
        result = mappers.map_encounter(mock_fhir_encounter, 'epic')
        assert result['encounter_status'] == 'Completed'  # Mapper transforms 'finished' -> 'Completed'

    def test_map_encounter_extracts_type(self, mappers, mock_fhir_encounter):
        """Test encounter type extraction - FHIR class 'AMB' maps to 'Office Visit'"""
        result = mappers.map_encounter(mock_fhir_encounter, 'epic')
        assert result['encounter_type'] == 'Office Visit'  # Mapper transforms 'AMB' -> 'Office Visit'

    def test_map_encounter_extracts_patient_reference(self, mappers, mock_fhir_encounter):
        """Test patient reference extraction"""
        result = mappers.map_encounter(mock_fhir_encounter, 'epic')
        assert result['patient_fhir_id'] == 'epic-patient-12345'

    def test_map_condition_extracts_icd10(self, mappers, mock_fhir_condition):
        """Test ICD-10 code extraction"""
        result = mappers.map_condition(mock_fhir_condition, 'epic')
        assert result['icd10_code'] == 'J06.9'
        assert 'Acute' in result['diagnosis_description']

    def test_map_condition_extracts_encounter_reference(self, mappers, mock_fhir_condition):
        """Test encounter reference extraction from condition"""
        result = mappers.map_condition(mock_fhir_condition, 'epic')
        assert result['encounter_fhir_id'] == 'epic-encounter-67890'

    def test_map_procedure_extracts_cpt(self, mappers, mock_fhir_procedure):
        """Test CPT code extraction"""
        result = mappers.map_procedure(mock_fhir_procedure, 'epic')
        assert result['procedure_code'] == '99213'

    def test_map_procedure_extracts_code_type(self, mappers, mock_fhir_procedure):
        """Test procedure code type extraction - verifies CPT code type is identified"""
        result = mappers.map_procedure(mock_fhir_procedure, 'epic')
        assert result['code_type'] == 'CPT'
        assert result['source_ehr'] == 'epic'


# ============================================================================
# Sync Cycle Tests
# ============================================================================


class TestSyncCycle:
    """Test sync cycle operations"""

    @pytest.mark.asyncio
    async def test_sync_cycle_increments_metrics(self, epic_poller):
        """Test sync cycle increments metrics"""
        initial_syncs = epic_poller.metrics['total_syncs']

        await epic_poller.sync_cycle()

        assert epic_poller.metrics['total_syncs'] == initial_syncs + 1
        assert epic_poller.metrics['successful_syncs'] >= 1
        assert epic_poller.metrics['records_processed'] >= 0

    @pytest.mark.asyncio
    async def test_sync_cycle_processes_records(self, epic_poller):
        """Test sync cycle processes records"""
        await epic_poller.sync_cycle()

        # Should have processed at least patients
        assert epic_poller.metrics['records_processed'] > 0

    @pytest.mark.asyncio
    async def test_sync_cycle_updates_duration(self, epic_poller):
        """Test sync cycle updates duration metric"""
        await epic_poller.sync_cycle()

        assert epic_poller.metrics['last_sync_duration_ms'] > 0


# ============================================================================
# Scheduler Tests
# ============================================================================


class TestScheduler:
    """Test scheduler functionality"""

    def test_get_scheduler(self):
        """Test getting scheduler instance"""
        sched = get_scheduler()
        assert sched is not None

    def test_get_scheduler_singleton(self):
        """Test scheduler is a singleton"""
        sched1 = get_scheduler()
        sched2 = get_scheduler()
        assert sched1 is sched2

    def test_get_poller_status_empty(self):
        """Test getting status with no pollers"""
        status = get_poller_status()
        assert 'active_pollers' in status

    def test_get_poller_status_not_found(self):
        """Test getting status for non-existent poller"""
        status = get_poller_status(uuid.uuid4())
        assert 'error' in status
        assert status['error'] == 'Poller not found'


# ============================================================================
# Error Handling Tests
# ============================================================================


class TestErrorHandling:
    """Test error handling in pollers"""

    @pytest.mark.asyncio
    async def test_sync_cycle_handles_errors(self, epic_poller):
        """Test sync cycle handles errors gracefully"""
        # Mock an error during sync
        original_fetch = epic_poller.fetch_patients

        async def failing_fetch(*args, **kwargs):
            raise Exception("Test error")

        epic_poller.fetch_patients = failing_fetch

        # Should not raise, but record the error
        await epic_poller.sync_cycle()

        assert epic_poller.metrics['failed_syncs'] == 1
        assert epic_poller.metrics['last_error'] == "Test error"

        # Restore original method
        epic_poller.fetch_patients = original_fetch

    def test_poller_handles_missing_config(self):
        """Test poller handles missing config values"""
        # Should not raise with empty config
        poller = EpicPoller(
            connection_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            config={},
            db_session_factory=None
        )
        assert poller is not None


# ============================================================================
# Integration Tests
# ============================================================================


class TestPollerIntegration:
    """Integration tests for pollers"""

    @pytest.mark.asyncio
    async def test_full_sync_cycle_flow(self, epic_poller):
        """Test complete sync cycle flow"""
        # Start poller
        epic_poller.start()
        assert epic_poller.is_running is True

        # Run sync cycle
        await epic_poller.sync_cycle()

        # Verify metrics
        status = epic_poller.get_status()
        assert status['metrics']['total_syncs'] == 1
        assert status['metrics']['successful_syncs'] == 1
        assert status['metrics']['records_processed'] > 0

        # Stop poller
        epic_poller.stop()
        assert epic_poller.is_running is False

    @pytest.mark.asyncio
    async def test_multiple_sync_cycles(self, epic_poller):
        """Test multiple consecutive sync cycles"""
        for i in range(3):
            await epic_poller.sync_cycle()

        assert epic_poller.metrics['total_syncs'] == 3
        assert epic_poller.metrics['successful_syncs'] == 3


# ============================================================================
# FHIR Fixtures Tests
# ============================================================================


class TestFHIRFixtures:
    """Test loading FHIR fixtures from files"""

    def test_load_patient_fixture(self):
        """Test loading mock patient from fixture file"""
        import os
        import json

        fixture_path = os.path.join(
            os.path.dirname(__file__),
            'fixtures',
            'mock_fhir_patient.json'
        )

        if os.path.exists(fixture_path):
            with open(fixture_path) as f:
                patient = json.load(f)

            assert patient['resourceType'] == 'Patient'
            assert patient['id'] == 'epic-patient-12345'
            assert patient['name'][0]['family'] == 'Smith'

    def test_load_encounter_fixture(self):
        """Test loading mock encounter from fixture file"""
        import os
        import json

        fixture_path = os.path.join(
            os.path.dirname(__file__),
            'fixtures',
            'mock_fhir_encounter.json'
        )

        if os.path.exists(fixture_path):
            with open(fixture_path) as f:
                encounter = json.load(f)

            assert encounter['resourceType'] == 'Encounter'

    def test_load_condition_fixture(self):
        """Test loading mock condition from fixture file"""
        import os
        import json

        fixture_path = os.path.join(
            os.path.dirname(__file__),
            'fixtures',
            'mock_fhir_condition.json'
        )

        if os.path.exists(fixture_path):
            with open(fixture_path) as f:
                condition = json.load(f)

            assert condition['resourceType'] == 'Condition'

    def test_load_procedure_fixture(self):
        """Test loading mock procedure from fixture file"""
        import os
        import json

        fixture_path = os.path.join(
            os.path.dirname(__file__),
            'fixtures',
            'mock_fhir_procedure.json'
        )

        if os.path.exists(fixture_path):
            with open(fixture_path) as f:
                procedure = json.load(f)

            assert procedure['resourceType'] == 'Procedure'


# ============================================================================
# Validation Tests
# ============================================================================


class TestFHIRValidation:
    """Test FHIR resource validation"""

    def test_patient_has_required_fields(self, mock_fhir_patient):
        """Test patient has all required FHIR fields"""
        required_fields = ['resourceType', 'id', 'identifier', 'name', 'gender', 'birthDate']

        for field in required_fields:
            assert field in mock_fhir_patient, f"Missing required field: {field}"

    def test_encounter_has_required_fields(self, mock_fhir_encounter):
        """Test encounter has all required FHIR fields"""
        required_fields = ['resourceType', 'id', 'status', 'class', 'subject']

        for field in required_fields:
            assert field in mock_fhir_encounter, f"Missing required field: {field}"

    def test_condition_has_required_fields(self, mock_fhir_condition):
        """Test condition has all required FHIR fields"""
        required_fields = ['resourceType', 'id', 'code', 'clinicalStatus']

        for field in required_fields:
            assert field in mock_fhir_condition, f"Missing required field: {field}"

    def test_procedure_has_required_fields(self, mock_fhir_procedure):
        """Test procedure has all required FHIR fields"""
        required_fields = ['resourceType', 'id', 'status', 'code']

        for field in required_fields:
            assert field in mock_fhir_procedure, f"Missing required field: {field}"

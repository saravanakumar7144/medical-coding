"""
Epic FHIR Poller Implementation

Fetches patient data from Epic FHIR R4 API every 30 seconds.
Stores data in Panaceon database with team_id isolation.

Supports:
- Mock FHIR data for testing (no real Epic connection needed)
- Real Epic Backend Services JWT authentication
- Incremental sync using _lastUpdated parameter
"""

import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
import random

from ..base_poller import BasePoller
from .auth import EpicAuth
from .client import EpicClient
from .mappers import EpicMappers

logger = logging.getLogger(__name__)


class EpicPoller(BasePoller):
    """
    Epic FHIR R4 Poller

    Implements the BasePoller interface for Epic Systems EHRs.
    Uses Backend Services JWT authentication for server-to-server access.
    """

    # EHR type identifier
    EHR_TYPE = 'epic'

    def __init__(self, connection_id: UUID, tenant_id: UUID, config: Dict[str, Any], db_session_factory=None):
        super().__init__(connection_id, tenant_id, config, db_session_factory)

        # Epic-specific configuration
        self.auth = EpicAuth(
            base_url=config.get('base_url'),
            client_id=config.get('client_id'),
            private_key=config.get('private_key'),
        )
        self.client = EpicClient(
            base_url=config.get('base_url'),
        )
        self.mappers = EpicMappers()

    # =========================================================================
    # AUTHENTICATION
    # =========================================================================

    async def authenticate(self) -> str:
        """
        Authenticate with Epic using Backend Services JWT.

        For mock mode, returns a fake token.
        For real mode, generates JWT and exchanges for access token.
        """
        if self.use_mock_data:
            logger.info("Using mock authentication for Epic")
            return "mock-epic-access-token"

        try:
            token = await self.auth.get_access_token()
            logger.info("Successfully authenticated with Epic")
            return token
        except Exception as e:
            logger.error(f"Epic authentication failed: {e}")
            raise

    # =========================================================================
    # DATA FETCHING
    # =========================================================================

    async def fetch_patients(self, last_sync: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch patients from Epic FHIR API.

        Uses _lastUpdated parameter for incremental sync.
        """
        if self.use_mock_data:
            return self._generate_mock_patients()

        try:
            params = {'_count': '100'}
            if last_sync:
                params['_lastUpdated'] = f'ge{last_sync.isoformat()}'

            response = await self.client.get('/Patient', params=params, token=self._access_token)
            entries = response.get('entry', [])
            return [entry.get('resource', {}) for entry in entries]
        except Exception as e:
            logger.error(f"Failed to fetch patients: {e}")
            raise

    async def fetch_encounters(
        self,
        patient_ids: Optional[List[str]] = None,
        last_sync: Optional[datetime] = None
    ) -> List[Dict]:
        """Fetch encounters from Epic FHIR API."""
        if self.use_mock_data:
            return self._generate_mock_encounters(patient_ids or [])

        try:
            params = {'_count': '100'}
            if patient_ids:
                params['patient'] = ','.join(patient_ids)
            if last_sync:
                params['_lastUpdated'] = f'ge{last_sync.isoformat()}'

            response = await self.client.get('/Encounter', params=params, token=self._access_token)
            entries = response.get('entry', [])
            return [entry.get('resource', {}) for entry in entries]
        except Exception as e:
            logger.error(f"Failed to fetch encounters: {e}")
            raise

    async def fetch_conditions(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """Fetch conditions (diagnoses) from Epic FHIR API."""
        if self.use_mock_data:
            return self._generate_mock_conditions(encounter_ids or [])

        try:
            params = {'_count': '100'}
            if encounter_ids:
                params['encounter'] = ','.join(encounter_ids)
            elif patient_ids:
                params['patient'] = ','.join(patient_ids)

            response = await self.client.get('/Condition', params=params, token=self._access_token)
            entries = response.get('entry', [])
            return [entry.get('resource', {}) for entry in entries]
        except Exception as e:
            logger.error(f"Failed to fetch conditions: {e}")
            raise

    async def fetch_procedures(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """Fetch procedures from Epic FHIR API."""
        if self.use_mock_data:
            return self._generate_mock_procedures(encounter_ids or [])

        try:
            params = {'_count': '100'}
            if encounter_ids:
                params['encounter'] = ','.join(encounter_ids)
            elif patient_ids:
                params['patient'] = ','.join(patient_ids)

            response = await self.client.get('/Procedure', params=params, token=self._access_token)
            entries = response.get('entry', [])
            return [entry.get('resource', {}) for entry in entries]
        except Exception as e:
            logger.error(f"Failed to fetch procedures: {e}")
            raise

    # =========================================================================
    # TRANSFORMATIONS
    # =========================================================================

    def transform_patient(self, fhir_resource: Dict) -> Dict:
        """Transform FHIR Patient to canonical format."""
        return self.mappers.map_patient(fhir_resource, self.EHR_TYPE)

    def transform_encounter(self, fhir_resource: Dict) -> Dict:
        """Transform FHIR Encounter to canonical format."""
        return self.mappers.map_encounter(fhir_resource, self.EHR_TYPE)

    def transform_condition(self, fhir_resource: Dict) -> Dict:
        """Transform FHIR Condition to canonical format."""
        return self.mappers.map_condition(fhir_resource, self.EHR_TYPE)

    def transform_procedure(self, fhir_resource: Dict) -> Dict:
        """Transform FHIR Procedure to canonical format."""
        return self.mappers.map_procedure(fhir_resource, self.EHR_TYPE)

    # =========================================================================
    # MOCK DATA GENERATION
    # =========================================================================

    def _generate_mock_patients(self) -> List[Dict]:
        """Generate realistic mock FHIR Patient resources."""
        logger.info("Generating mock FHIR patients")

        # Separate names by gender to ensure consistency
        male_first_names = ['John', 'Michael', 'David', 'Robert', 'William', 'James', 'Christopher', 'Daniel', 'Matthew', 'Anthony']
        female_first_names = ['Jane', 'Sarah', 'Emily', 'Jessica', 'Ashley', 'Jennifer', 'Amanda', 'Lisa', 'Michelle', 'Elizabeth']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
        genders = ['male', 'female']

        patients = []
        for i in range(random.randint(3, 7)):
            patient_id = str(uuid4())
            mrn = f"MRN{random.randint(100000, 999999)}"

            # Pick gender first, then select appropriate name
            gender = random.choice(genders)
            first_name = random.choice(male_first_names if gender == 'male' else female_first_names)
            last_name = random.choice(last_names)
            birth_date = date(
                random.randint(1940, 2010),
                random.randint(1, 12),
                random.randint(1, 28)
            )

            patient = {
                "resourceType": "Patient",
                "id": patient_id,
                "meta": {
                    "lastUpdated": datetime.utcnow().isoformat() + "Z"
                },
                "identifier": [
                    {
                        "use": "usual",
                        "type": {
                            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]
                        },
                        "system": "urn:oid:1.2.36.146.595.217.0.1",
                        "value": mrn
                    }
                ],
                "name": [
                    {
                        "use": "official",
                        "family": last_name,
                        "given": [first_name]
                    }
                ],
                "gender": gender,
                "birthDate": birth_date.isoformat(),
                "address": [
                    {
                        "use": "home",
                        "line": [f"{random.randint(100, 9999)} Main Street"],
                        "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]),
                        "state": random.choice(["NY", "CA", "IL", "TX", "AZ"]),
                        "postalCode": f"{random.randint(10000, 99999)}"
                    }
                ],
                "telecom": [
                    {
                        "system": "phone",
                        "value": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                        "use": "home"
                    },
                    {
                        "system": "email",
                        "value": f"{first_name.lower()}.{last_name.lower()}@example.com"
                    }
                ]
            }
            patients.append(patient)

        return patients

    def _generate_mock_encounters(self, patient_ids: List[str]) -> List[Dict]:
        """Generate realistic mock FHIR Encounter resources."""
        logger.info(f"Generating mock FHIR encounters for {len(patient_ids)} patients")

        encounter_types = [
            {"code": "AMB", "display": "ambulatory"},
            {"code": "EMER", "display": "emergency"},
            {"code": "IMP", "display": "inpatient encounter"},
            {"code": "OBSENC", "display": "observation encounter"},
        ]
        statuses = ["in-progress", "finished", "arrived"]

        encounters = []
        for patient_id in patient_ids:
            # 1-3 encounters per patient
            for _ in range(random.randint(1, 3)):
                encounter_id = str(uuid4())
                encounter_type = random.choice(encounter_types)
                status = random.choice(statuses)
                service_date = date.today() - timedelta(days=random.randint(0, 30))

                encounter = {
                    "resourceType": "Encounter",
                    "id": encounter_id,
                    "meta": {
                        "lastUpdated": datetime.utcnow().isoformat() + "Z"
                    },
                    "identifier": [
                        {
                            "system": "urn:oid:1.2.36.146.595.217.0.1",
                            "value": f"ENC{random.randint(100000, 999999)}"
                        }
                    ],
                    "status": status,
                    "class": {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                        "code": encounter_type["code"],
                        "display": encounter_type["display"]
                    },
                    "subject": {
                        "reference": f"Patient/{patient_id}"
                    },
                    "period": {
                        "start": f"{service_date}T08:00:00Z",
                        "end": f"{service_date}T09:30:00Z" if status == "finished" else None
                    },
                    "reasonCode": [
                        {
                            "coding": [
                                {
                                    "system": "http://snomed.info/sct",
                                    "code": "386661006",
                                    "display": "Fever"
                                }
                            ]
                        }
                    ],
                    "location": [
                        {
                            "location": {
                                "display": random.choice(["Emergency Room", "Clinic A", "Outpatient Center"])
                            }
                        }
                    ],
                    "serviceProvider": {
                        "display": "Demo Hospital Medical Center"
                    }
                }
                encounters.append(encounter)

        return encounters

    def _generate_mock_conditions(self, encounter_ids: List[str]) -> List[Dict]:
        """Generate realistic mock FHIR Condition resources with ICD-10 codes."""
        logger.info(f"Generating mock FHIR conditions for {len(encounter_ids)} encounters")

        # Common ICD-10 codes for testing
        icd10_codes = [
            {"code": "J06.9", "display": "Acute upper respiratory infection, unspecified"},
            {"code": "R50.9", "display": "Fever, unspecified"},
            {"code": "M54.5", "display": "Low back pain"},
            {"code": "I10", "display": "Essential (primary) hypertension"},
            {"code": "E11.9", "display": "Type 2 diabetes mellitus without complications"},
            {"code": "J18.9", "display": "Pneumonia, unspecified organism"},
            {"code": "K21.0", "display": "Gastro-esophageal reflux disease with esophagitis"},
            {"code": "F32.9", "display": "Major depressive disorder, single episode, unspecified"},
        ]

        conditions = []
        for encounter_id in encounter_ids:
            # 1-4 diagnoses per encounter
            num_conditions = random.randint(1, 4)
            selected_codes = random.sample(icd10_codes, min(num_conditions, len(icd10_codes)))

            for i, icd10 in enumerate(selected_codes):
                condition_id = str(uuid4())

                condition = {
                    "resourceType": "Condition",
                    "id": condition_id,
                    "meta": {
                        "lastUpdated": datetime.utcnow().isoformat() + "Z"
                    },
                    "clinicalStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                "code": "active"
                            }
                        ]
                    },
                    "verificationStatus": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                                "code": "confirmed"
                            }
                        ]
                    },
                    "category": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                                    "code": "encounter-diagnosis" if i == 0 else "problem-list-item",
                                    "display": "Encounter Diagnosis" if i == 0 else "Problem List Item"
                                }
                            ]
                        }
                    ],
                    "code": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/sid/icd-10-cm",
                                "code": icd10["code"],
                                "display": icd10["display"]
                            }
                        ],
                        "text": icd10["display"]
                    },
                    "encounter": {
                        "reference": f"Encounter/{encounter_id}"
                    },
                    "recordedDate": datetime.utcnow().isoformat() + "Z"
                }
                conditions.append(condition)

        return conditions

    def _generate_mock_procedures(self, encounter_ids: List[str]) -> List[Dict]:
        """Generate realistic mock FHIR Procedure resources with CPT codes."""
        logger.info(f"Generating mock FHIR procedures for {len(encounter_ids)} encounters")

        # Common CPT codes for testing
        cpt_codes = [
            {"code": "99213", "display": "Office/outpatient visit, est pt, 20-29 min"},
            {"code": "99214", "display": "Office/outpatient visit, est pt, 30-39 min"},
            {"code": "99203", "display": "Office/outpatient visit, new pt, 30-44 min"},
            {"code": "99204", "display": "Office/outpatient visit, new pt, 45-59 min"},
            {"code": "71046", "display": "X-ray chest, 2 views"},
            {"code": "80053", "display": "Comprehensive metabolic panel"},
            {"code": "85025", "display": "Complete blood count (CBC)"},
            {"code": "36415", "display": "Collection of venous blood"},
        ]

        procedures = []
        for encounter_id in encounter_ids:
            # 1-3 procedures per encounter
            num_procedures = random.randint(1, 3)
            selected_codes = random.sample(cpt_codes, min(num_procedures, len(cpt_codes)))

            for cpt in selected_codes:
                procedure_id = str(uuid4())
                procedure_date = date.today() - timedelta(days=random.randint(0, 30))

                procedure = {
                    "resourceType": "Procedure",
                    "id": procedure_id,
                    "meta": {
                        "lastUpdated": datetime.utcnow().isoformat() + "Z"
                    },
                    "status": "completed",
                    "code": {
                        "coding": [
                            {
                                "system": "http://www.ama-assn.org/go/cpt",
                                "code": cpt["code"],
                                "display": cpt["display"]
                            }
                        ],
                        "text": cpt["display"]
                    },
                    "encounter": {
                        "reference": f"Encounter/{encounter_id}"
                    },
                    "performedDateTime": f"{procedure_date}T10:00:00Z"
                }
                procedures.append(procedure)

        return procedures

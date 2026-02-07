"""
Epic FHIR to Canonical Mappers

Transforms FHIR R4 resources from Epic to the canonical format
used by Panaceon's database schema.

Handles Epic-specific extensions and data formats.
"""

import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
import json

logger = logging.getLogger(__name__)


class EpicMappers:
    """
    FHIR to Canonical transformation mappers for Epic.

    Maps FHIR R4 resources to the Panaceon database schema format.
    """

    def map_patient(self, fhir_patient: Dict, source_ehr: str = 'epic') -> Dict:
        """
        Transform FHIR Patient resource to canonical format.

        Args:
            fhir_patient: FHIR Patient resource dict
            source_ehr: Source EHR identifier

        Returns:
            Canonical patient dict matching database schema
        """
        # Extract identifiers
        mrn = self._extract_mrn(fhir_patient.get('identifier', []))
        ssn = self._extract_ssn(fhir_patient.get('identifier', []))

        # Extract name
        name = self._extract_name(fhir_patient.get('name', []))

        # Extract contact info
        telecom = fhir_patient.get('telecom', [])
        phone = self._extract_telecom(telecom, 'phone')
        email = self._extract_telecom(telecom, 'email')

        # Extract address
        address = self._extract_address(fhir_patient.get('address', []))

        return {
            'fhir_id': fhir_patient.get('id'),
            'source_ehr': source_ehr,
            'source_organization_id': self._extract_managing_organization(fhir_patient),
            'fhir_raw': fhir_patient,
            'last_synced_at': datetime.utcnow(),

            # Patient Identifiers
            'mrn': mrn,
            'ssn': ssn,
            'external_patient_id': fhir_patient.get('id'),

            # Demographics
            'first_name': name.get('given', ''),
            'middle_name': name.get('middle', ''),
            'last_name': name.get('family', ''),
            'date_of_birth': self._parse_date(fhir_patient.get('birthDate')),
            'gender': self._transform_gender(fhir_patient.get('gender')),

            # Contact
            'phone_primary': phone,
            'email': email,

            # Address
            'address_line1': address.get('line1'),
            'address_line2': address.get('line2'),
            'city': address.get('city'),
            'state': address.get('state'),
            'zip_code': address.get('postalCode'),
            'country': address.get('country', 'USA'),

            # Status
            'is_active': not fhir_patient.get('deceasedBoolean', False),
            'is_deceased': fhir_patient.get('deceasedBoolean', False),
            'deceased_date': self._parse_date(fhir_patient.get('deceasedDateTime')),
        }

    def map_encounter(self, fhir_encounter: Dict, source_ehr: str = 'epic') -> Dict:
        """
        Transform FHIR Encounter resource to canonical format.

        Args:
            fhir_encounter: FHIR Encounter resource dict
            source_ehr: Source EHR identifier

        Returns:
            Canonical encounter dict matching database schema
        """
        # Extract encounter class
        encounter_class = fhir_encounter.get('class', {})
        encounter_type = encounter_class.get('code', 'AMB')

        # Extract period
        period = fhir_encounter.get('period', {})

        # Extract patient reference
        subject = fhir_encounter.get('subject', {})
        patient_fhir_id = self._extract_reference_id(subject.get('reference', ''))

        # Extract identifiers
        encounter_number = self._extract_encounter_number(fhir_encounter.get('identifier', []))

        return {
            'fhir_id': fhir_encounter.get('id'),
            'source_ehr': source_ehr,
            'source_organization_id': self._extract_service_provider(fhir_encounter),
            'fhir_raw': fhir_encounter,
            'last_synced_at': datetime.utcnow(),

            # Link to patient by FHIR ID (will be resolved to patient_id in database)
            'patient_fhir_id': patient_fhir_id,

            # Encounter Identification
            'encounter_number': encounter_number or fhir_encounter.get('id'),
            'external_encounter_id': fhir_encounter.get('id'),

            # Encounter Details
            'encounter_type': self._map_encounter_type(encounter_type),
            'encounter_class': encounter_class.get('display'),
            'service_date': self._parse_date(period.get('start')),
            'service_end_date': self._parse_date(period.get('end')),

            # Location
            'facility_name': self._extract_location(fhir_encounter),
            'place_of_service': self._map_place_of_service(encounter_type),

            # Status
            'encounter_status': self._map_encounter_status(fhir_encounter.get('status')),
            'coding_status': 'Not Started',
            'billing_status': 'Not Ready',
        }

    def map_condition(self, fhir_condition: Dict, source_ehr: str = 'epic') -> Dict:
        """
        Transform FHIR Condition resource to canonical format.

        Args:
            fhir_condition: FHIR Condition resource dict
            source_ehr: Source EHR identifier

        Returns:
            Canonical condition/diagnosis dict matching database schema
        """
        # Extract ICD-10 code
        code_info = fhir_condition.get('code', {})
        icd10_code, description = self._extract_icd10_code(code_info)

        # Extract encounter reference
        encounter = fhir_condition.get('encounter', {})
        encounter_fhir_id = self._extract_reference_id(encounter.get('reference', ''))

        # Determine diagnosis type
        category = fhir_condition.get('category', [])
        diagnosis_type = self._extract_diagnosis_type(category)

        return {
            'fhir_id': fhir_condition.get('id'),
            'source_ehr': source_ehr,
            'fhir_raw': fhir_condition,

            # Link to encounter by FHIR ID
            'encounter_fhir_id': encounter_fhir_id,

            # Diagnosis Code
            'icd10_code': icd10_code,
            'diagnosis_description': description,

            # Diagnosis Details
            'diagnosis_type': diagnosis_type,
            'present_on_admission': None,  # Epic may provide in extension
            'diagnosis_order': 1,  # Will be set based on sequence

            # AI fields
            'ai_suggested': False,
            'ai_confidence_score': None,
            'ai_reasoning': None,
        }

    def map_procedure(self, fhir_procedure: Dict, source_ehr: str = 'epic') -> Dict:
        """
        Transform FHIR Procedure resource to canonical format.

        Args:
            fhir_procedure: FHIR Procedure resource dict
            source_ehr: Source EHR identifier

        Returns:
            Canonical procedure dict matching database schema
        """
        # Extract CPT code
        code_info = fhir_procedure.get('code', {})
        procedure_code, code_type, description = self._extract_procedure_code(code_info)

        # Extract encounter reference
        encounter = fhir_procedure.get('encounter', {})
        encounter_fhir_id = self._extract_reference_id(encounter.get('reference', ''))

        # Extract performed date
        performed = (
            fhir_procedure.get('performedDateTime') or
            fhir_procedure.get('performedPeriod', {}).get('start')
        )

        return {
            'fhir_id': fhir_procedure.get('id'),
            'source_ehr': source_ehr,
            'fhir_raw': fhir_procedure,

            # Link to encounter by FHIR ID
            'encounter_fhir_id': encounter_fhir_id,

            # Procedure Code
            'procedure_code': procedure_code,
            'code_type': code_type,
            'procedure_description': description,

            # Procedure Details
            'procedure_date': self._parse_date(performed),
            'quantity': 1,
            'units': 1.0,

            # Modifiers (may be in extensions)
            'modifier_1': None,
            'modifier_2': None,
            'modifier_3': None,
            'modifier_4': None,

            # AI fields
            'ai_suggested': False,
            'ai_confidence_score': None,
            'ai_reasoning': None,
        }

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _extract_mrn(self, identifiers: List[Dict]) -> Optional[str]:
        """Extract MRN from FHIR identifiers."""
        for identifier in identifiers:
            type_codings = identifier.get('type', {}).get('coding', [])
            for coding in type_codings:
                if coding.get('code') == 'MR':
                    return identifier.get('value')
        # Fallback to first identifier
        if identifiers:
            return identifiers[0].get('value')
        return None

    def _extract_ssn(self, identifiers: List[Dict]) -> Optional[str]:
        """Extract SSN from FHIR identifiers."""
        for identifier in identifiers:
            type_codings = identifier.get('type', {}).get('coding', [])
            for coding in type_codings:
                if coding.get('code') == 'SS':
                    return identifier.get('value')
            # Check system for SSN
            if 'ssn' in identifier.get('system', '').lower():
                return identifier.get('value')
        return None

    def _extract_name(self, names: List[Dict]) -> Dict:
        """Extract name parts from FHIR HumanName."""
        # Prefer official name
        for name in names:
            if name.get('use') == 'official':
                return self._parse_name(name)

        # Fallback to first name
        if names:
            return self._parse_name(names[0])

        return {'given': '', 'middle': '', 'family': ''}

    def _parse_name(self, name: Dict) -> Dict:
        """Parse FHIR HumanName to parts."""
        given = name.get('given', [])
        return {
            'given': given[0] if given else '',
            'middle': given[1] if len(given) > 1 else '',
            'family': name.get('family', ''),
        }

    def _transform_gender(self, fhir_gender: Optional[str]) -> str:
        """
        Transform FHIR gender code to database format.

        FHIR R4 uses: 'male', 'female', 'other', 'unknown'
        Database expects: 'M', 'F', 'O', 'U'

        Args:
            fhir_gender: FHIR gender code (lowercase)

        Returns:
            Single uppercase letter for database
        """
        gender_map = {
            'male': 'M',
            'female': 'F',
            'other': 'O',
            'unknown': 'U',
        }
        return gender_map.get(fhir_gender, 'U')  # Default to Unknown

    def _extract_telecom(self, telecoms: List[Dict], system: str) -> Optional[str]:
        """Extract telecom value by system (phone, email, etc.)."""
        for telecom in telecoms:
            if telecom.get('system') == system:
                return telecom.get('value')
        return None

    def _extract_address(self, addresses: List[Dict]) -> Dict:
        """Extract address from FHIR Address."""
        # Prefer home address
        for address in addresses:
            if address.get('use') == 'home':
                return self._parse_address(address)

        # Fallback to first address
        if addresses:
            return self._parse_address(addresses[0])

        return {}

    def _parse_address(self, address: Dict) -> Dict:
        """Parse FHIR Address to parts."""
        lines = address.get('line', [])
        return {
            'line1': lines[0] if lines else None,
            'line2': lines[1] if len(lines) > 1 else None,
            'city': address.get('city'),
            'state': address.get('state'),
            'postalCode': address.get('postalCode'),
            'country': address.get('country'),
        }

    def _extract_managing_organization(self, patient: Dict) -> Optional[str]:
        """Extract managing organization ID."""
        org = patient.get('managingOrganization', {})
        return self._extract_reference_id(org.get('reference', ''))

    def _extract_service_provider(self, encounter: Dict) -> Optional[str]:
        """Extract service provider organization ID."""
        provider = encounter.get('serviceProvider', {})
        return self._extract_reference_id(provider.get('reference', ''))

    def _extract_reference_id(self, reference: str) -> Optional[str]:
        """Extract resource ID from FHIR reference."""
        if not reference:
            return None
        # Reference format: "ResourceType/id"
        parts = reference.split('/')
        return parts[-1] if parts else None

    def _extract_encounter_number(self, identifiers: List[Dict]) -> Optional[str]:
        """Extract encounter number from identifiers."""
        for identifier in identifiers:
            return identifier.get('value')
        return None

    def _extract_location(self, encounter: Dict) -> Optional[str]:
        """Extract location name from encounter."""
        locations = encounter.get('location', [])
        if locations:
            loc = locations[0].get('location', {})
            return loc.get('display')
        return None

    def _extract_icd10_code(self, code: Dict) -> tuple:
        """Extract ICD-10 code and description."""
        codings = code.get('coding', [])
        for coding in codings:
            system = coding.get('system', '')
            if 'icd-10' in system.lower():
                return coding.get('code'), coding.get('display')
        # Fallback to first coding
        if codings:
            return codings[0].get('code'), codings[0].get('display')
        return None, code.get('text')

    def _extract_procedure_code(self, code: Dict) -> tuple:
        """Extract CPT/HCPCS code, type, and description."""
        codings = code.get('coding', [])
        for coding in codings:
            system = coding.get('system', '').lower()
            if 'cpt' in system or 'ama-assn' in system:
                return coding.get('code'), 'CPT', coding.get('display')
            if 'hcpcs' in system:
                return coding.get('code'), 'HCPCS', coding.get('display')
        # Fallback to first coding
        if codings:
            return codings[0].get('code'), 'CPT', codings[0].get('display')
        return None, 'CPT', code.get('text')

    def _extract_diagnosis_type(self, categories: List[Dict]) -> str:
        """
        Map FHIR condition category to diagnosis type.

        Database constraint allows:
        - 'Primary', 'Secondary', 'Admitting', 'Complication', 'Comorbidity'
        """
        for category in categories:
            codings = category.get('coding', [])
            for coding in codings:
                code = coding.get('code', '')
                if code == 'encounter-diagnosis':
                    return 'Primary'  # Primary diagnosis for encounter
                if code == 'problem-list-item':
                    return 'Secondary'
        return 'Secondary'

    def _map_encounter_type(self, class_code: str) -> str:
        """
        Map FHIR encounter class to encounter type.

        Database constraint allows:
        - 'Office Visit', 'Inpatient', 'Emergency', 'Telemedicine',
        - 'Observation', 'Outpatient Surgery', 'Other'
        """
        mapping = {
            'AMB': 'Office Visit',  # Ambulatory care
            'EMER': 'Emergency',
            'IMP': 'Inpatient',
            'OBSENC': 'Observation',
            'SS': 'Outpatient Surgery',  # Short stay
        }
        return mapping.get(class_code, 'Other')

    def _map_place_of_service(self, class_code: str) -> str:
        """Map FHIR encounter class to CMS place of service code."""
        mapping = {
            'AMB': '11',   # Office
            'EMER': '23',  # Emergency Room
            'IMP': '21',   # Inpatient Hospital
            'OBSENC': '22', # Outpatient Hospital
        }
        return mapping.get(class_code, '11')

    def _map_encounter_status(self, fhir_status: str) -> str:
        """
        Map FHIR encounter status to Panaceon status.

        Database constraint allows:
        - 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'
        """
        mapping = {
            'planned': 'Scheduled',
            'arrived': 'In Progress',  # Patient arrived, encounter is in progress
            'triaged': 'In Progress',
            'in-progress': 'In Progress',
            'onleave': 'In Progress',  # Temporarily away but still in progress
            'finished': 'Completed',
            'cancelled': 'Cancelled',
            'entered-in-error': 'Cancelled',
        }
        return mapping.get(fhir_status, 'In Progress')

    def _parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse FHIR date/datetime string."""
        if not date_str:
            return None

        try:
            # Try datetime format first
            if 'T' in date_str:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return dt.date()
            # Parse date only
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            logger.warning(f"Failed to parse date: {date_str}")
            return None

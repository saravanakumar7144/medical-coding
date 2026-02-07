"""
Mock FHIR Data Generator

Generates realistic FHIR R4 resources for testing.
Includes:
- Patient resources with demographics
- Encounter resources with visit details
- Condition resources with ICD-10 codes
- Procedure resources with CPT codes
"""

import json
import random
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from uuid import uuid4

# Common ICD-10 codes for testing
COMMON_ICD10_CODES = [
    ("J06.9", "Acute upper respiratory infection, unspecified"),
    ("J18.9", "Pneumonia, unspecified organism"),
    ("I10", "Essential (primary) hypertension"),
    ("E11.9", "Type 2 diabetes mellitus without complications"),
    ("M54.5", "Low back pain"),
    ("K21.0", "Gastro-esophageal reflux disease with esophagitis"),
    ("J45.909", "Unspecified asthma, uncomplicated"),
    ("F32.9", "Major depressive disorder, single episode, unspecified"),
    ("N39.0", "Urinary tract infection, site not specified"),
    ("R05", "Cough"),
]

# Common CPT codes for testing
COMMON_CPT_CODES = [
    ("99213", "Office visit, established patient, level 3"),
    ("99214", "Office visit, established patient, level 4"),
    ("99203", "Office visit, new patient, level 3"),
    ("99204", "Office visit, new patient, level 4"),
    ("36415", "Collection of venous blood by venipuncture"),
    ("81003", "Urinalysis, automated without microscopy"),
    ("85025", "Complete blood count with differential"),
    ("87880", "Strep A test"),
    ("71046", "Chest X-ray, 2 views"),
    ("93000", "Electrocardiogram, routine ECG"),
]

# Sample data for generation
FIRST_NAMES_MALE = ["John", "Michael", "David", "James", "Robert", "William", "Richard", "Joseph", "Thomas", "Charles"]
FIRST_NAMES_FEMALE = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
CITIES = ["Springfield", "Riverside", "Georgetown", "Franklin", "Clinton", "Madison", "Salem", "Oakland", "Fairview", "Chester"]
STATES = ["IL", "CA", "TX", "NY", "FL", "PA", "OH", "MI", "GA", "NC"]


def generate_patient(patient_id: str = None) -> Dict[str, Any]:
    """Generate a mock FHIR Patient resource."""
    patient_id = patient_id or f"patient-{uuid4().hex[:8]}"
    is_male = random.choice([True, False])
    first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
    middle_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
    last_name = random.choice(LAST_NAMES)

    birth_year = random.randint(1940, 2010)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)

    return {
        "resourceType": "Patient",
        "id": patient_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "source": "epic"
        },
        "identifier": [
            {
                "use": "usual",
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "MR",
                        "display": "Medical Record Number"
                    }]
                },
                "value": f"MRN-{random.randint(100000, 999999)}"
            },
            {
                "use": "official",
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "SS",
                        "display": "Social Security Number"
                    }]
                },
                "value": f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"
            }
        ],
        "active": True,
        "name": [{
            "use": "official",
            "family": last_name,
            "given": [first_name, middle_name]
        }],
        "telecom": [
            {"system": "phone", "value": f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}", "use": "home"},
            {"system": "email", "value": f"{first_name.lower()}.{last_name.lower()}@example.com", "use": "home"}
        ],
        "gender": "male" if is_male else "female",
        "birthDate": f"{birth_year}-{birth_month:02d}-{birth_day:02d}",
        "address": [{
            "use": "home",
            "line": [f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Maple', 'Cedar'])} Street"],
            "city": random.choice(CITIES),
            "state": random.choice(STATES),
            "postalCode": f"{random.randint(10000, 99999)}",
            "country": "USA"
        }]
    }


def generate_encounter(
    encounter_id: str = None,
    patient_id: str = None,
    service_date: date = None
) -> Dict[str, Any]:
    """Generate a mock FHIR Encounter resource."""
    encounter_id = encounter_id or f"encounter-{uuid4().hex[:8]}"
    patient_id = patient_id or f"patient-{uuid4().hex[:8]}"
    service_date = service_date or date.today()

    encounter_types = [
        ("AMB", "ambulatory", "Office Visit"),
        ("EMER", "emergency", "Emergency Room Visit"),
        ("IMP", "inpatient", "Inpatient Admission"),
    ]
    enc_class, enc_display, enc_text = random.choice(encounter_types)

    return {
        "resourceType": "Encounter",
        "id": encounter_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "source": "epic"
        },
        "identifier": [{
            "use": "official",
            "value": f"ENC-{service_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        }],
        "status": "finished",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": enc_class,
            "display": enc_display
        },
        "type": [{
            "coding": [{
                "system": "http://snomed.info/sct",
                "code": "308335008",
                "display": "Patient encounter procedure"
            }],
            "text": enc_text
        }],
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "period": {
            "start": f"{service_date}T09:00:00-06:00",
            "end": f"{service_date}T09:30:00-06:00"
        }
    }


def generate_condition(
    condition_id: str = None,
    patient_id: str = None,
    encounter_id: str = None
) -> Dict[str, Any]:
    """Generate a mock FHIR Condition resource with ICD-10 code."""
    condition_id = condition_id or f"condition-{uuid4().hex[:8]}"
    icd10_code, description = random.choice(COMMON_ICD10_CODES)

    return {
        "resourceType": "Condition",
        "id": condition_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "source": "epic"
        },
        "clinicalStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": "active"
            }]
        },
        "verificationStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": "confirmed"
            }]
        },
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                "code": "encounter-diagnosis"
            }]
        }],
        "code": {
            "coding": [{
                "system": "http://hl7.org/fhir/sid/icd-10-cm",
                "code": icd10_code,
                "display": description
            }],
            "text": description
        },
        "subject": {
            "reference": f"Patient/{patient_id}" if patient_id else None
        },
        "encounter": {
            "reference": f"Encounter/{encounter_id}" if encounter_id else None
        },
        "recordedDate": date.today().isoformat()
    }


def generate_procedure(
    procedure_id: str = None,
    patient_id: str = None,
    encounter_id: str = None,
    procedure_date: date = None
) -> Dict[str, Any]:
    """Generate a mock FHIR Procedure resource with CPT code."""
    procedure_id = procedure_id or f"procedure-{uuid4().hex[:8]}"
    procedure_date = procedure_date or date.today()
    cpt_code, description = random.choice(COMMON_CPT_CODES)

    return {
        "resourceType": "Procedure",
        "id": procedure_id,
        "meta": {
            "versionId": "1",
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
            "source": "epic"
        },
        "status": "completed",
        "code": {
            "coding": [{
                "system": "http://www.ama-assn.org/go/cpt",
                "code": cpt_code,
                "display": description
            }],
            "text": description
        },
        "subject": {
            "reference": f"Patient/{patient_id}" if patient_id else None
        },
        "encounter": {
            "reference": f"Encounter/{encounter_id}" if encounter_id else None
        },
        "performedDateTime": f"{procedure_date}T09:15:00-06:00"
    }


def generate_patient_bundle(count: int = 10) -> List[Dict[str, Any]]:
    """Generate a bundle of mock patients."""
    return [generate_patient() for _ in range(count)]


def generate_encounter_bundle(
    patient_ids: List[str],
    encounters_per_patient: int = 3
) -> List[Dict[str, Any]]:
    """Generate encounters for a list of patients."""
    encounters = []
    for patient_id in patient_ids:
        for i in range(encounters_per_patient):
            service_date = date.today() - timedelta(days=random.randint(0, 365))
            encounters.append(generate_encounter(
                patient_id=patient_id,
                service_date=service_date
            ))
    return encounters


def generate_full_test_data(
    patient_count: int = 5,
    encounters_per_patient: int = 2,
    conditions_per_encounter: int = 2,
    procedures_per_encounter: int = 1
) -> Dict[str, List[Dict]]:
    """Generate a complete set of test data."""
    patients = generate_patient_bundle(patient_count)
    patient_ids = [p["id"] for p in patients]

    encounters = generate_encounter_bundle(patient_ids, encounters_per_patient)

    conditions = []
    procedures = []

    for encounter in encounters:
        encounter_id = encounter["id"]
        patient_ref = encounter["subject"]["reference"]
        patient_id = patient_ref.split("/")[-1] if patient_ref else None

        for _ in range(conditions_per_encounter):
            conditions.append(generate_condition(
                patient_id=patient_id,
                encounter_id=encounter_id
            ))

        for _ in range(procedures_per_encounter):
            procedures.append(generate_procedure(
                patient_id=patient_id,
                encounter_id=encounter_id
            ))

    return {
        "patients": patients,
        "encounters": encounters,
        "conditions": conditions,
        "procedures": procedures
    }


if __name__ == "__main__":
    # Generate test data
    test_data = generate_full_test_data()

    print(f"Generated {len(test_data['patients'])} patients")
    print(f"Generated {len(test_data['encounters'])} encounters")
    print(f"Generated {len(test_data['conditions'])} conditions")
    print(f"Generated {len(test_data['procedures'])} procedures")

    # Save to files
    import os
    output_dir = os.path.dirname(os.path.abspath(__file__))

    with open(os.path.join(output_dir, "generated_patients.json"), "w") as f:
        json.dump(test_data["patients"], f, indent=2)

    with open(os.path.join(output_dir, "generated_encounters.json"), "w") as f:
        json.dump(test_data["encounters"], f, indent=2)

    with open(os.path.join(output_dir, "generated_conditions.json"), "w") as f:
        json.dump(test_data["conditions"], f, indent=2)

    with open(os.path.join(output_dir, "generated_procedures.json"), "w") as f:
        json.dump(test_data["procedures"], f, indent=2)

    print(f"Files saved to {output_dir}")

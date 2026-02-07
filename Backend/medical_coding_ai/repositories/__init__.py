"""
Panaceon Repository Layer

Provides data access layer for EHR/claims data with:
- Multi-tenant isolation via tenant_id
- UPSERT operations using fhir_id for deduplication
- Async database operations
"""

from .base_repository import BaseRepository
from .patient_repository import PatientRepository
from .encounter_repository import EncounterRepository
from .condition_repository import ConditionRepository
from .procedure_repository import ProcedureRepository
from .ehr_connection_repository import EHRConnectionRepository
from .sync_state_repository import SyncStateRepository

__all__ = [
    "BaseRepository",
    "PatientRepository",
    "EncounterRepository",
    "ConditionRepository",
    "ProcedureRepository",
    "EHRConnectionRepository",
    "SyncStateRepository",
]

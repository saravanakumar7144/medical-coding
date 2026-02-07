"""
Encounter Repository

Provides data access for Encounter records with:
- UPSERT logic using fhir_id for EHR sync deduplication
- Multi-tenant isolation
- Relationship loading for diagnoses and procedures
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import Encounter, EncounterDiagnosis, EncounterProcedure

logger = logging.getLogger(__name__)


class EncounterRepository(BaseRepository[Encounter]):
    """
    Repository for Encounter records.

    Provides specialized operations for EHR integration including
    UPSERT with fhir_id conflict resolution.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, Encounter)

    async def upsert_from_ehr(self, encounter_data: Dict[str, Any]) -> Encounter:
        """
        Upsert encounter from EHR sync using fhir_id for conflict resolution.

        Args:
            encounter_data: Encounter data dict with:
                - tenant_id: UUID (required)
                - patient_fhir_id: str (will be resolved to patient_id)
                - fhir_id: str (required for upsert)
                - source_ehr: str
                - encounter_number, service_date, etc.

        Returns:
            Upserted Encounter instance
        """
        tenant_id = encounter_data.get('tenant_id')
        fhir_id = encounter_data.get('fhir_id')
        patient_fhir_id = encounter_data.get('patient_fhir_id')

        if not tenant_id or not fhir_id:
            raise ValueError("tenant_id and fhir_id are required for EHR upsert")

        # Resolve patient_fhir_id to patient_id UUID
        if patient_fhir_id and 'patient_id' not in encounter_data:
            from ..models.ehr_models import Patient
            patient_query = select(Patient.patient_id).where(
                and_(
                    Patient.fhir_id == patient_fhir_id,
                    Patient.tenant_id == tenant_id
                )
            )
            result = await self.session.execute(patient_query)
            patient_id = result.scalar_one_or_none()

            if patient_id:
                encounter_data['patient_id'] = patient_id
                # Remove patient_fhir_id as it's not a valid column
                encounter_data.pop('patient_fhir_id', None)
            else:
                logger.warning(f"Patient with fhir_id {patient_fhir_id} not found, skipping encounter")
                raise ValueError(f"Patient with fhir_id {patient_fhir_id} not found")

        # Set sync timestamp
        encounter_data['last_synced_at'] = datetime.utcnow()

        # Check if encounter exists
        existing = await self.get_by_fhir_id(fhir_id, tenant_id)

        if existing:
            # Update existing encounter
            encounter_data['updated_at'] = datetime.utcnow()

            # Remove fields that shouldn't be updated
            update_data = {k: v for k, v in encounter_data.items()
                          if k not in ['encounter_id', 'created_at', 'created_by']}

            for key, value in update_data.items():
                setattr(existing, key, value)

            await self.session.flush()
            await self.session.refresh(existing)
            logger.debug(f"Updated encounter {existing.encounter_id} from EHR sync")
            return existing
        else:
            # Create new encounter
            new_encounter = Encounter(**encounter_data)
            self.session.add(new_encounter)
            await self.session.flush()
            await self.session.refresh(new_encounter)
            logger.debug(f"Created encounter {new_encounter.encounter_id} from EHR sync")
            return new_encounter

    async def get_by_encounter_number(
        self,
        encounter_number: str,
        tenant_id: UUID
    ) -> Optional[Encounter]:
        """
        Get encounter by encounter number.

        Args:
            encounter_number: Encounter number/visit ID
            tenant_id: Tenant UUID

        Returns:
            Encounter or None
        """
        query = select(Encounter).where(
            and_(
                Encounter.encounter_number == encounter_number,
                Encounter.tenant_id == tenant_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_patient_encounters(
        self,
        patient_id: UUID,
        tenant_id: UUID,
        include_diagnoses: bool = False,
        include_procedures: bool = False,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Encounter]:
        """
        Get encounters for a specific patient.

        Args:
            patient_id: Patient UUID
            tenant_id: Tenant UUID
            include_diagnoses: Load diagnoses relationship
            include_procedures: Load procedures relationship
            status: Filter by encounter status
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of encounters
        """
        query = select(Encounter).where(
            and_(
                Encounter.patient_id == patient_id,
                Encounter.tenant_id == tenant_id
            )
        )

        if include_diagnoses:
            query = query.options(selectinload(Encounter.diagnoses))

        if include_procedures:
            query = query.options(selectinload(Encounter.procedures))

        if status:
            query = query.where(Encounter.encounter_status == status)

        query = query.order_by(Encounter.service_date.desc())
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_encounters_for_coding(
        self,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Encounter]:
        """
        Get encounters ready for coding review.

        Args:
            tenant_id: Tenant UUID
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of encounters needing coding
        """
        query = (
            select(Encounter)
            .options(
                selectinload(Encounter.diagnoses),
                selectinload(Encounter.procedures)
            )
            .where(
                and_(
                    Encounter.tenant_id == tenant_id,
                    Encounter.coding_status.in_(['Not Started', 'In Progress']),
                    Encounter.encounter_status == 'Completed'
                )
            )
            .order_by(Encounter.service_date.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_encounters_by_date_range(
        self,
        tenant_id: UUID,
        start_date: date,
        end_date: date,
        source_ehr: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Encounter]:
        """
        Get encounters within a date range.

        Args:
            tenant_id: Tenant UUID
            start_date: Start of date range
            end_date: End of date range
            source_ehr: Optional EHR source filter
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of encounters
        """
        query = select(Encounter).where(
            and_(
                Encounter.tenant_id == tenant_id,
                Encounter.service_date >= start_date,
                Encounter.service_date <= end_date
            )
        )

        if source_ehr:
            query = query.where(Encounter.source_ehr == source_ehr)

        query = query.order_by(Encounter.service_date.desc())
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_with_full_details(
        self,
        encounter_id: UUID,
        tenant_id: UUID
    ) -> Optional[Encounter]:
        """
        Get encounter with all related data loaded.

        Args:
            encounter_id: Encounter UUID
            tenant_id: Tenant UUID

        Returns:
            Encounter with diagnoses, procedures, and patient loaded
        """
        from ..models.ehr_models import Patient

        query = (
            select(Encounter)
            .options(
                selectinload(Encounter.patient),
                selectinload(Encounter.diagnoses),
                selectinload(Encounter.procedures),
                selectinload(Encounter.claims)
            )
            .where(
                and_(
                    Encounter.encounter_id == encounter_id,
                    Encounter.tenant_id == tenant_id
                )
            )
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update_coding_status(
        self,
        encounter_id: UUID,
        tenant_id: UUID,
        coding_status: str,
        user_id: Optional[UUID] = None
    ) -> bool:
        """
        Update encounter coding status.

        Args:
            encounter_id: Encounter UUID
            tenant_id: Tenant UUID
            coding_status: New coding status
            user_id: User making the update

        Returns:
            True if updated successfully
        """
        update_data = {
            'coding_status': coding_status,
            'updated_at': datetime.utcnow()
        }

        if user_id:
            update_data['updated_by'] = user_id

        result = await self.update(encounter_id, update_data, tenant_id)
        return result is not None

    async def get_sync_stats(
        self,
        tenant_id: UUID,
        source_ehr: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get encounter sync statistics.

        Args:
            tenant_id: Tenant UUID
            source_ehr: Optional EHR filter

        Returns:
            Dict with sync statistics
        """
        from sqlalchemy import func

        base_query = select(
            func.count(Encounter.encounter_id).label('total'),
            func.count(Encounter.fhir_id).label('synced'),
            func.max(Encounter.last_synced_at).label('last_sync')
        ).where(Encounter.tenant_id == tenant_id)

        if source_ehr:
            base_query = base_query.where(Encounter.source_ehr == source_ehr)

        result = await self.session.execute(base_query)
        row = result.one()

        return {
            'total_encounters': row.total,
            'synced_from_ehr': row.synced,
            'last_sync_time': row.last_sync.isoformat() if row.last_sync else None,
            'source_ehr': source_ehr
        }

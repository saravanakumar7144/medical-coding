"""
Patient Repository

Provides data access for Patient records with:
- UPSERT logic using fhir_id for EHR sync deduplication
- Multi-tenant isolation
- Search and filtering capabilities
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.dialects.postgresql import insert
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import Patient

logger = logging.getLogger(__name__)


class PatientRepository(BaseRepository[Patient]):
    """
    Repository for Patient records.

    Provides specialized operations for EHR integration including
    UPSERT with fhir_id conflict resolution.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, Patient)

    async def upsert_from_ehr(self, patient_data: Dict[str, Any]) -> Patient:
        """
        Upsert patient from EHR sync using fhir_id for conflict resolution.

        If a patient with the same fhir_id + tenant_id exists, update it.
        Otherwise, create a new patient.

        Args:
            patient_data: Patient data dict with:
                - tenant_id: UUID (required)
                - fhir_id: str (required for upsert)
                - source_ehr: str
                - mrn, first_name, last_name, date_of_birth, etc.

        Returns:
            Upserted Patient instance
        """
        tenant_id = patient_data.get('tenant_id')
        fhir_id = patient_data.get('fhir_id')

        if not tenant_id or not fhir_id:
            raise ValueError("tenant_id and fhir_id are required for EHR upsert")

        # Set sync timestamp
        patient_data['last_synced_at'] = datetime.utcnow()

        # Check if patient exists
        existing = await self.get_by_fhir_id(fhir_id, tenant_id)

        if existing:
            # Update existing patient
            patient_data['updated_at'] = datetime.utcnow()

            # Remove fields that shouldn't be updated
            update_data = {k: v for k, v in patient_data.items()
                          if k not in ['patient_id', 'created_at', 'created_by']}

            for key, value in update_data.items():
                setattr(existing, key, value)

            await self.session.flush()
            await self.session.refresh(existing)
            logger.debug(f"Updated patient {existing.patient_id} from EHR sync")
            return existing
        else:
            # Create new patient
            new_patient = Patient(**patient_data)
            self.session.add(new_patient)
            await self.session.flush()
            await self.session.refresh(new_patient)
            logger.debug(f"Created patient {new_patient.patient_id} from EHR sync")
            return new_patient

    async def get_by_mrn(
        self,
        mrn: str,
        tenant_id: UUID
    ) -> Optional[Patient]:
        """
        Get patient by MRN within a tenant.

        Args:
            mrn: Medical Record Number
            tenant_id: Tenant UUID

        Returns:
            Patient or None
        """
        query = select(Patient).where(
            and_(
                Patient.mrn == mrn,
                Patient.tenant_id == tenant_id,
                Patient.is_active == True
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def search_patients(
        self,
        tenant_id: UUID,
        search_term: Optional[str] = None,
        source_ehr: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50
    ) -> List[Patient]:
        """
        Search patients with filtering.

        Args:
            tenant_id: Tenant UUID (required)
            search_term: Optional search across name, MRN
            source_ehr: Filter by EHR source
            active_only: Only return active patients
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            List of matching patients
        """
        query = select(Patient).where(Patient.tenant_id == tenant_id)

        if active_only:
            query = query.where(Patient.is_active == True)

        if source_ehr:
            query = query.where(Patient.source_ehr == source_ehr)

        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.where(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.mrn.ilike(search_pattern),
                    Patient.fhir_id.ilike(search_pattern)
                )
            )

        query = query.order_by(Patient.last_name, Patient.first_name)
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_patients_for_sync(
        self,
        tenant_id: UUID,
        source_ehr: str,
        since: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[Patient]:
        """
        Get patients that need sync verification.

        Args:
            tenant_id: Tenant UUID
            source_ehr: EHR source type
            since: Only get patients synced before this time
            limit: Maximum patients to return

        Returns:
            List of patients for sync check
        """
        query = select(Patient).where(
            and_(
                Patient.tenant_id == tenant_id,
                Patient.source_ehr == source_ehr,
                Patient.is_active == True
            )
        )

        if since:
            query = query.where(
                or_(
                    Patient.last_synced_at == None,
                    Patient.last_synced_at < since
                )
            )

        query = query.limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_patient_with_insurance(
        self,
        patient_id: UUID,
        tenant_id: UUID
    ) -> Optional[Patient]:
        """
        Get patient with insurance policies loaded.

        Args:
            patient_id: Patient UUID
            tenant_id: Tenant UUID

        Returns:
            Patient with insurance_policies relationship loaded
        """
        from sqlalchemy.orm import selectinload

        query = (
            select(Patient)
            .options(selectinload(Patient.insurance_policies))
            .where(
                and_(
                    Patient.patient_id == patient_id,
                    Patient.tenant_id == tenant_id
                )
            )
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_patient_with_encounters(
        self,
        patient_id: UUID,
        tenant_id: UUID,
        include_diagnoses: bool = False,
        include_procedures: bool = False
    ) -> Optional[Patient]:
        """
        Get patient with encounters loaded.

        Args:
            patient_id: Patient UUID
            tenant_id: Tenant UUID
            include_diagnoses: Load encounter diagnoses
            include_procedures: Load encounter procedures

        Returns:
            Patient with encounters relationship loaded
        """
        from sqlalchemy.orm import selectinload

        options = [selectinload(Patient.encounters)]

        if include_diagnoses:
            from ..models.ehr_models import Encounter
            options = [
                selectinload(Patient.encounters).selectinload(Encounter.diagnoses)
            ]

        if include_procedures:
            from ..models.ehr_models import Encounter
            options = [
                selectinload(Patient.encounters).selectinload(Encounter.procedures)
            ]

        query = (
            select(Patient)
            .options(*options)
            .where(
                and_(
                    Patient.patient_id == patient_id,
                    Patient.tenant_id == tenant_id
                )
            )
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_sync_stats(
        self,
        tenant_id: UUID,
        source_ehr: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get patient sync statistics.

        Args:
            tenant_id: Tenant UUID
            source_ehr: Optional EHR filter

        Returns:
            Dict with sync statistics
        """
        from sqlalchemy import func

        base_query = select(
            func.count(Patient.patient_id).label('total'),
            func.count(Patient.fhir_id).label('synced'),
            func.max(Patient.last_synced_at).label('last_sync')
        ).where(
            and_(
                Patient.tenant_id == tenant_id,
                Patient.is_active == True
            )
        )

        if source_ehr:
            base_query = base_query.where(Patient.source_ehr == source_ehr)

        result = await self.session.execute(base_query)
        row = result.one()

        return {
            'total_patients': row.total,
            'synced_from_ehr': row.synced,
            'last_sync_time': row.last_sync.isoformat() if row.last_sync else None,
            'source_ehr': source_ehr
        }

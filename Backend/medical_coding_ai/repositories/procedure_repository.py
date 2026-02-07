"""
Procedure Repository

Provides data access for EncounterProcedure records with:
- UPSERT logic using fhir_id for EHR sync
- CPT/HCPCS code operations
- AI suggestion tracking
- NCCI edit conflict tracking
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import EncounterProcedure

logger = logging.getLogger(__name__)


class ProcedureRepository(BaseRepository[EncounterProcedure]):
    """
    Repository for EncounterProcedure records.

    Maps to FHIR Procedure resources for procedure codes.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, EncounterProcedure)

    async def upsert_from_ehr(self, procedure_data: Dict[str, Any]) -> EncounterProcedure:
        """
        Upsert procedure from EHR sync using fhir_id for conflict resolution.

        Args:
            procedure_data: Procedure data dict with:
                - encounter_fhir_id: str (will be resolved to encounter_id) OR
                - encounter_id: UUID (required)
                - fhir_id: str (required for upsert)
                - procedure_code: str (required)
                - code_type: str (required, 'CPT' or 'HCPCS')
                - procedure_date: date (required)
                - source_ehr: str

        Returns:
            Upserted EncounterProcedure instance
        """
        fhir_id = procedure_data.get('fhir_id')
        encounter_fhir_id = procedure_data.get('encounter_fhir_id')
        encounter_id = procedure_data.get('encounter_id')

        if not fhir_id:
            raise ValueError("fhir_id is required for EHR upsert")

        # Resolve encounter_fhir_id to encounter_id UUID
        if encounter_fhir_id and not encounter_id:
            from ..models.ehr_models import Encounter
            encounter_query = select(Encounter.encounter_id).where(
                Encounter.fhir_id == encounter_fhir_id
            )
            result = await self.session.execute(encounter_query)
            encounter_id = result.scalar_one_or_none()

            if encounter_id:
                procedure_data['encounter_id'] = encounter_id
                # Remove encounter_fhir_id as it's not a valid column
                procedure_data.pop('encounter_fhir_id', None)
            else:
                logger.warning(f"Encounter with fhir_id {encounter_fhir_id} not found, skipping procedure")
                raise ValueError(f"Encounter with fhir_id {encounter_fhir_id} not found")

        if not encounter_id:
            raise ValueError("encounter_id or encounter_fhir_id is required for EHR upsert")

        # Check if procedure exists
        existing = await self.get_by_fhir_id_and_encounter(fhir_id, encounter_id)

        if existing:
            # Update existing procedure
            procedure_data['updated_at'] = datetime.utcnow()

            update_data = {k: v for k, v in procedure_data.items()
                          if k not in ['procedure_id', 'created_at', 'created_by']}

            for key, value in update_data.items():
                setattr(existing, key, value)

            await self.session.flush()
            await self.session.refresh(existing)
            logger.debug(f"Updated procedure {existing.procedure_id} from EHR sync")
            return existing
        else:
            new_procedure = EncounterProcedure(**procedure_data)
            self.session.add(new_procedure)
            await self.session.flush()
            await self.session.refresh(new_procedure)
            logger.debug(f"Created procedure {new_procedure.procedure_id} from EHR sync")
            return new_procedure

    async def get_by_fhir_id_and_encounter(
        self,
        fhir_id: str,
        encounter_id: UUID
    ) -> Optional[EncounterProcedure]:
        """
        Get procedure by FHIR ID and encounter.

        Args:
            fhir_id: FHIR Procedure resource ID
            encounter_id: Encounter UUID

        Returns:
            EncounterProcedure or None
        """
        query = select(EncounterProcedure).where(
            and_(
                EncounterProcedure.fhir_id == fhir_id,
                EncounterProcedure.encounter_id == encounter_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_encounter_procedures(
        self,
        encounter_id: UUID,
        include_ai_suggested: bool = True
    ) -> List[EncounterProcedure]:
        """
        Get all procedures for an encounter.

        Args:
            encounter_id: Encounter UUID
            include_ai_suggested: Include AI-suggested procedures

        Returns:
            List of procedures ordered by procedure_date
        """
        query = select(EncounterProcedure).where(
            EncounterProcedure.encounter_id == encounter_id
        )

        if not include_ai_suggested:
            query = query.where(EncounterProcedure.ai_suggested == False)

        query = query.order_by(EncounterProcedure.procedure_date)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_code(
        self,
        procedure_code: str,
        encounter_id: Optional[UUID] = None,
        code_type: Optional[str] = None
    ) -> List[EncounterProcedure]:
        """
        Find procedures by code.

        Args:
            procedure_code: CPT or HCPCS code
            encounter_id: Optional encounter filter
            code_type: Optional code type filter ('CPT' or 'HCPCS')

        Returns:
            List of matching procedures
        """
        query = select(EncounterProcedure).where(
            EncounterProcedure.procedure_code == procedure_code
        )

        if encounter_id:
            query = query.where(EncounterProcedure.encounter_id == encounter_id)

        if code_type:
            query = query.where(EncounterProcedure.code_type == code_type)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_ai_suggested_procedures(
        self,
        encounter_id: UUID,
        min_confidence: float = 0.8
    ) -> List[EncounterProcedure]:
        """
        Get AI-suggested procedures above confidence threshold.

        Args:
            encounter_id: Encounter UUID
            min_confidence: Minimum confidence score (0-1)

        Returns:
            List of AI-suggested procedures
        """
        query = select(EncounterProcedure).where(
            and_(
                EncounterProcedure.encounter_id == encounter_id,
                EncounterProcedure.ai_suggested == True,
                EncounterProcedure.ai_confidence_score >= min_confidence
            )
        ).order_by(EncounterProcedure.ai_confidence_score.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_procedures_with_ncci_conflicts(
        self,
        encounter_id: UUID
    ) -> List[EncounterProcedure]:
        """
        Get procedures flagged with NCCI edit conflicts.

        Args:
            encounter_id: Encounter UUID

        Returns:
            List of procedures with NCCI conflicts
        """
        query = select(EncounterProcedure).where(
            and_(
                EncounterProcedure.encounter_id == encounter_id,
                EncounterProcedure.ncci_conflict == True
            )
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def validate_procedure(
        self,
        procedure_id: UUID,
        user_id: UUID,
        validation_notes: Optional[str] = None
    ) -> Optional[EncounterProcedure]:
        """
        Mark a procedure as validated by a user.

        Args:
            procedure_id: Procedure UUID
            user_id: Validating user UUID
            validation_notes: Optional notes

        Returns:
            Updated procedure or None
        """
        update_data = {
            'validated_by': user_id,
            'validated_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        if validation_notes:
            update_data['validation_notes'] = validation_notes

        return await self.update(procedure_id, update_data)

    async def set_ncci_conflict(
        self,
        procedure_id: UUID,
        has_conflict: bool,
        override_reason: Optional[str] = None
    ) -> Optional[EncounterProcedure]:
        """
        Set NCCI conflict flag on a procedure.

        Args:
            procedure_id: Procedure UUID
            has_conflict: Whether there's an NCCI conflict
            override_reason: Reason for overriding the conflict

        Returns:
            Updated procedure or None
        """
        update_data = {
            'ncci_conflict': has_conflict,
            'updated_at': datetime.utcnow()
        }

        if override_reason:
            update_data['ncci_override_reason'] = override_reason

        return await self.update(procedure_id, update_data)

    async def get_common_codes(
        self,
        tenant_id: UUID,
        code_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get most commonly used procedure codes for a tenant.

        Args:
            tenant_id: Tenant UUID
            code_type: Filter by code type ('CPT' or 'HCPCS')
            limit: Number of codes to return

        Returns:
            List of dicts with code and usage count
        """
        from ..models.ehr_models import Encounter

        query = (
            select(
                EncounterProcedure.procedure_code,
                EncounterProcedure.code_type,
                EncounterProcedure.procedure_description,
                func.count(EncounterProcedure.procedure_id).label('usage_count')
            )
            .join(Encounter, Encounter.encounter_id == EncounterProcedure.encounter_id)
            .where(Encounter.tenant_id == tenant_id)
        )

        if code_type:
            query = query.where(EncounterProcedure.code_type == code_type)

        query = (
            query
            .group_by(
                EncounterProcedure.procedure_code,
                EncounterProcedure.code_type,
                EncounterProcedure.procedure_description
            )
            .order_by(func.count(EncounterProcedure.procedure_id).desc())
            .limit(limit)
        )

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                'procedure_code': row.procedure_code,
                'code_type': row.code_type,
                'description': row.procedure_description,
                'usage_count': row.usage_count
            }
            for row in rows
        ]

    async def get_procedures_by_date_range(
        self,
        tenant_id: UUID,
        start_date: date,
        end_date: date,
        code_type: Optional[str] = None
    ) -> List[EncounterProcedure]:
        """
        Get procedures within a date range.

        Args:
            tenant_id: Tenant UUID
            start_date: Start of date range
            end_date: End of date range
            code_type: Optional code type filter

        Returns:
            List of procedures
        """
        from ..models.ehr_models import Encounter

        query = (
            select(EncounterProcedure)
            .join(Encounter, Encounter.encounter_id == EncounterProcedure.encounter_id)
            .where(
                and_(
                    Encounter.tenant_id == tenant_id,
                    EncounterProcedure.procedure_date >= start_date,
                    EncounterProcedure.procedure_date <= end_date
                )
            )
        )

        if code_type:
            query = query.where(EncounterProcedure.code_type == code_type)

        query = query.order_by(EncounterProcedure.procedure_date)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def bulk_create(
        self,
        procedures: List[Dict[str, Any]]
    ) -> List[EncounterProcedure]:
        """
        Create multiple procedures at once.

        Args:
            procedures: List of procedure data dicts

        Returns:
            List of created procedures
        """
        created = []
        for procedure_data in procedures:
            procedure = EncounterProcedure(**procedure_data)
            self.session.add(procedure)
            created.append(procedure)

        await self.session.flush()

        for procedure in created:
            await self.session.refresh(procedure)

        return created

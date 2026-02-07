"""
Condition (Diagnosis) Repository

Provides data access for EncounterDiagnosis records with:
- UPSERT logic using fhir_id for EHR sync
- ICD-10 code operations
- AI suggestion tracking
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import EncounterDiagnosis

logger = logging.getLogger(__name__)


class ConditionRepository(BaseRepository[EncounterDiagnosis]):
    """
    Repository for EncounterDiagnosis (Condition) records.

    Maps to FHIR Condition resources for diagnosis codes.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, EncounterDiagnosis)

    async def upsert_from_ehr(self, condition_data: Dict[str, Any]) -> EncounterDiagnosis:
        """
        Upsert diagnosis from EHR sync using fhir_id for conflict resolution.

        Args:
            condition_data: Condition data dict with:
                - encounter_fhir_id: str (will be resolved to encounter_id)
                - fhir_id: str (required for upsert)
                - icd10_code: str (required)
                - diagnosis_description: str
                - source_ehr: str

        Returns:
            Upserted EncounterDiagnosis instance
        """
        fhir_id = condition_data.get('fhir_id')
        encounter_fhir_id = condition_data.get('encounter_fhir_id')
        encounter_id = condition_data.get('encounter_id')

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
                condition_data['encounter_id'] = encounter_id
                # Remove encounter_fhir_id as it's not a valid column
                condition_data.pop('encounter_fhir_id', None)
            else:
                logger.warning(f"Encounter with fhir_id {encounter_fhir_id} not found, skipping condition")
                raise ValueError(f"Encounter with fhir_id {encounter_fhir_id} not found")

        if not encounter_id:
            raise ValueError("encounter_id or encounter_fhir_id is required for EHR upsert")

        # Check if condition exists
        existing = await self.get_by_fhir_id_and_encounter(fhir_id, encounter_id)

        if existing:
            # Update existing condition
            condition_data['updated_at'] = datetime.utcnow()

            update_data = {k: v for k, v in condition_data.items()
                          if k not in ['diagnosis_id', 'created_at', 'created_by']}

            for key, value in update_data.items():
                setattr(existing, key, value)

            await self.session.flush()
            await self.session.refresh(existing)
            logger.debug(f"Updated condition {existing.diagnosis_id} from EHR sync")
            return existing
        else:
            new_condition = EncounterDiagnosis(**condition_data)
            self.session.add(new_condition)
            await self.session.flush()
            await self.session.refresh(new_condition)
            logger.debug(f"Created condition {new_condition.diagnosis_id} from EHR sync")
            return new_condition

    async def get_by_fhir_id_and_encounter(
        self,
        fhir_id: str,
        encounter_id: UUID
    ) -> Optional[EncounterDiagnosis]:
        """
        Get condition by FHIR ID and encounter.

        Args:
            fhir_id: FHIR Condition resource ID
            encounter_id: Encounter UUID

        Returns:
            EncounterDiagnosis or None
        """
        query = select(EncounterDiagnosis).where(
            and_(
                EncounterDiagnosis.fhir_id == fhir_id,
                EncounterDiagnosis.encounter_id == encounter_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_encounter_diagnoses(
        self,
        encounter_id: UUID,
        include_ai_suggested: bool = True
    ) -> List[EncounterDiagnosis]:
        """
        Get all diagnoses for an encounter.

        Args:
            encounter_id: Encounter UUID
            include_ai_suggested: Include AI-suggested diagnoses

        Returns:
            List of diagnoses ordered by diagnosis_order
        """
        query = select(EncounterDiagnosis).where(
            EncounterDiagnosis.encounter_id == encounter_id
        )

        if not include_ai_suggested:
            query = query.where(EncounterDiagnosis.ai_suggested == False)

        query = query.order_by(EncounterDiagnosis.diagnosis_order)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_icd10_code(
        self,
        icd10_code: str,
        encounter_id: Optional[UUID] = None
    ) -> List[EncounterDiagnosis]:
        """
        Find diagnoses by ICD-10 code.

        Args:
            icd10_code: ICD-10 code to search
            encounter_id: Optional encounter filter

        Returns:
            List of matching diagnoses
        """
        query = select(EncounterDiagnosis).where(
            EncounterDiagnosis.icd10_code == icd10_code
        )

        if encounter_id:
            query = query.where(EncounterDiagnosis.encounter_id == encounter_id)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_ai_suggested_diagnoses(
        self,
        encounter_id: UUID,
        min_confidence: float = 0.8
    ) -> List[EncounterDiagnosis]:
        """
        Get AI-suggested diagnoses above confidence threshold.

        Args:
            encounter_id: Encounter UUID
            min_confidence: Minimum confidence score (0-1)

        Returns:
            List of AI-suggested diagnoses
        """
        query = select(EncounterDiagnosis).where(
            and_(
                EncounterDiagnosis.encounter_id == encounter_id,
                EncounterDiagnosis.ai_suggested == True,
                EncounterDiagnosis.ai_confidence_score >= min_confidence
            )
        ).order_by(EncounterDiagnosis.ai_confidence_score.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def validate_diagnosis(
        self,
        diagnosis_id: UUID,
        user_id: UUID,
        validation_notes: Optional[str] = None
    ) -> Optional[EncounterDiagnosis]:
        """
        Mark a diagnosis as validated by a user.

        Args:
            diagnosis_id: Diagnosis UUID
            user_id: Validating user UUID
            validation_notes: Optional notes

        Returns:
            Updated diagnosis or None
        """
        update_data = {
            'validated_by': user_id,
            'validated_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        if validation_notes:
            update_data['validation_notes'] = validation_notes

        return await self.update(diagnosis_id, update_data)

    async def get_common_codes(
        self,
        tenant_id: UUID,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get most commonly used ICD-10 codes for a tenant.

        Args:
            tenant_id: Tenant UUID
            limit: Number of codes to return

        Returns:
            List of dicts with code and usage count
        """
        from ..models.ehr_models import Encounter

        query = (
            select(
                EncounterDiagnosis.icd10_code,
                EncounterDiagnosis.diagnosis_description,
                func.count(EncounterDiagnosis.diagnosis_id).label('usage_count')
            )
            .join(Encounter, Encounter.encounter_id == EncounterDiagnosis.encounter_id)
            .where(Encounter.tenant_id == tenant_id)
            .group_by(
                EncounterDiagnosis.icd10_code,
                EncounterDiagnosis.diagnosis_description
            )
            .order_by(func.count(EncounterDiagnosis.diagnosis_id).desc())
            .limit(limit)
        )

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                'icd10_code': row.icd10_code,
                'description': row.diagnosis_description,
                'usage_count': row.usage_count
            }
            for row in rows
        ]

    async def bulk_create(
        self,
        diagnoses: List[Dict[str, Any]]
    ) -> List[EncounterDiagnosis]:
        """
        Create multiple diagnoses at once.

        Args:
            diagnoses: List of diagnosis data dicts

        Returns:
            List of created diagnoses
        """
        created = []
        for diagnosis_data in diagnoses:
            diagnosis = EncounterDiagnosis(**diagnosis_data)
            self.session.add(diagnosis)
            created.append(diagnosis)

        await self.session.flush()

        for diagnosis in created:
            await self.session.refresh(diagnosis)

        return created

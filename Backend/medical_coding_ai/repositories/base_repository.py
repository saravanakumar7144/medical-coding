"""
Base Repository

Provides common CRUD operations with multi-tenant isolation.
All repositories should extend this base class.
"""

from typing import TypeVar, Generic, List, Optional, Dict, Any, Type
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import DeclarativeBase
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=DeclarativeBase)


class BaseRepository(Generic[T]):
    """
    Base repository with common CRUD operations.

    Provides:
    - Multi-tenant isolation via tenant_id filtering
    - Pagination support
    - Soft-delete capability
    - Audit timestamp handling
    """

    def __init__(self, session: AsyncSession, model_class: Type[T]):
        """
        Initialize repository.

        Args:
            session: SQLAlchemy async session
            model_class: SQLAlchemy model class
        """
        self.session = session
        self.model_class = model_class

    async def get_by_id(
        self,
        record_id: UUID,
        tenant_id: Optional[UUID] = None
    ) -> Optional[T]:
        """
        Get record by primary key ID.

        Args:
            record_id: Primary key UUID
            tenant_id: Optional tenant filter for multi-tenant isolation

        Returns:
            Model instance or None
        """
        pk_column = self._get_primary_key_column()
        query = select(self.model_class).where(pk_column == record_id)

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_fhir_id(
        self,
        fhir_id: str,
        tenant_id: Optional[UUID] = None,
        source_ehr: Optional[str] = None
    ) -> Optional[T]:
        """
        Get record by FHIR resource ID.

        Args:
            fhir_id: FHIR resource ID from EHR
            tenant_id: Optional tenant filter
            source_ehr: Optional EHR system filter

        Returns:
            Model instance or None
        """
        if not hasattr(self.model_class, 'fhir_id'):
            raise ValueError(f"{self.model_class.__name__} does not have fhir_id column")

        query = select(self.model_class).where(self.model_class.fhir_id == fhir_id)

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        if source_ehr and hasattr(self.model_class, 'source_ehr'):
            query = query.where(self.model_class.source_ehr == source_ehr)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        tenant_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True
    ) -> List[T]:
        """
        List records with pagination.

        Args:
            tenant_id: Optional tenant filter
            skip: Number of records to skip (offset)
            limit: Maximum records to return
            active_only: Only return active records

        Returns:
            List of model instances
        """
        query = select(self.model_class)

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        if active_only and hasattr(self.model_class, 'is_active'):
            query = query.where(self.model_class.is_active == True)

        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create(self, data: Dict[str, Any]) -> T:
        """
        Create a new record.

        Args:
            data: Dictionary of column values

        Returns:
            Created model instance
        """
        instance = self.model_class(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(
        self,
        record_id: UUID,
        data: Dict[str, Any],
        tenant_id: Optional[UUID] = None
    ) -> Optional[T]:
        """
        Update an existing record.

        Args:
            record_id: Primary key UUID
            data: Dictionary of column values to update
            tenant_id: Optional tenant filter

        Returns:
            Updated model instance or None
        """
        # Add audit timestamp
        if hasattr(self.model_class, 'updated_at'):
            data['updated_at'] = datetime.utcnow()

        pk_column = self._get_primary_key_column()
        query = (
            update(self.model_class)
            .where(pk_column == record_id)
            .values(**data)
            .returning(self.model_class)
        )

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def delete(
        self,
        record_id: UUID,
        tenant_id: Optional[UUID] = None,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete a record.

        Args:
            record_id: Primary key UUID
            tenant_id: Optional tenant filter
            soft_delete: If True and model has is_active, set to False instead of deleting

        Returns:
            True if record was deleted/deactivated
        """
        pk_column = self._get_primary_key_column()

        if soft_delete and hasattr(self.model_class, 'is_active'):
            return await self.update(record_id, {'is_active': False}, tenant_id) is not None

        query = delete(self.model_class).where(pk_column == record_id)

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        result = await self.session.execute(query)
        return result.rowcount > 0

    async def count(
        self,
        tenant_id: Optional[UUID] = None,
        active_only: bool = True
    ) -> int:
        """
        Count total records.

        Args:
            tenant_id: Optional tenant filter
            active_only: Only count active records

        Returns:
            Total count
        """
        from sqlalchemy import func

        query = select(func.count()).select_from(self.model_class)

        if tenant_id and hasattr(self.model_class, 'tenant_id'):
            query = query.where(self.model_class.tenant_id == tenant_id)

        if active_only and hasattr(self.model_class, 'is_active'):
            query = query.where(self.model_class.is_active == True)

        result = await self.session.execute(query)
        return result.scalar_one()

    def _get_primary_key_column(self):
        """Get the primary key column of the model."""
        mapper = self.model_class.__mapper__
        pk_columns = mapper.primary_key
        if len(pk_columns) != 1:
            raise ValueError(f"Model {self.model_class.__name__} must have exactly one primary key")
        return pk_columns[0]

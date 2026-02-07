"""
Sync State Repository

Provides data access for SyncState records.
Tracks sync state for each resource type per EHR connection.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import SyncState

logger = logging.getLogger(__name__)


class SyncStateRepository(BaseRepository[SyncState]):
    """
    Repository for SyncState records.

    Tracks sync progress for each resource type (Patient, Encounter, etc.)
    per EHR connection.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, SyncState)

    async def get_by_connection_and_resource(
        self,
        connection_id: UUID,
        resource_type: str
    ) -> Optional[SyncState]:
        """
        Get sync state for a specific connection and resource type.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type ('Patient', 'Encounter', etc.)

        Returns:
            SyncState or None
        """
        query = select(SyncState).where(
            and_(
                SyncState.connection_id == connection_id,
                SyncState.resource_type == resource_type
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_connection_sync_states(
        self,
        connection_id: UUID
    ) -> List[SyncState]:
        """
        Get all sync states for a connection.

        Args:
            connection_id: EHR connection UUID

        Returns:
            List of sync states for all resource types
        """
        query = select(SyncState).where(
            SyncState.connection_id == connection_id
        ).order_by(SyncState.resource_type)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_or_create(
        self,
        connection_id: UUID,
        resource_type: str
    ) -> SyncState:
        """
        Get existing sync state or create a new one.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type

        Returns:
            SyncState (existing or newly created)
        """
        existing = await self.get_by_connection_and_resource(
            connection_id, resource_type
        )

        if existing:
            return existing

        # Create new sync state
        sync_state = SyncState(
            connection_id=connection_id,
            resource_type=resource_type,
            last_sync_status='pending',
            records_processed=0,
            records_created=0,
            records_updated=0,
            error_count=0
        )

        self.session.add(sync_state)
        await self.session.flush()
        await self.session.refresh(sync_state)

        logger.info(
            f"Created sync state for connection {connection_id}, "
            f"resource {resource_type}"
        )

        return sync_state

    async def update_sync_success(
        self,
        connection_id: UUID,
        resource_type: str,
        records_processed: int,
        records_created: int,
        records_updated: int
    ) -> SyncState:
        """
        Update sync state after successful sync.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type
            records_processed: Number of records processed
            records_created: Number of new records created
            records_updated: Number of existing records updated

        Returns:
            Updated SyncState
        """
        sync_state = await self.get_or_create(connection_id, resource_type)

        sync_state.last_sync_time = datetime.utcnow()
        sync_state.last_sync_status = 'success'
        sync_state.records_processed = (sync_state.records_processed or 0) + records_processed
        sync_state.records_created = (sync_state.records_created or 0) + records_created
        sync_state.records_updated = (sync_state.records_updated or 0) + records_updated
        sync_state.error_message = None

        await self.session.flush()
        await self.session.refresh(sync_state)

        logger.debug(
            f"Sync success for {resource_type}: "
            f"processed={records_processed}, created={records_created}, updated={records_updated}"
        )

        return sync_state

    async def update_sync_error(
        self,
        connection_id: UUID,
        resource_type: str,
        error_message: str
    ) -> SyncState:
        """
        Update sync state after sync error.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type
            error_message: Error description

        Returns:
            Updated SyncState
        """
        sync_state = await self.get_or_create(connection_id, resource_type)

        sync_state.last_sync_time = datetime.utcnow()
        sync_state.last_sync_status = 'error'
        sync_state.error_count = (sync_state.error_count or 0) + 1
        sync_state.error_message = error_message

        await self.session.flush()
        await self.session.refresh(sync_state)

        logger.warning(
            f"Sync error for {resource_type}: {error_message}"
        )

        return sync_state

    async def mark_sync_in_progress(
        self,
        connection_id: UUID,
        resource_type: str
    ) -> SyncState:
        """
        Mark sync as in progress.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type

        Returns:
            Updated SyncState
        """
        sync_state = await self.get_or_create(connection_id, resource_type)

        sync_state.last_sync_status = 'in_progress'

        await self.session.flush()
        await self.session.refresh(sync_state)

        return sync_state

    async def get_last_sync_time(
        self,
        connection_id: UUID,
        resource_type: str
    ) -> Optional[datetime]:
        """
        Get the last successful sync time for a resource type.

        Args:
            connection_id: EHR connection UUID
            resource_type: FHIR resource type

        Returns:
            Last sync datetime or None
        """
        sync_state = await self.get_by_connection_and_resource(
            connection_id, resource_type
        )

        if sync_state and sync_state.last_sync_status == 'success':
            return sync_state.last_sync_time

        return None

    async def get_sync_summary(
        self,
        connection_id: UUID
    ) -> Dict[str, Any]:
        """
        Get sync summary for a connection.

        Args:
            connection_id: EHR connection UUID

        Returns:
            Dict with sync statistics by resource type
        """
        sync_states = await self.get_connection_sync_states(connection_id)

        summary = {
            'connection_id': str(connection_id),
            'resources': {}
        }

        for state in sync_states:
            summary['resources'][state.resource_type] = {
                'status': state.last_sync_status,
                'last_sync': state.last_sync_time.isoformat() if state.last_sync_time else None,
                'records_processed': state.records_processed or 0,
                'records_created': state.records_created or 0,
                'records_updated': state.records_updated or 0,
                'error_count': state.error_count or 0,
                'last_error': state.error_message
            }

        return summary

    async def reset_sync_state(
        self,
        connection_id: UUID,
        resource_type: Optional[str] = None
    ) -> int:
        """
        Reset sync state (for re-sync scenarios).

        Args:
            connection_id: EHR connection UUID
            resource_type: Optional specific resource type to reset

        Returns:
            Number of sync states reset
        """
        if resource_type:
            sync_state = await self.get_by_connection_and_resource(
                connection_id, resource_type
            )
            if sync_state:
                sync_state.last_sync_time = None
                sync_state.last_sync_status = 'pending'
                sync_state.records_processed = 0
                sync_state.records_created = 0
                sync_state.records_updated = 0
                sync_state.error_count = 0
                sync_state.error_message = None
                await self.session.flush()
                return 1
            return 0
        else:
            sync_states = await self.get_connection_sync_states(connection_id)
            for state in sync_states:
                state.last_sync_time = None
                state.last_sync_status = 'pending'
                state.records_processed = 0
                state.records_created = 0
                state.records_updated = 0
                state.error_count = 0
                state.error_message = None
            await self.session.flush()
            return len(sync_states)

    async def get_failed_syncs(
        self,
        max_retries: int = 3
    ) -> List[SyncState]:
        """
        Get sync states that have failed but haven't exceeded retry limit.

        Args:
            max_retries: Maximum error count before giving up

        Returns:
            List of sync states eligible for retry
        """
        query = select(SyncState).where(
            and_(
                SyncState.last_sync_status == 'error',
                SyncState.error_count < max_retries
            )
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

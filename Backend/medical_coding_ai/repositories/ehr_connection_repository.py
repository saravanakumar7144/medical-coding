"""
EHR Connection Repository

Provides data access for EHRConnection records.
Manages EHR system connection configurations for polling.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import logging

from .base_repository import BaseRepository
from ..models.ehr_models import EHRConnection, SyncState

logger = logging.getLogger(__name__)


class EHRConnectionRepository(BaseRepository[EHRConnection]):
    """
    Repository for EHRConnection records.

    Manages EHR system configurations used by pollers.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(session, EHRConnection)

    async def get_active_connections(
        self,
        tenant_id: Optional[UUID] = None,
        ehr_type: Optional[str] = None
    ) -> List[EHRConnection]:
        """
        Get all active EHR connections.

        Args:
            tenant_id: Optional tenant filter
            ehr_type: Optional EHR type filter ('epic', 'athena', etc.)

        Returns:
            List of active connections
        """
        query = select(EHRConnection).where(EHRConnection.is_active == True)

        if tenant_id:
            query = query.where(EHRConnection.tenant_id == tenant_id)

        if ehr_type:
            query = query.where(EHRConnection.ehr_type == ehr_type)

        query = query.order_by(EHRConnection.organization_name)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_connection_with_sync_states(
        self,
        connection_id: UUID,
        tenant_id: Optional[UUID] = None
    ) -> Optional[EHRConnection]:
        """
        Get connection with sync states loaded.

        Args:
            connection_id: Connection UUID
            tenant_id: Optional tenant filter

        Returns:
            Connection with sync_states relationship loaded
        """
        query = (
            select(EHRConnection)
            .options(selectinload(EHRConnection.sync_states))
            .where(EHRConnection.connection_id == connection_id)
        )

        if tenant_id:
            query = query.where(EHRConnection.tenant_id == tenant_id)

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_organization(
        self,
        organization_id: str,
        tenant_id: UUID,
        ehr_type: str
    ) -> Optional[EHRConnection]:
        """
        Get connection by organization ID.

        Args:
            organization_id: External EHR organization ID
            tenant_id: Tenant UUID
            ehr_type: EHR type

        Returns:
            EHRConnection or None
        """
        query = select(EHRConnection).where(
            and_(
                EHRConnection.organization_id == organization_id,
                EHRConnection.tenant_id == tenant_id,
                EHRConnection.ehr_type == ehr_type
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def create_connection(
        self,
        connection_data: Dict[str, Any]
    ) -> EHRConnection:
        """
        Create a new EHR connection.

        Args:
            connection_data: Connection configuration dict

        Returns:
            Created EHRConnection
        """
        connection = EHRConnection(**connection_data)
        self.session.add(connection)
        await self.session.flush()
        await self.session.refresh(connection)

        logger.info(
            f"Created EHR connection {connection.connection_id} "
            f"for {connection.ehr_type} / {connection.organization_name}"
        )

        return connection

    async def update_sync_status(
        self,
        connection_id: UUID,
        status: str,
        error: Optional[str] = None
    ) -> Optional[EHRConnection]:
        """
        Update connection sync status after a sync cycle.

        Args:
            connection_id: Connection UUID
            status: Sync status ('success', 'error', 'in_progress')
            error: Error message if status is 'error'

        Returns:
            Updated connection or None
        """
        update_data = {
            'last_sync_at': datetime.utcnow(),
            'last_sync_status': status,
            'updated_at': datetime.utcnow()
        }

        if error:
            update_data['last_sync_error'] = error
        elif status == 'success':
            update_data['last_sync_error'] = None

        return await self.update(connection_id, update_data)

    async def deactivate_connection(
        self,
        connection_id: UUID,
        tenant_id: UUID,
        user_id: Optional[UUID] = None
    ) -> bool:
        """
        Deactivate an EHR connection.

        Args:
            connection_id: Connection UUID
            tenant_id: Tenant UUID
            user_id: User making the change

        Returns:
            True if deactivated
        """
        update_data = {
            'is_active': False,
            'updated_at': datetime.utcnow()
        }

        if user_id:
            update_data['updated_by'] = user_id

        result = await self.update(connection_id, update_data, tenant_id)
        return result is not None

    async def get_connections_needing_sync(
        self,
        max_age_seconds: int = 60
    ) -> List[EHRConnection]:
        """
        Get connections that need to be synced.

        Args:
            max_age_seconds: Consider stale if last sync older than this

        Returns:
            List of connections needing sync
        """
        from datetime import timedelta

        stale_threshold = datetime.utcnow() - timedelta(seconds=max_age_seconds)

        query = select(EHRConnection).where(
            and_(
                EHRConnection.is_active == True,
                EHRConnection.last_sync_at < stale_threshold
            )
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_connection_stats(
        self,
        tenant_id: UUID
    ) -> Dict[str, Any]:
        """
        Get connection statistics for a tenant.

        Args:
            tenant_id: Tenant UUID

        Returns:
            Dict with connection statistics
        """
        from sqlalchemy import func

        query = select(
            func.count(EHRConnection.connection_id).label('total'),
            func.count(EHRConnection.connection_id).filter(
                EHRConnection.is_active == True
            ).label('active'),
            func.count(EHRConnection.connection_id).filter(
                EHRConnection.last_sync_status == 'error'
            ).label('with_errors')
        ).where(EHRConnection.tenant_id == tenant_id)

        result = await self.session.execute(query)
        row = result.one()

        # Get count by EHR type
        type_query = select(
            EHRConnection.ehr_type,
            func.count(EHRConnection.connection_id).label('count')
        ).where(
            and_(
                EHRConnection.tenant_id == tenant_id,
                EHRConnection.is_active == True
            )
        ).group_by(EHRConnection.ehr_type)

        type_result = await self.session.execute(type_query)
        by_type = {r.ehr_type: r.count for r in type_result.all()}

        return {
            'total_connections': row.total,
            'active_connections': row.active,
            'connections_with_errors': row.with_errors,
            'by_ehr_type': by_type
        }

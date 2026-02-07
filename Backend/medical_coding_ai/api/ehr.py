"""
EHR Integration API

Endpoints for managing EHR connections, sync status, and polling operations.

Endpoints include:
- EHR connection configuration (CRUD)
- Sync status monitoring
- Poller control (start/stop/trigger)
- Data sync statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import logging

from ..utils.db import get_db
from ..api.deps import get_current_user, require_admin
from ..models.user_models import User
from ..models.ehr_models import EHRConnection, SyncState
from ..repositories.ehr_connection_repository import EHRConnectionRepository
from ..repositories.sync_state_repository import SyncStateRepository
from ..repositories.patient_repository import PatientRepository
from ..repositories.encounter_repository import EncounterRepository

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# PYDANTIC MODELS - Request/Response Schemas
# ============================================================================

class EHRConnectionCreate(BaseModel):
    """Schema for creating a new EHR connection."""
    ehr_type: str = Field(..., description="EHR system type: epic, athena, cerner, meditech")
    organization_name: str = Field(..., min_length=1, max_length=255)
    organization_id: Optional[str] = Field(None, description="External organization ID in EHR")
    base_url: str = Field(..., description="FHIR API base URL")
    client_id: Optional[str] = Field(None, description="OAuth client ID")
    client_secret: Optional[str] = Field(None, description="OAuth client secret")
    private_key: Optional[str] = Field(None, description="JWT signing key for Epic Backend Services")
    public_key_id: Optional[str] = Field(None, description="Key ID for JWT")
    poll_interval_seconds: int = Field(30, ge=10, le=3600, description="Polling interval (10-3600 seconds)")
    use_mock_data: bool = Field(True, description="Use mock FHIR data for testing")


class EHRConnectionUpdate(BaseModel):
    """Schema for updating an EHR connection."""
    organization_name: Optional[str] = Field(None, min_length=1, max_length=255)
    base_url: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    private_key: Optional[str] = None
    poll_interval_seconds: Optional[int] = Field(None, ge=10, le=3600)
    use_mock_data: Optional[bool] = None
    is_active: Optional[bool] = None


class EHRConnectionResponse(BaseModel):
    """Schema for EHR connection response."""
    connection_id: uuid.UUID
    tenant_id: uuid.UUID
    ehr_type: str
    organization_name: str
    organization_id: Optional[str]
    base_url: str
    poll_interval_seconds: int
    is_active: bool
    use_mock_data: bool
    last_sync_at: Optional[datetime]
    last_sync_status: Optional[str]
    last_sync_error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SyncStateResponse(BaseModel):
    """Schema for sync state response."""
    sync_id: uuid.UUID
    connection_id: uuid.UUID
    resource_type: str
    last_sync_time: Optional[datetime]
    last_sync_status: str
    records_processed: int
    records_created: int
    records_updated: int
    error_count: int
    error_message: Optional[str]

    class Config:
        from_attributes = True


class SyncStatusResponse(BaseModel):
    """Schema for overall sync status response."""
    connection_id: uuid.UUID
    organization_name: str
    ehr_type: str
    is_active: bool
    last_sync_at: Optional[datetime]
    last_sync_status: Optional[str]
    resources: Dict[str, Any]


class SyncStatsResponse(BaseModel):
    """Schema for sync statistics."""
    patients: Dict[str, Any]
    encounters: Dict[str, Any]
    total_records_synced: int
    last_sync_time: Optional[datetime]


class TriggerSyncRequest(BaseModel):
    """Schema for triggering a manual sync."""
    resource_types: Optional[List[str]] = Field(
        None,
        description="Resource types to sync. Empty = all resources."
    )


# ============================================================================
# EHR CONNECTION ENDPOINTS
# ============================================================================

@router.get("/connections", response_model=List[EHRConnectionResponse])
async def list_ehr_connections(
    ehr_type: Optional[str] = Query(None, description="Filter by EHR type"),
    active_only: bool = Query(True, description="Only return active connections"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all EHR connections for the current tenant.

    Returns configured EHR connections that can be used for data polling.
    """
    repo = EHRConnectionRepository(db)
    connections = await repo.get_active_connections(
        tenant_id=current_user.tenant_id,
        ehr_type=ehr_type
    )

    if not active_only:
        all_connections = await repo.list_all(
            tenant_id=current_user.tenant_id,
            active_only=False
        )
        connections = all_connections

    return connections


@router.post("/connections", response_model=EHRConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_ehr_connection(
    connection: EHRConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new EHR connection configuration.

    Requires admin role. Creates a connection that can be used by
    the polling service to sync data from an EHR system.
    """
    # Validate EHR type
    valid_types = ['epic', 'athena', 'cerner', 'meditech']
    if connection.ehr_type.lower() not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ehr_type. Must be one of: {', '.join(valid_types)}"
        )

    repo = EHRConnectionRepository(db)

    # Check for existing connection with same organization
    if connection.organization_id:
        existing = await repo.get_by_organization(
            organization_id=connection.organization_id,
            tenant_id=current_user.tenant_id,
            ehr_type=connection.ehr_type.lower()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Connection already exists for organization {connection.organization_id}"
            )

    # Create connection
    connection_data = {
        'tenant_id': current_user.tenant_id,
        'ehr_type': connection.ehr_type.lower(),
        'organization_name': connection.organization_name,
        'organization_id': connection.organization_id,
        'base_url': connection.base_url,
        'client_id': connection.client_id,
        'client_secret': connection.client_secret,
        'private_key': connection.private_key,
        'public_key_id': connection.public_key_id,
        'poll_interval_seconds': connection.poll_interval_seconds,
        'use_mock_data': connection.use_mock_data,
        'is_active': True,
        'created_by': current_user.user_id
    }

    new_connection = await repo.create_connection(connection_data)
    await db.commit()

    logger.info(
        f"Created EHR connection {new_connection.connection_id} "
        f"for {connection.ehr_type}/{connection.organization_name} "
        f"by user {current_user.user_id}"
    )

    # Auto-reload scheduler to pick up new connection
    try:
        from pollers.scheduler import reload_connections
        reload_result = await reload_connections()
        logger.info(f"Scheduler reloaded after connection creation: {reload_result}")
    except Exception as e:
        logger.warning(f"Failed to reload scheduler: {e}")

    return new_connection


@router.get("/connections/{connection_id}", response_model=EHRConnectionResponse)
async def get_ehr_connection(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific EHR connection.
    """
    repo = EHRConnectionRepository(db)
    connection = await repo.get_by_id(connection_id, current_user.tenant_id)

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    return connection


@router.patch("/connections/{connection_id}", response_model=EHRConnectionResponse)
async def update_ehr_connection(
    connection_id: uuid.UUID,
    updates: EHRConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update an EHR connection configuration.

    Requires admin role.
    """
    repo = EHRConnectionRepository(db)
    connection = await repo.get_by_id(connection_id, current_user.tenant_id)

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    # Build update data
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    update_data['updated_by'] = current_user.user_id
    update_data['updated_at'] = datetime.utcnow()

    updated = await repo.update(connection_id, update_data, current_user.tenant_id)
    await db.commit()

    return updated


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ehr_connection(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Deactivate an EHR connection.

    Requires admin role. This soft-deletes the connection by setting is_active=False.
    """
    repo = EHRConnectionRepository(db)

    success = await repo.deactivate_connection(
        connection_id=connection_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.user_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    await db.commit()


# ============================================================================
# SYNC STATUS ENDPOINTS
# ============================================================================

@router.get("/sync-status", response_model=List[SyncStatusResponse])
async def get_sync_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sync status for all active EHR connections.

    Returns the current sync status including last sync time,
    status, and per-resource statistics.
    """
    conn_repo = EHRConnectionRepository(db)
    sync_repo = SyncStateRepository(db)

    connections = await conn_repo.get_active_connections(
        tenant_id=current_user.tenant_id
    )

    results = []
    for connection in connections:
        sync_summary = await sync_repo.get_sync_summary(connection.connection_id)

        results.append(SyncStatusResponse(
            connection_id=connection.connection_id,
            organization_name=connection.organization_name,
            ehr_type=connection.ehr_type,
            is_active=connection.is_active,
            last_sync_at=connection.last_sync_at,
            last_sync_status=connection.last_sync_status,
            resources=sync_summary.get('resources', {})
        ))

    return results


@router.get("/sync-status/{connection_id}", response_model=SyncStatusResponse)
async def get_connection_sync_status(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed sync status for a specific connection.
    """
    conn_repo = EHRConnectionRepository(db)
    sync_repo = SyncStateRepository(db)

    connection = await conn_repo.get_by_id(connection_id, current_user.tenant_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    sync_summary = await sync_repo.get_sync_summary(connection_id)

    return SyncStatusResponse(
        connection_id=connection.connection_id,
        organization_name=connection.organization_name,
        ehr_type=connection.ehr_type,
        is_active=connection.is_active,
        last_sync_at=connection.last_sync_at,
        last_sync_status=connection.last_sync_status,
        resources=sync_summary.get('resources', {})
    )


@router.get("/sync-states/{connection_id}", response_model=List[SyncStateResponse])
async def get_sync_states(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sync states for each resource type for a connection.
    """
    conn_repo = EHRConnectionRepository(db)
    sync_repo = SyncStateRepository(db)

    # Verify connection belongs to tenant
    connection = await conn_repo.get_by_id(connection_id, current_user.tenant_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    states = await sync_repo.get_connection_sync_states(connection_id)
    return states


# ============================================================================
# SYNC CONTROL ENDPOINTS
# ============================================================================

@router.post("/sync/{connection_id}/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_sync_endpoint(
    connection_id: uuid.UUID,
    request: Optional[TriggerSyncRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Trigger an immediate sync for a connection.

    Requires admin role. This triggers the sync immediately
    instead of waiting for the next polling interval.
    """
    conn_repo = EHRConnectionRepository(db)

    connection = await conn_repo.get_by_id(connection_id, current_user.tenant_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    if not connection.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot trigger sync on inactive connection"
        )

    # Import here to avoid circular imports
    from pollers.scheduler import trigger_sync as scheduler_trigger_sync, reload_connections

    # First, ensure this connection has a poller registered
    # (in case it was just created and scheduler hasn't picked it up yet)
    await reload_connections()

    # Now trigger the sync
    result = await scheduler_trigger_sync(connection_id)

    if not result.get('success'):
        # If poller not found, the connection might be new - try reload again
        logger.warning(f"Sync trigger failed, poller may not be registered: {result}")

        # Update last_manual_sync_request as fallback
        connection.last_manual_sync_request = datetime.utcnow()
        await db.commit()

        return {
            "message": "Sync requested. Connection may need scheduler restart to begin polling.",
            "connection_id": str(connection_id),
            "poll_interval_seconds": connection.poll_interval_seconds,
            "warning": result.get('error')
        }

    logger.info(
        f"Manual sync completed for connection {connection_id} "
        f"by user {current_user.user_id}"
    )

    return {
        "message": "Sync completed successfully",
        "connection_id": str(connection_id),
        "resource_types": request.resource_types if request else None,
        "sync_status": result.get('status', {})
    }


@router.post("/sync/{connection_id}/reset", status_code=status.HTTP_200_OK)
async def reset_sync_state(
    connection_id: uuid.UUID,
    resource_type: Optional[str] = Query(None, description="Specific resource type to reset"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Reset sync state for a connection (triggers full re-sync).

    Requires admin role. This clears the last sync time and counters,
    causing the next sync to fetch all records instead of just updates.
    """
    conn_repo = EHRConnectionRepository(db)
    sync_repo = SyncStateRepository(db)

    connection = await conn_repo.get_by_id(connection_id, current_user.tenant_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EHR connection not found"
        )

    count = await sync_repo.reset_sync_state(connection_id, resource_type)
    await db.commit()

    logger.info(
        f"Reset sync state for connection {connection_id}, "
        f"resource_type={resource_type}, count={count}"
    )

    return {
        "message": f"Reset {count} sync state(s)",
        "connection_id": str(connection_id),
        "resource_type": resource_type
    }


@router.post("/pollers/reload", status_code=status.HTTP_200_OK)
async def reload_pollers(
    current_user: User = Depends(require_admin)
):
    """
    Reload all pollers from database.

    Requires admin role. This reloads the scheduler with the latest
    EHR connections from the database. Use this after creating or
    modifying connections to apply changes without restarting.
    """
    from pollers.scheduler import reload_connections

    try:
        result = await reload_connections()

        if not result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Failed to reload pollers')
            )

        logger.info(f"Pollers reloaded by user {current_user.user_id}: {result}")

        return {
            "message": "Pollers reloaded successfully",
            "active_pollers": result.get('active_pollers', 0),
            "added": result.get('added', 0),
            "removed": result.get('removed', 0)
        }

    except Exception as e:
        logger.error(f"Failed to reload pollers: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/pollers/status", status_code=status.HTTP_200_OK)
async def get_pollers_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get status of all active pollers.

    Returns information about running pollers, their metrics, and health status.
    """
    from pollers.scheduler import get_poller_status

    try:
        status_info = get_poller_status()
        return status_info

    except Exception as e:
        logger.error(f"Failed to get poller status: {e}", exc_info=True)
        return {
            "scheduler_running": False,
            "active_pollers": 0,
            "error": str(e)
        }


# ============================================================================
# STATISTICS ENDPOINTS
# ============================================================================

@router.get("/stats", response_model=SyncStatsResponse)
async def get_sync_stats(
    source_ehr: Optional[str] = Query(None, description="Filter by EHR source"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get overall sync statistics for the tenant.

    Returns counts of synced patients, encounters, and other resources.
    """
    patient_repo = PatientRepository(db)
    encounter_repo = EncounterRepository(db)

    patient_stats = await patient_repo.get_sync_stats(
        tenant_id=current_user.tenant_id,
        source_ehr=source_ehr
    )

    encounter_stats = await encounter_repo.get_sync_stats(
        tenant_id=current_user.tenant_id,
        source_ehr=source_ehr
    )

    # Calculate last sync time
    last_sync = None
    if patient_stats.get('last_sync_time'):
        last_sync = datetime.fromisoformat(patient_stats['last_sync_time'])
    if encounter_stats.get('last_sync_time'):
        enc_sync = datetime.fromisoformat(encounter_stats['last_sync_time'])
        if not last_sync or enc_sync > last_sync:
            last_sync = enc_sync

    return SyncStatsResponse(
        patients=patient_stats,
        encounters=encounter_stats,
        total_records_synced=(
            patient_stats.get('synced_from_ehr', 0) +
            encounter_stats.get('synced_from_ehr', 0)
        ),
        last_sync_time=last_sync
    )


@router.get("/stats/connections", response_model=Dict[str, Any])
async def get_connection_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about EHR connections for the tenant.
    """
    repo = EHRConnectionRepository(db)
    stats = await repo.get_connection_stats(current_user.tenant_id)
    return stats

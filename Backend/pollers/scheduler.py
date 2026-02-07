"""
APScheduler Integration for EHR Pollers

Manages scheduling and lifecycle of all EHR pollers.
Integrates with FastAPI startup/shutdown events.
"""

import logging
from typing import Dict, List, Optional
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None

# Active pollers registry
active_pollers: Dict[UUID, 'BasePoller'] = {}


def get_scheduler() -> AsyncIOScheduler:
    """Get or create the global scheduler instance."""
    global scheduler
    if scheduler is None:
        scheduler = AsyncIOScheduler(
            jobstores={
                'default': MemoryJobStore()
            },
            job_defaults={
                'coalesce': True,  # Combine missed executions into one
                'max_instances': 1,  # Only one instance of each job at a time
                'misfire_grace_time': 30,  # Allow 30 seconds grace for misfires
            }
        )
    return scheduler


async def start_pollers(db_session_factory=None):
    """
    Start all configured EHR pollers.

    This should be called from FastAPI's startup event.

    Args:
        db_session_factory: SQLAlchemy async session factory for database access
    """
    global active_pollers, _db_session_factory

    logger.info("Starting EHR poller scheduler...")

    # Store db_session_factory globally for later use (trigger_sync, reload_connections)
    if db_session_factory:
        _db_session_factory = db_session_factory

    sched = get_scheduler()

    try:
        # Get all active EHR connections from database
        connections = await _get_active_connections(db_session_factory)

        if not connections:
            logger.info("No active EHR connections found - scheduler will start but no pollers registered")
            logger.info("Create an EHR connection via Admin > EHR Connections to start polling")

        for conn in connections:
            await _register_poller(conn, db_session_factory)

        # Start the scheduler
        if not sched.running:
            sched.start()
            logger.info(f"Scheduler started with {len(active_pollers)} pollers")

    except Exception as e:
        logger.error(f"Failed to start pollers: {e}", exc_info=True)


async def stop_pollers():
    """
    Stop all running pollers.

    This should be called from FastAPI's shutdown event.
    """
    global scheduler, active_pollers

    logger.info("Stopping EHR poller scheduler...")

    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")

    # Stop all active pollers
    for poller in active_pollers.values():
        poller.stop()

    active_pollers.clear()
    logger.info("All pollers stopped")


async def _register_poller(connection: Dict, db_session_factory=None):
    """
    Register a poller for an EHR connection.

    Args:
        connection: EHR connection configuration dict
        db_session_factory: Database session factory
    """
    global active_pollers

    connection_id = connection['connection_id']
    tenant_id = connection['tenant_id']
    ehr_type = connection['ehr_type']
    poll_interval = connection.get('poll_interval_seconds', 30)

    # Get the appropriate poller class
    poller_class = _get_poller_class(ehr_type)
    if not poller_class:
        logger.warning(f"No poller implementation for EHR type: {ehr_type}")
        return

    # Create poller instance
    config = {
        'base_url': connection.get('base_url'),
        'client_id': connection.get('client_id'),
        'client_secret': connection.get('client_secret'),
        'private_key': connection.get('private_key'),
        'poll_interval_seconds': poll_interval,
        'use_mock_data': connection.get('use_mock_data', True),
    }

    poller = poller_class(
        connection_id=connection_id,
        tenant_id=tenant_id,
        config=config,
        db_session_factory=db_session_factory
    )

    # Register with scheduler
    sched = get_scheduler()
    job_id = f"ehr_sync_{connection_id}"

    sched.add_job(
        poller.sync_cycle,
        trigger=IntervalTrigger(seconds=poll_interval),
        id=job_id,
        name=f"{ehr_type.capitalize()} Sync - {connection_id}",
        replace_existing=True,
    )

    poller.start()
    active_pollers[connection_id] = poller

    logger.info(
        f"Registered {ehr_type} poller for connection {connection_id}, "
        f"interval={poll_interval}s"
    )


def _get_poller_class(ehr_type: str):
    """
    Get the poller class for an EHR type.

    Args:
        ehr_type: EHR type string ('epic', 'athena', 'cerner', 'meditech')

    Returns:
        Poller class or None if not implemented
    """
    # Import here to avoid circular imports
    if ehr_type == 'epic':
        from .epic.epic_poller import EpicPoller
        return EpicPoller
    elif ehr_type == 'athena':
        from .athena.athena_poller import AthenaPoller
        return AthenaPoller
    elif ehr_type == 'cerner':
        from .cerner.cerner_poller import CernerPoller
        return CernerPoller
    elif ehr_type == 'meditech':
        from .meditech.meditech_poller import MeditechPoller
        return MeditechPoller
    else:
        return None


async def _get_active_connections(db_session_factory=None) -> List[Dict]:
    """
    Get all active EHR connections from database.

    Returns:
        List of connection configuration dicts
    """
    logger.info("Loading active EHR connections...")

    if db_session_factory:
        try:
            # Import here to avoid circular imports
            from medical_coding_ai.models.ehr_models import EHRConnection
            from sqlalchemy import select

            async with db_session_factory() as db:
                query = select(EHRConnection).where(EHRConnection.is_active == True)
                result = await db.execute(query)
                connections = result.scalars().all()

                if connections:
                    logger.info(f"Found {len(connections)} active EHR connections in database")
                    return [
                        {
                            'connection_id': conn.connection_id,
                            'tenant_id': conn.tenant_id,
                            'ehr_type': conn.ehr_type,
                            'organization_name': conn.organization_name,
                            'base_url': conn.base_url,
                            'client_id': conn.client_id,
                            'client_secret': conn.client_secret,
                            'private_key': conn.private_key,
                            'poll_interval_seconds': conn.poll_interval_seconds or 30,
                            'use_mock_data': conn.use_mock_data if conn.use_mock_data is not None else True,
                            'is_active': conn.is_active,
                        }
                        for conn in connections
                    ]
                else:
                    logger.info("No active EHR connections found in database")
                    return []

        except Exception as e:
            logger.error(f"Failed to load EHR connections from database: {e}", exc_info=True)
            # Fall through to return empty list - don't use mock data in production
            return []

    # No db_session_factory provided - return empty (no mock data in production)
    logger.warning("No db_session_factory provided - cannot load EHR connections")
    return []


# =========================================================================
# POLLER MANAGEMENT API
# =========================================================================

# Store db_session_factory globally for trigger_sync
_db_session_factory = None


async def trigger_sync(connection_id: UUID) -> Dict:
    """
    Trigger an immediate sync for a specific connection.

    Args:
        connection_id: UUID of the EHR connection

    Returns:
        Dict with sync result status
    """
    global active_pollers

    if connection_id not in active_pollers:
        logger.warning(f"No active poller for connection {connection_id}")
        return {
            'success': False,
            'error': 'Poller not found or not active',
            'connection_id': str(connection_id)
        }

    poller = active_pollers[connection_id]

    try:
        logger.info(f"Triggering manual sync for connection {connection_id}")
        # Run the sync cycle immediately
        await poller.sync_cycle()

        return {
            'success': True,
            'message': 'Sync completed successfully',
            'connection_id': str(connection_id),
            'status': poller.get_status()
        }
    except Exception as e:
        logger.error(f"Manual sync failed for {connection_id}: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'connection_id': str(connection_id)
        }


async def reload_connections(db_session_factory=None) -> Dict:
    """
    Reload all EHR connections from database and update pollers.

    This can be called after creating/updating connections via API.

    Args:
        db_session_factory: Database session factory

    Returns:
        Dict with reload status
    """
    global active_pollers, _db_session_factory

    if db_session_factory:
        _db_session_factory = db_session_factory

    factory = db_session_factory or _db_session_factory

    if not factory:
        return {'success': False, 'error': 'No database session factory available'}

    try:
        # Get current connections from database
        connections = await _get_active_connections(factory)
        connection_ids = {c['connection_id'] for c in connections}

        # Remove pollers for connections that no longer exist or are inactive
        pollers_to_remove = [
            cid for cid in active_pollers.keys()
            if cid not in connection_ids
        ]
        for cid in pollers_to_remove:
            await remove_poller(cid)
            logger.info(f"Removed poller for deactivated connection {cid}")

        # Add pollers for new connections
        existing_ids = set(active_pollers.keys())
        for conn in connections:
            if conn['connection_id'] not in existing_ids:
                await _register_poller(conn, factory)
                logger.info(f"Added poller for new connection {conn['connection_id']}")

        return {
            'success': True,
            'active_pollers': len(active_pollers),
            'added': len(connection_ids - existing_ids),
            'removed': len(pollers_to_remove)
        }

    except Exception as e:
        logger.error(f"Failed to reload connections: {e}", exc_info=True)
        return {'success': False, 'error': str(e)}


async def add_poller(connection: Dict, db_session_factory=None) -> bool:
    """
    Add a new poller for an EHR connection.

    Args:
        connection: EHR connection configuration
        db_session_factory: Database session factory

    Returns:
        True if successful
    """
    await _register_poller(connection, db_session_factory)
    return True


async def remove_poller(connection_id: UUID) -> bool:
    """
    Remove a poller for an EHR connection.

    Args:
        connection_id: UUID of the connection

    Returns:
        True if successful
    """
    global active_pollers

    if connection_id in active_pollers:
        poller = active_pollers[connection_id]
        poller.stop()

        # Remove from scheduler
        sched = get_scheduler()
        job_id = f"ehr_sync_{connection_id}"
        sched.remove_job(job_id)

        del active_pollers[connection_id]
        logger.info(f"Removed poller for connection {connection_id}")
        return True

    return False


def get_poller_status(connection_id: Optional[UUID] = None) -> Dict:
    """
    Get status of poller(s).

    Args:
        connection_id: Optional specific connection ID, or None for all

    Returns:
        Status dict
    """
    if connection_id:
        if connection_id in active_pollers:
            return active_pollers[connection_id].get_status()
        return {'error': 'Poller not found'}

    return {
        'scheduler_running': scheduler.running if scheduler else False,
        'active_pollers': len(active_pollers),
        'pollers': [p.get_status() for p in active_pollers.values()]
    }

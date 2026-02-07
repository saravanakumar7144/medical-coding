"""
Base Poller Abstract Class

Defines the interface that all EHR pollers must implement.
Provides shared functionality for:
- Sync state management
- Error handling and logging
- Metrics tracking
- Database operations
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
import logging
import asyncio

logger = logging.getLogger(__name__)

# Import repository classes for database operations
try:
    from medical_coding_ai.repositories.patient_repository import PatientRepository
    from medical_coding_ai.repositories.encounter_repository import EncounterRepository
    from medical_coding_ai.repositories.condition_repository import ConditionRepository
    from medical_coding_ai.repositories.procedure_repository import ProcedureRepository
    from medical_coding_ai.repositories.sync_state_repository import SyncStateRepository
    from medical_coding_ai.models.ehr_models import SyncState
    from sqlalchemy import select
    REPOSITORIES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Repository classes not available: {e}. Database operations will be skipped.")
    REPOSITORIES_AVAILABLE = False


class BasePoller(ABC):
    """
    Abstract base class for all EHR pollers.

    Each EHR system (Epic, athena, Cerner, Meditech) should extend this class
    and implement the abstract methods for authentication and data fetching.
    """

    def __init__(
        self,
        connection_id: UUID,
        tenant_id: UUID,
        config: Dict[str, Any],
        db_session_factory=None
    ):
        """
        Initialize the poller.

        Args:
            connection_id: UUID of the EHR connection configuration
            tenant_id: UUID of the tenant (for multi-tenant isolation)
            config: Connection configuration dict containing:
                - base_url: EHR FHIR API base URL
                - client_id: OAuth client ID
                - client_secret: OAuth client secret (if applicable)
                - private_key: JWT signing key (for Epic)
                - poll_interval_seconds: Polling interval (default 30)
                - use_mock_data: Whether to use mock FHIR data
            db_session_factory: SQLAlchemy async session factory
        """
        self.connection_id = connection_id
        self.tenant_id = tenant_id
        self.config = config
        self.db_session_factory = db_session_factory

        # Polling configuration
        self.poll_interval = config.get('poll_interval_seconds', 30)
        self.use_mock_data = config.get('use_mock_data', True)
        self.base_url = config.get('base_url', '')

        # State
        self._is_running = False
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

        # Metrics
        self.metrics = {
            'total_syncs': 0,
            'successful_syncs': 0,
            'failed_syncs': 0,
            'records_processed': 0,
            'records_created': 0,
            'records_updated': 0,
            'last_sync_duration_ms': 0,
            'last_error': None,
        }

        logger.info(
            f"Initialized {self.__class__.__name__} for connection {connection_id}, "
            f"tenant {tenant_id}, mock_data={self.use_mock_data}"
        )

    # =========================================================================
    # ABSTRACT METHODS - Must be implemented by each EHR poller
    # =========================================================================

    @abstractmethod
    async def authenticate(self) -> str:
        """
        Authenticate with the EHR system and obtain an access token.

        Returns:
            Access token string

        Raises:
            AuthenticationError: If authentication fails
        """
        pass

    @abstractmethod
    async def fetch_patients(self, last_sync: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch patients from the EHR, optionally filtered by last update time.

        Args:
            last_sync: Only fetch patients updated after this time

        Returns:
            List of FHIR Patient resources
        """
        pass

    @abstractmethod
    async def fetch_encounters(
        self,
        patient_ids: Optional[List[str]] = None,
        last_sync: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Fetch encounters from the EHR.

        Args:
            patient_ids: Optional list of patient FHIR IDs to filter by
            last_sync: Only fetch encounters updated after this time

        Returns:
            List of FHIR Encounter resources
        """
        pass

    @abstractmethod
    async def fetch_conditions(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Fetch conditions (diagnoses) from the EHR.

        Args:
            patient_ids: Optional list of patient FHIR IDs
            encounter_ids: Optional list of encounter FHIR IDs

        Returns:
            List of FHIR Condition resources
        """
        pass

    @abstractmethod
    async def fetch_procedures(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Fetch procedures from the EHR.

        Args:
            patient_ids: Optional list of patient FHIR IDs
            encounter_ids: Optional list of encounter FHIR IDs

        Returns:
            List of FHIR Procedure resources
        """
        pass

    @abstractmethod
    def transform_patient(self, fhir_resource: Dict) -> Dict:
        """
        Transform a FHIR Patient resource to canonical format for database storage.

        Args:
            fhir_resource: FHIR Patient resource dict

        Returns:
            Canonical patient dict matching database schema
        """
        pass

    @abstractmethod
    def transform_encounter(self, fhir_resource: Dict) -> Dict:
        """
        Transform a FHIR Encounter resource to canonical format.
        """
        pass

    @abstractmethod
    def transform_condition(self, fhir_resource: Dict) -> Dict:
        """
        Transform a FHIR Condition resource to canonical format.
        """
        pass

    @abstractmethod
    def transform_procedure(self, fhir_resource: Dict) -> Dict:
        """
        Transform a FHIR Procedure resource to canonical format.
        """
        pass

    # =========================================================================
    # SYNC CYCLE - Main polling logic
    # =========================================================================

    async def sync_cycle(self):
        """
        Main sync cycle - called by APScheduler at configured interval.

        Flow:
        1. Get last sync time from sync_state table
        2. Fetch patients updated since last sync
        3. For each patient, fetch encounters, conditions, procedures
        4. Transform FHIR → Canonical format
        5. Upsert into database
        6. Update sync_state with new timestamp
        """
        start_time = datetime.utcnow()
        self.metrics['total_syncs'] += 1

        logger.info(f"Starting sync cycle for connection {self.connection_id}")

        try:
            # Step 1: Authenticate (refresh token if needed)
            await self._ensure_authenticated()

            # Step 2: Get last sync time
            last_sync = await self._get_last_sync_time('Patient')

            # Step 3: Fetch patients
            patients = await self.fetch_patients(last_sync)
            logger.info(f"Fetched {len(patients)} patients")

            # Step 4: Process patients
            patient_ids = []
            for patient_fhir in patients:
                canonical = self.transform_patient(patient_fhir)
                canonical['tenant_id'] = self.tenant_id
                await self._upsert_patient(canonical)
                patient_ids.append(patient_fhir.get('id'))
                self.metrics['records_processed'] += 1

            # Step 5: Fetch and process encounters for these patients
            if patient_ids:
                encounters = await self.fetch_encounters(patient_ids=patient_ids, last_sync=last_sync)
                logger.info(f"Fetched {len(encounters)} encounters")

                encounter_ids = []
                for encounter_fhir in encounters:
                    canonical = self.transform_encounter(encounter_fhir)
                    canonical['tenant_id'] = self.tenant_id
                    await self._upsert_encounter(canonical)
                    encounter_ids.append(encounter_fhir.get('id'))
                    self.metrics['records_processed'] += 1

                # Step 6: Fetch conditions and procedures
                if encounter_ids:
                    conditions = await self.fetch_conditions(encounter_ids=encounter_ids)
                    for condition_fhir in conditions:
                        canonical = self.transform_condition(condition_fhir)
                        canonical['tenant_id'] = self.tenant_id
                        await self._upsert_condition(canonical)
                        self.metrics['records_processed'] += 1

                    procedures = await self.fetch_procedures(encounter_ids=encounter_ids)
                    for procedure_fhir in procedures:
                        canonical = self.transform_procedure(procedure_fhir)
                        canonical['tenant_id'] = self.tenant_id
                        await self._upsert_procedure(canonical)
                        self.metrics['records_processed'] += 1

            # Step 7: Update sync state
            await self._update_sync_state('Patient', 'success', datetime.utcnow())

            # Update metrics
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.metrics['successful_syncs'] += 1
            self.metrics['last_sync_duration_ms'] = duration_ms

            logger.info(
                f"Sync cycle completed in {duration_ms:.0f}ms, "
                f"processed {self.metrics['records_processed']} records"
            )

        except Exception as e:
            self.metrics['failed_syncs'] += 1
            self.metrics['last_error'] = str(e)
            logger.error(f"Sync cycle failed: {e}", exc_info=True)
            await self._update_sync_state('Patient', 'error', error_message=str(e))

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    async def _ensure_authenticated(self):
        """Ensure we have a valid access token."""
        if self._access_token and self._token_expires_at:
            if datetime.utcnow() < self._token_expires_at:
                return  # Token still valid

        self._access_token = await self.authenticate()
        # Most tokens are valid for 1 hour, refresh 5 minutes early
        self._token_expires_at = datetime.utcnow()

    async def _get_last_sync_time(self, resource_type: str) -> Optional[datetime]:
        """Get last sync time for a resource type from sync_state table."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping sync state query (repositories unavailable)")
            return None

        try:
            async with self.db_session_factory() as session:
                query = select(SyncState).where(
                    SyncState.connection_id == self.connection_id,
                    SyncState.resource_type == resource_type
                )
                result = await session.execute(query)
                sync_state = result.scalar_one_or_none()

                if sync_state and sync_state.last_sync_time:
                    logger.debug(f"Found last sync time for {resource_type}: {sync_state.last_sync_time}")
                    return sync_state.last_sync_time

                logger.debug(f"No previous sync found for {resource_type}")
                return None

        except Exception as e:
            logger.error(f"Failed to get sync state for {resource_type}: {e}")
            return None

    async def _update_sync_state(
        self,
        resource_type: str,
        status: str,
        sync_time: Optional[datetime] = None,
        error_message: Optional[str] = None
    ):
        """Update sync state in database."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping sync state update (repositories unavailable)")
            return

        try:
            async with self.db_session_factory() as session:
                # Try to find existing sync state
                query = select(SyncState).where(
                    SyncState.connection_id == self.connection_id,
                    SyncState.resource_type == resource_type
                )
                result = await session.execute(query)
                sync_state = result.scalar_one_or_none()

                if sync_state:
                    # Update existing record
                    sync_state.last_sync_status = status
                    sync_state.last_sync_time = sync_time or datetime.utcnow()
                    sync_state.updated_at = datetime.utcnow()
                    sync_state.records_processed = self.metrics.get('records_processed', 0)
                    sync_state.records_created = self.metrics.get('records_created', 0)
                    sync_state.records_updated = self.metrics.get('records_updated', 0)

                    if error_message:
                        sync_state.last_error_message = error_message
                        sync_state.error_count = (sync_state.error_count or 0) + 1
                    elif status == 'success':
                        sync_state.error_count = 0
                        sync_state.last_error_message = None

                else:
                    # Create new sync state record
                    import uuid as uuid_module
                    sync_state = SyncState(
                        sync_id=uuid_module.uuid4(),
                        connection_id=self.connection_id,
                        resource_type=resource_type,
                        last_sync_status=status,
                        last_sync_time=sync_time or datetime.utcnow(),
                        records_processed=self.metrics.get('records_processed', 0),
                        records_created=self.metrics.get('records_created', 0),
                        records_updated=self.metrics.get('records_updated', 0),
                        error_count=1 if error_message else 0,
                        last_error_message=error_message,
                    )
                    session.add(sync_state)

                await session.commit()
                logger.info(f"Updated sync state: {resource_type} = {status}, "
                           f"records={self.metrics.get('records_processed', 0)}")

        except Exception as e:
            logger.error(f"Failed to update sync state for {resource_type}: {e}", exc_info=True)

    async def _upsert_patient(self, patient_data: Dict):
        """Upsert patient record using fhir_id for conflict resolution."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping patient upsert (repositories unavailable): {patient_data.get('fhir_id')}")
            return

        async with self.db_session_factory() as session:
            try:
                repo = PatientRepository(session)
                patient = await repo.upsert_from_ehr(patient_data)
                await session.commit()
                self.metrics['records_created'] += 1
                logger.debug(f"Upserted patient: {patient.patient_id} (fhir_id: {patient_data.get('fhir_id')})")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to upsert patient {patient_data.get('fhir_id')}: {e}")
                raise

    async def _upsert_encounter(self, encounter_data: Dict):
        """Upsert encounter record."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping encounter upsert (repositories unavailable): {encounter_data.get('fhir_id')}")
            return

        async with self.db_session_factory() as session:
            try:
                repo = EncounterRepository(session)
                encounter = await repo.upsert_from_ehr(encounter_data)
                await session.commit()
                self.metrics['records_created'] += 1
                logger.debug(f"Upserted encounter: {encounter.encounter_id} (fhir_id: {encounter_data.get('fhir_id')})")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to upsert encounter {encounter_data.get('fhir_id')}: {e}")
                raise

    async def _upsert_condition(self, condition_data: Dict):
        """Upsert condition record."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping condition upsert (repositories unavailable): {condition_data.get('fhir_id')}")
            return

        async with self.db_session_factory() as session:
            try:
                repo = ConditionRepository(session)
                condition = await repo.upsert_from_ehr(condition_data)
                await session.commit()
                self.metrics['records_created'] += 1
                logger.debug(f"Upserted condition: {condition.diagnosis_id} (fhir_id: {condition_data.get('fhir_id')})")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to upsert condition {condition_data.get('fhir_id')}: {e}")
                raise

    async def _upsert_procedure(self, procedure_data: Dict):
        """Upsert procedure record."""
        if not REPOSITORIES_AVAILABLE or not self.db_session_factory:
            logger.debug(f"Skipping procedure upsert (repositories unavailable): {procedure_data.get('fhir_id')}")
            return

        async with self.db_session_factory() as session:
            try:
                repo = ProcedureRepository(session)
                procedure = await repo.upsert_from_ehr(procedure_data)
                await session.commit()
                self.metrics['records_created'] += 1
                logger.debug(f"Upserted procedure: {procedure.procedure_id} (fhir_id: {procedure_data.get('fhir_id')})")
            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to upsert procedure {procedure_data.get('fhir_id')}: {e}")
                raise

    # =========================================================================
    # LIFECYCLE METHODS
    # =========================================================================

    def start(self):
        """Mark poller as running."""
        self._is_running = True
        logger.info(f"Poller {self.connection_id} started")

    def stop(self):
        """Mark poller as stopped."""
        self._is_running = False
        logger.info(f"Poller {self.connection_id} stopped")

    @property
    def is_running(self) -> bool:
        """Check if poller is running."""
        return self._is_running

    def get_status(self) -> Dict:
        """Get current poller status and metrics."""
        return {
            'connection_id': str(self.connection_id),
            'tenant_id': str(self.tenant_id),
            'is_running': self._is_running,
            'use_mock_data': self.use_mock_data,
            'poll_interval_seconds': self.poll_interval,
            'metrics': self.metrics.copy(),
        }

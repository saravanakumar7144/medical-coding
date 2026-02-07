"""
Base Clearinghouse Poller Abstract Class

Defines the interface for all clearinghouse pollers.
Handles:
- Claim status tracking (X12 277)
- Remittance advice (X12 835)
- Claim acknowledgments (X12 999)
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class BaseClearinghousePoller(ABC):
    """
    Abstract base class for clearinghouse pollers.

    Each clearinghouse (Stedi, Availity, Change Healthcare) should extend
    this class and implement the abstract methods.
    """

    def __init__(
        self,
        connection_id: UUID,
        tenant_id: UUID,
        config: Dict[str, Any],
        db_session_factory=None
    ):
        """
        Initialize the clearinghouse poller.

        Args:
            connection_id: UUID of the clearinghouse connection configuration
            tenant_id: UUID of the tenant
            config: Connection configuration dict containing:
                - api_base_url: Clearinghouse API base URL
                - api_key: API key for authentication
                - api_secret: API secret
                - submitter_id: EDI submitter ID
                - poll_interval_seconds: Polling interval (default 300)
                - use_mock_data: Whether to use mock data
            db_session_factory: SQLAlchemy async session factory
        """
        self.connection_id = connection_id
        self.tenant_id = tenant_id
        self.config = config
        self.db_session_factory = db_session_factory

        # Configuration
        self.poll_interval = config.get('poll_interval_seconds', 300)  # 5 minutes default
        self.use_mock_data = config.get('use_mock_data', True)
        self.api_base_url = config.get('api_base_url', '')
        self.submitter_id = config.get('submitter_id', '')

        # State
        self._is_running = False

        # Metrics
        self.metrics = {
            'total_polls': 0,
            'successful_polls': 0,
            'failed_polls': 0,
            'claims_checked': 0,
            'remittances_processed': 0,
            'last_poll_duration_ms': 0,
            'last_error': None,
        }

        logger.info(
            f"Initialized {self.__class__.__name__} for connection {connection_id}, "
            f"tenant {tenant_id}, mock_data={self.use_mock_data}"
        )

    # =========================================================================
    # ABSTRACT METHODS
    # =========================================================================

    @abstractmethod
    async def authenticate(self) -> str:
        """
        Authenticate with the clearinghouse.

        Returns:
            Access token or API key for subsequent requests
        """
        pass

    @abstractmethod
    async def check_claim_status(self, claim_id: str) -> Dict:
        """
        Check the status of a submitted claim.

        Args:
            claim_id: Internal claim ID

        Returns:
            Status dict with:
                - status: 'accepted', 'rejected', 'pending', etc.
                - status_code: Clearinghouse status code
                - status_message: Human-readable message
                - payer_claim_id: Payer's claim reference (if available)
        """
        pass

    @abstractmethod
    async def check_batch_claim_status(self, claim_ids: List[str]) -> List[Dict]:
        """
        Check status for multiple claims.

        Args:
            claim_ids: List of claim IDs

        Returns:
            List of status dicts
        """
        pass

    @abstractmethod
    async def fetch_remittances(self, last_sync: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch remittance advice (835) from clearinghouse.

        Args:
            last_sync: Only fetch remittances after this time

        Returns:
            List of remittance dicts
        """
        pass

    @abstractmethod
    async def parse_remittance(self, remittance_data: Any) -> Dict:
        """
        Parse a single remittance (835) into canonical format.

        Args:
            remittance_data: Raw remittance data (X12 835 or JSON)

        Returns:
            Parsed remittance dict
        """
        pass

    @abstractmethod
    async def submit_claim(self, claim_data: Dict) -> Dict:
        """
        Submit a claim (837) to the clearinghouse.

        Args:
            claim_data: Claim data in canonical format

        Returns:
            Submission response with:
                - success: bool
                - trace_number: Clearinghouse trace number
                - errors: List of any errors
        """
        pass

    # =========================================================================
    # SYNC CYCLE
    # =========================================================================

    async def sync_cycle(self):
        """
        Main sync cycle - called by APScheduler.

        Flow:
        1. Check status of pending claims
        2. Fetch new remittances
        3. Update database with results
        """
        start_time = datetime.utcnow()
        self.metrics['total_polls'] += 1

        logger.info(f"Starting clearinghouse sync for connection {self.connection_id}")

        try:
            # Get pending claims from database
            pending_claims = await self._get_pending_claims()

            # Check claim statuses in batches
            if pending_claims:
                claim_ids = [c['claim_id'] for c in pending_claims]
                statuses = await self.check_batch_claim_status(claim_ids)

                for status in statuses:
                    await self._update_claim_status(status)
                    self.metrics['claims_checked'] += 1

            # Fetch new remittances
            last_sync = await self._get_last_remittance_sync()
            remittances = await self.fetch_remittances(last_sync)

            for remittance in remittances:
                parsed = await self.parse_remittance(remittance)
                await self._save_remittance(parsed)
                self.metrics['remittances_processed'] += 1

            # Update sync state
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.metrics['successful_polls'] += 1
            self.metrics['last_poll_duration_ms'] = duration_ms

            logger.info(
                f"Clearinghouse sync completed in {duration_ms:.0f}ms, "
                f"checked {len(pending_claims)} claims, "
                f"processed {len(remittances)} remittances"
            )

        except Exception as e:
            self.metrics['failed_polls'] += 1
            self.metrics['last_error'] = str(e)
            logger.error(f"Clearinghouse sync failed: {e}", exc_info=True)

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    async def _get_pending_claims(self) -> List[Dict]:
        """Get claims awaiting clearinghouse response."""
        # TODO: Implement database query
        return []

    async def _update_claim_status(self, status: Dict):
        """Update claim status in database."""
        # TODO: Implement database update
        logger.debug(f"Updated claim status: {status}")

    async def _get_last_remittance_sync(self) -> Optional[datetime]:
        """Get last remittance sync time."""
        # TODO: Implement database query
        return None

    async def _save_remittance(self, remittance: Dict):
        """Save remittance to database."""
        # TODO: Implement database insert
        logger.debug(f"Saved remittance: {remittance.get('era_id')}")

    # =========================================================================
    # LIFECYCLE
    # =========================================================================

    def start(self):
        """Mark poller as running."""
        self._is_running = True
        logger.info(f"Clearinghouse poller {self.connection_id} started")

    def stop(self):
        """Mark poller as stopped."""
        self._is_running = False
        logger.info(f"Clearinghouse poller {self.connection_id} stopped")

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

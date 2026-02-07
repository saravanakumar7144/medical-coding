"""
⚠️ WARNING: STUB IMPLEMENTATION - Phase 9 Priority ⚠️

athenahealth EHR Poller (Stub Implementation)

STATUS: This is a STUB implementation. NotImplementedError will be raised if used in production.

This is a placeholder for athenahealth integration.
athenahealth uses a proprietary REST API rather than FHIR.

TODO - Phase 9 Implementation:
- Implement OAuth2 client credentials authentication
- Map athena data models to canonical format
- Handle athena-specific pagination
- Implement incremental sync

Reference: https://docs.athenahealth.com/api/

To use this poller:
1. Set use_mock_data=True in configuration for testing
2. For production, implement the methods below following the Epic poller pattern
3. See Backend/pollers/epic/epic_poller.py for reference implementation
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID

from ..base_poller import BasePoller

logger = logging.getLogger(__name__)


class AthenaPoller(BasePoller):
    """
    ⚠️ STUB IMPLEMENTATION ⚠️

    athenahealth EHR Poller (Stub - Phase 9 Priority)

    This is a placeholder implementation for athenahealth integration.
    All methods will raise NotImplementedError unless use_mock_data=True.

    For production use, this class needs full implementation following
    the Epic poller pattern in Backend/pollers/epic/epic_poller.py
    """

    EHR_TYPE = 'athena'

    def __init__(self, connection_id: UUID, tenant_id: UUID, config: Dict[str, Any], db_session_factory=None):
        super().__init__(connection_id, tenant_id, config, db_session_factory)
        logger.warning(
            "⚠️ AthenaPoller is a STUB implementation (Phase 9). "
            "Set use_mock_data=True for testing or implement methods for production."
        )

    async def authenticate(self) -> str:
        """
        Authenticate with athenahealth using OAuth2.

        TODO: Implement athenahealth OAuth2 flow
        """
        if self.use_mock_data:
            logger.info("Using mock authentication for athenahealth")
            return "mock-athena-access-token"

        raise NotImplementedError(
            "athenahealth authentication not yet implemented. "
            "Set use_mock_data=True for testing."
        )

    async def fetch_patients(self, last_sync: Optional[datetime] = None) -> List[Dict]:
        """Fetch patients from athenahealth."""
        if self.use_mock_data:
            logger.info("Returning mock athenahealth patients")
            return []  # Return empty for now

        raise NotImplementedError("athenahealth patient fetch not implemented")

    async def fetch_encounters(
        self,
        patient_ids: Optional[List[str]] = None,
        last_sync: Optional[datetime] = None
    ) -> List[Dict]:
        """Fetch encounters from athenahealth."""
        if self.use_mock_data:
            return []
        raise NotImplementedError("athenahealth encounter fetch not implemented")

    async def fetch_conditions(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """Fetch conditions from athenahealth."""
        if self.use_mock_data:
            return []
        raise NotImplementedError("athenahealth condition fetch not implemented")

    async def fetch_procedures(
        self,
        patient_ids: Optional[List[str]] = None,
        encounter_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """Fetch procedures from athenahealth."""
        if self.use_mock_data:
            return []
        raise NotImplementedError("athenahealth procedure fetch not implemented")

    def transform_patient(self, resource: Dict) -> Dict:
        """Transform athenahealth patient to canonical format."""
        # TODO: Implement athena-specific mapping
        raise NotImplementedError("athenahealth patient transform not implemented")

    def transform_encounter(self, resource: Dict) -> Dict:
        """Transform athenahealth encounter to canonical format."""
        raise NotImplementedError("athenahealth encounter transform not implemented")

    def transform_condition(self, resource: Dict) -> Dict:
        """Transform athenahealth condition to canonical format."""
        raise NotImplementedError("athenahealth condition transform not implemented")

    def transform_procedure(self, resource: Dict) -> Dict:
        """Transform athenahealth procedure to canonical format."""
        raise NotImplementedError("athenahealth procedure transform not implemented")

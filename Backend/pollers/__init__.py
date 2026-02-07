"""
Panaceon EHR Polling Layer

This module provides polling capabilities for multiple EHR systems:
- Epic (FHIR R4)
- athenahealth (proprietary API)
- Cerner (FHIR R4)
- Meditech (FHIR + HL7v2)

Each EHR has its own submodule with:
- Poller: Main polling logic
- Auth: Authentication handling
- Client: HTTP client for API calls
- Mappers: FHIR → Canonical transformations
"""

from .base_poller import BasePoller
from .scheduler import start_pollers, stop_pollers

__all__ = [
    "BasePoller",
    "start_pollers",
    "stop_pollers",
]

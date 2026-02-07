"""
Epic EHR Poller Module

Implements FHIR R4 data synchronization with Epic Systems.
Supports both Backend Services (JWT) and SMART on FHIR authentication.
"""

from .epic_poller import EpicPoller
from .auth import EpicAuth
from .client import EpicClient
from .mappers import EpicMappers

__all__ = [
    "EpicPoller",
    "EpicAuth",
    "EpicClient",
    "EpicMappers",
]

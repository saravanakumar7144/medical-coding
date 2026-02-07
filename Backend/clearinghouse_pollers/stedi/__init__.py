"""
Stedi Clearinghouse Poller Module

Stedi is a modern, API-first clearinghouse that provides:
- JSON-based API (not traditional EDI)
- Real-time claim submission
- Webhook-based status updates
- Built-in X12 parsing

Reference: https://www.stedi.com/docs
"""

from .stedi_poller import StediPoller

__all__ = ["StediPoller"]

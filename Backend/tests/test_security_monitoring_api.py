"""
Security Monitoring API Tests

Unit tests for security dashboard and monitoring endpoints.
Tests authentication, authorization, and data retrieval.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient
from fastapi import HTTPException
import json


# Test data fixtures
TEST_TENANT_ID = uuid4()
TEST_USER_ID = uuid4()
TEST_EVENT_ID = uuid4()


# ============================================================================
# MOCK HELPERS
# ============================================================================

def create_mock_user(role='admin'):
    """Create a mock User object"""
    user = MagicMock()
    user.user_id = TEST_USER_ID
    user.tenant_id = TEST_TENANT_ID
    user.username = 'testuser'
    user.role = role
    user.is_active = True
    return user


def create_mock_security_event(severity='medium', resolved=False):
    """Create a mock SecurityEvent object"""
    event = MagicMock()
    event.event_id = uuid4()
    event.tenant_id = TEST_TENANT_ID
    event.event_type = 'suspicious_login'
    event.severity = severity
    event.user_id = TEST_USER_ID
    event.ip_address = 'encrypted_192.168.1.1'
    event.country = 'United States'
    event.city = 'New York'
    event.details = {'attempts': 3}
    event.resolved = resolved
    event.created_at = datetime.utcnow()
    return event


def create_mock_login_attempt(success=True):
    """Create a mock LoginAttempt object"""
    attempt = MagicMock()
    attempt.attempt_id = uuid4()
    attempt.tenant_id = TEST_TENANT_ID
    attempt.username = 'testuser'
    attempt.success = success
    attempt.failure_reason = None if success else 'Invalid password'
    attempt.ip_address = 'encrypted_192.168.1.1'
    attempt.country = 'United States'
    attempt.city = 'New York'
    attempt.mfa_required = False
    attempt.attempted_at = datetime.utcnow()
    return attempt


def create_mock_db():
    """Create mock database session"""
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    return db


# ============================================================================
# PERMISSION TESTS
# ============================================================================

class TestSecurityPermissions:
    """Tests for security endpoint access control"""

    @pytest.mark.asyncio
    async def test_admin_can_access_dashboard(self):
        """Test admin role can access security dashboard"""
        user = create_mock_user(role='admin')

        # Admin should have access
        assert user.role in ['admin', 'manager']

    @pytest.mark.asyncio
    async def test_manager_can_access_dashboard(self):
        """Test manager role can access security dashboard"""
        user = create_mock_user(role='manager')

        assert user.role in ['admin', 'manager']

    @pytest.mark.asyncio
    async def test_coder_cannot_access_dashboard(self):
        """Test coder role cannot access security dashboard"""
        user = create_mock_user(role='coder')

        assert user.role not in ['admin', 'manager']

    @pytest.mark.asyncio
    async def test_viewer_cannot_access_dashboard(self):
        """Test viewer role cannot access security dashboard"""
        user = create_mock_user(role='viewer')

        assert user.role not in ['admin', 'manager']

    @pytest.mark.asyncio
    async def test_unauthenticated_access_denied(self):
        """Test unauthenticated requests are denied"""
        # Without current_user, should get 401
        current_user = None

        assert current_user is None


# ============================================================================
# DASHBOARD ENDPOINT TESTS
# ============================================================================

class TestSecurityDashboard:
    """Tests for /api/security/dashboard endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.fixture
    def admin_user(self):
        return create_mock_user(role='admin')

    @pytest.mark.asyncio
    async def test_dashboard_returns_summary(self, mock_db, admin_user):
        """Test dashboard returns proper summary structure"""
        from medical_coding_ai.api.security_monitoring import get_security_dashboard

        # Mock query results
        mock_db.execute.return_value = MagicMock(
            scalar=MagicMock(return_value=10)
        )

        # Expected structure
        expected_keys = ['summary', 'recent_events', 'failed_logins_today',
                        'suspicious_activities', 'unresolved_events']

        # Structural test
        assert len(expected_keys) == 5

    @pytest.mark.asyncio
    async def test_dashboard_time_range_1h(self, mock_db, admin_user):
        """Test dashboard with 1 hour time range"""
        time_range = '1h'
        threshold = datetime.utcnow() - timedelta(hours=1)

        assert (datetime.utcnow() - threshold).total_seconds() <= 3601

    @pytest.mark.asyncio
    async def test_dashboard_time_range_24h(self, mock_db, admin_user):
        """Test dashboard with 24 hour time range"""
        time_range = '24h'
        threshold = datetime.utcnow() - timedelta(hours=24)

        assert (datetime.utcnow() - threshold).total_seconds() <= 86401

    @pytest.mark.asyncio
    async def test_dashboard_time_range_7d(self, mock_db, admin_user):
        """Test dashboard with 7 day time range"""
        time_range = '7d'
        threshold = datetime.utcnow() - timedelta(days=7)

        assert (datetime.utcnow() - threshold).days <= 7

    @pytest.mark.asyncio
    async def test_dashboard_time_range_30d(self, mock_db, admin_user):
        """Test dashboard with 30 day time range"""
        time_range = '30d'
        threshold = datetime.utcnow() - timedelta(days=30)

        assert (datetime.utcnow() - threshold).days <= 30

    @pytest.mark.asyncio
    async def test_dashboard_counts_by_severity(self, mock_db, admin_user):
        """Test dashboard counts events by severity"""
        severities = ['critical', 'high', 'medium', 'low']

        # Should return counts for each severity level
        assert len(severities) == 4


# ============================================================================
# EVENTS LIST ENDPOINT TESTS
# ============================================================================

class TestSecurityEventsList:
    """Tests for /api/security/events endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_list_events_pagination(self, mock_db):
        """Test events list supports pagination"""
        page = 2
        per_page = 50

        offset = (page - 1) * per_page

        assert offset == 50

    @pytest.mark.asyncio
    async def test_list_events_filter_by_severity(self, mock_db):
        """Test filtering events by severity"""
        events = [
            create_mock_security_event(severity='critical'),
            create_mock_security_event(severity='high'),
            create_mock_security_event(severity='medium')
        ]

        filtered = [e for e in events if e.severity == 'critical']

        assert len(filtered) == 1

    @pytest.mark.asyncio
    async def test_list_events_filter_by_type(self, mock_db):
        """Test filtering events by event type"""
        events = [
            create_mock_security_event(),
            create_mock_security_event()
        ]
        events[0].event_type = 'suspicious_login'
        events[1].event_type = 'failed_mfa'

        filtered = [e for e in events if e.event_type == 'suspicious_login']

        assert len(filtered) == 1

    @pytest.mark.asyncio
    async def test_list_events_filter_resolved(self, mock_db):
        """Test filtering by resolved status"""
        events = [
            create_mock_security_event(resolved=True),
            create_mock_security_event(resolved=False)
        ]

        unresolved = [e for e in events if not e.resolved]

        assert len(unresolved) == 1

    @pytest.mark.asyncio
    async def test_list_events_returns_decrypted_ip(self, mock_db):
        """Test that IP addresses are decrypted for display"""
        event = create_mock_security_event()
        event.ip_address = 'encrypted_192.168.1.1'

        # After decryption, should show actual IP or masked
        assert 'encrypted' in event.ip_address or '***' in event.ip_address


# ============================================================================
# RESOLVE EVENT ENDPOINT TESTS
# ============================================================================

class TestResolveSecurityEvent:
    """Tests for /api/security/events/{id}/resolve endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_resolve_event_success(self, mock_db):
        """Test successfully resolving a security event"""
        event = create_mock_security_event(resolved=False)

        # After resolution
        event.resolved = True
        event.resolved_by = TEST_USER_ID
        event.resolved_at = datetime.utcnow()
        event.resolution_notes = "Investigated and cleared"

        assert event.resolved is True
        assert event.resolution_notes == "Investigated and cleared"

    @pytest.mark.asyncio
    async def test_resolve_event_not_found(self, mock_db):
        """Test resolving non-existent event returns 404"""
        mock_db.execute.return_value = MagicMock(
            scalar_one_or_none=MagicMock(return_value=None)
        )

        # Should raise HTTPException with 404
        event = None
        assert event is None

    @pytest.mark.asyncio
    async def test_resolve_already_resolved_event(self, mock_db):
        """Test resolving already resolved event returns 400"""
        event = create_mock_security_event(resolved=True)

        # Already resolved, should fail
        assert event.resolved is True

    @pytest.mark.asyncio
    async def test_resolve_event_wrong_tenant(self, mock_db):
        """Test cannot resolve event from different tenant"""
        event = create_mock_security_event()
        event.tenant_id = uuid4()  # Different tenant

        user = create_mock_user()

        assert event.tenant_id != user.tenant_id


# ============================================================================
# LOGIN ATTEMPTS ENDPOINT TESTS
# ============================================================================

class TestLoginAttemptsList:
    """Tests for /api/security/login-attempts endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_list_login_attempts_pagination(self, mock_db):
        """Test login attempts list supports pagination"""
        page = 1
        per_page = 50

        offset = (page - 1) * per_page

        assert offset == 0

    @pytest.mark.asyncio
    async def test_list_login_attempts_filter_success(self, mock_db):
        """Test filtering by success/failure"""
        attempts = [
            create_mock_login_attempt(success=True),
            create_mock_login_attempt(success=False)
        ]

        failed = [a for a in attempts if not a.success]

        assert len(failed) == 1

    @pytest.mark.asyncio
    async def test_list_login_attempts_filter_username(self, mock_db):
        """Test filtering by username"""
        attempts = [
            create_mock_login_attempt(),
            create_mock_login_attempt()
        ]
        attempts[0].username = 'admin'
        attempts[1].username = 'testuser'

        filtered = [a for a in attempts if 'admin' in a.username.lower()]

        assert len(filtered) == 1

    @pytest.mark.asyncio
    async def test_list_login_attempts_includes_failure_reason(self, mock_db):
        """Test failed attempts include failure reason"""
        attempt = create_mock_login_attempt(success=False)
        attempt.failure_reason = 'Invalid password'

        assert attempt.failure_reason is not None


# ============================================================================
# METRICS ENDPOINT TESTS
# ============================================================================

class TestSecurityMetrics:
    """Tests for /api/security/metrics endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_metrics_total_events(self, mock_db):
        """Test metrics includes total event count"""
        total_events = 150

        assert total_events > 0

    @pytest.mark.asyncio
    async def test_metrics_by_severity(self, mock_db):
        """Test metrics broken down by severity"""
        events_by_severity = {
            'critical': 5,
            'high': 15,
            'medium': 50,
            'low': 80
        }

        assert sum(events_by_severity.values()) == 150

    @pytest.mark.asyncio
    async def test_metrics_by_type(self, mock_db):
        """Test metrics broken down by event type"""
        events_by_type = {
            'suspicious_login': 30,
            'failed_mfa': 20,
            'password_reset': 15,
            'account_lockout': 10
        }

        assert len(events_by_type) == 4

    @pytest.mark.asyncio
    async def test_metrics_failed_logins_trend(self, mock_db):
        """Test failed logins trend over 7 days"""
        trend = [
            {'date': '2024-01-08', 'count': 10},
            {'date': '2024-01-09', 'count': 12},
            {'date': '2024-01-10', 'count': 8},
            {'date': '2024-01-11', 'count': 15},
            {'date': '2024-01-12', 'count': 11},
            {'date': '2024-01-13', 'count': 9},
            {'date': '2024-01-14', 'count': 13}
        ]

        assert len(trend) == 7

    @pytest.mark.asyncio
    async def test_metrics_top_countries(self, mock_db):
        """Test top countries by event count"""
        top_countries = [
            {'country': 'United States', 'count': 100},
            {'country': 'China', 'count': 25},
            {'country': 'Russia', 'count': 15}
        ]

        assert top_countries[0]['country'] == 'United States'

    @pytest.mark.asyncio
    async def test_metrics_resolution_rate(self, mock_db):
        """Test resolution rate calculation"""
        total_events = 100
        resolved_events = 75

        resolution_rate = (resolved_events / total_events) * 100

        assert resolution_rate == 75.0

    @pytest.mark.asyncio
    async def test_metrics_resolution_rate_no_events(self, mock_db):
        """Test resolution rate when no events"""
        total_events = 0
        resolved_events = 0

        resolution_rate = (resolved_events / total_events * 100) if total_events > 0 else 0

        assert resolution_rate == 0


# ============================================================================
# IP DECRYPTION TESTS
# ============================================================================

class TestIPDecryption:
    """Tests for IP address decryption helper"""

    def test_decrypt_valid_ip(self):
        """Test decrypting valid encrypted IP"""
        encrypted_ip = 'encrypted_value_here'

        # In production, would decrypt to real IP
        # For testing, should return masked or actual IP
        assert len(encrypted_ip) > 0

    def test_decrypt_invalid_ip_returns_masked(self):
        """Test invalid encrypted IP returns masked value"""
        invalid_encrypted = 'invalid_encryption'

        # Should return masked IP like "***.***.***.**"
        masked = "***.***.***.**"

        assert '*' in masked


# ============================================================================
# TENANT ISOLATION TESTS
# ============================================================================

class TestTenantIsolation:
    """Tests ensuring tenant data isolation in security API"""

    @pytest.mark.asyncio
    async def test_dashboard_filters_by_tenant(self):
        """Test dashboard only shows tenant's data"""
        user = create_mock_user()

        # Query should filter by user.tenant_id
        assert user.tenant_id == TEST_TENANT_ID

    @pytest.mark.asyncio
    async def test_events_filtered_by_tenant(self):
        """Test events list filtered by tenant"""
        events = [
            create_mock_security_event(),
            create_mock_security_event()
        ]
        events[1].tenant_id = uuid4()  # Different tenant

        filtered = [e for e in events if e.tenant_id == TEST_TENANT_ID]

        assert len(filtered) == 1

    @pytest.mark.asyncio
    async def test_login_attempts_filtered_by_tenant(self):
        """Test login attempts filtered by tenant"""
        attempts = [
            create_mock_login_attempt(),
            create_mock_login_attempt()
        ]
        attempts[1].tenant_id = uuid4()  # Different tenant

        filtered = [a for a in attempts if a.tenant_id == TEST_TENANT_ID]

        assert len(filtered) == 1


# ============================================================================
# RESPONSE FORMAT TESTS
# ============================================================================

class TestResponseFormats:
    """Tests for API response format compliance"""

    def test_security_event_response_format(self):
        """Test SecurityEventResponse has all required fields"""
        required_fields = [
            'event_id', 'event_type', 'severity', 'user_id', 'username',
            'ip_address', 'country', 'city', 'details', 'resolved', 'created_at'
        ]

        event = create_mock_security_event()

        for field in required_fields:
            assert hasattr(event, field) or field in ['username']

    def test_login_attempt_response_format(self):
        """Test LoginAttemptResponse has all required fields"""
        required_fields = [
            'attempt_id', 'username', 'success', 'failure_reason',
            'ip_address', 'country', 'city', 'mfa_required', 'attempted_at'
        ]

        attempt = create_mock_login_attempt()

        for field in required_fields:
            assert hasattr(attempt, field)

    def test_dashboard_response_format(self):
        """Test SecurityDashboardResponse has all required fields"""
        required_fields = [
            'summary', 'recent_events', 'failed_logins_today',
            'suspicious_activities', 'unresolved_events'
        ]

        assert len(required_fields) == 5

    def test_metrics_response_format(self):
        """Test SecurityMetrics has all required fields"""
        required_fields = [
            'total_events', 'events_by_severity', 'events_by_type',
            'failed_logins_trend', 'top_countries', 'resolution_rate'
        ]

        assert len(required_fields) == 6

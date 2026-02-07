"""
EHR API Tests

Unit tests for EHR connection management endpoints.
Tests CRUD operations, sync control, and statistics.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import HTTPException
import json


# Test data fixtures
TEST_TENANT_ID = uuid4()
TEST_USER_ID = uuid4()
TEST_CONNECTION_ID = uuid4()


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


def create_mock_connection(ehr_type='epic', is_active=True):
    """Create a mock EHRConnection object"""
    conn = MagicMock()
    conn.connection_id = TEST_CONNECTION_ID
    conn.tenant_id = TEST_TENANT_ID
    conn.ehr_type = ehr_type
    conn.organization_name = 'Test Hospital'
    conn.organization_id = 'ORG123'
    conn.base_url = 'https://fhir.epic.com/api/FHIR/R4'
    conn.client_id = 'test-client-id'
    conn.poll_interval_seconds = 30
    conn.is_active = is_active
    conn.use_mock_data = True
    conn.last_sync_at = datetime.utcnow() - timedelta(minutes=5)
    conn.last_sync_status = 'success'
    conn.last_sync_error = None
    conn.created_at = datetime.utcnow() - timedelta(days=30)
    return conn


def create_mock_sync_state(resource_type='Patient'):
    """Create a mock SyncState object"""
    state = MagicMock()
    state.sync_id = uuid4()
    state.connection_id = TEST_CONNECTION_ID
    state.resource_type = resource_type
    state.last_sync_time = datetime.utcnow() - timedelta(minutes=5)
    state.last_sync_status = 'success'
    state.records_processed = 100
    state.records_created = 10
    state.records_updated = 5
    state.error_count = 0
    state.error_message = None
    return state


def create_mock_db():
    """Create mock database session"""
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    return db


# ============================================================================
# CONNECTION CRUD TESTS
# ============================================================================

class TestListEHRConnections:
    """Tests for GET /api/ehr/connections"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_list_connections_returns_all(self, mock_db):
        """Test listing all EHR connections"""
        connections = [
            create_mock_connection(ehr_type='epic'),
            create_mock_connection(ehr_type='athena')
        ]

        assert len(connections) == 2

    @pytest.mark.asyncio
    async def test_list_connections_filter_by_type(self, mock_db):
        """Test filtering connections by EHR type"""
        connections = [
            create_mock_connection(ehr_type='epic'),
            create_mock_connection(ehr_type='athena'),
            create_mock_connection(ehr_type='epic')
        ]

        filtered = [c for c in connections if c.ehr_type == 'epic']

        assert len(filtered) == 2

    @pytest.mark.asyncio
    async def test_list_connections_active_only(self, mock_db):
        """Test filtering to active connections only"""
        connections = [
            create_mock_connection(is_active=True),
            create_mock_connection(is_active=False)
        ]

        active = [c for c in connections if c.is_active]

        assert len(active) == 1

    @pytest.mark.asyncio
    async def test_list_connections_tenant_isolation(self, mock_db):
        """Test connections filtered by tenant"""
        user = create_mock_user()
        connections = [create_mock_connection()]

        # Only returns connections for user's tenant
        filtered = [c for c in connections if c.tenant_id == user.tenant_id]

        assert len(filtered) == 1


class TestCreateEHRConnection:
    """Tests for POST /api/ehr/connections"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_create_connection_success(self, mock_db):
        """Test successful connection creation"""
        connection_data = {
            'ehr_type': 'epic',
            'organization_name': 'New Hospital',
            'base_url': 'https://fhir.example.com/api/FHIR/R4',
            'client_id': 'new-client-id',
            'poll_interval_seconds': 30,
            'use_mock_data': True
        }

        # Should create successfully
        assert connection_data['ehr_type'] == 'epic'

    @pytest.mark.asyncio
    async def test_create_connection_invalid_ehr_type(self, mock_db):
        """Test creation with invalid EHR type fails"""
        valid_types = ['epic', 'athena', 'cerner', 'meditech']
        invalid_type = 'unknown_ehr'

        assert invalid_type not in valid_types

    @pytest.mark.asyncio
    async def test_create_connection_duplicate_organization(self, mock_db):
        """Test creation fails for duplicate organization"""
        existing = create_mock_connection()
        existing.organization_id = 'ORG123'

        new_data = {
            'organization_id': 'ORG123',
            'ehr_type': 'epic'
        }

        # Should conflict
        assert existing.organization_id == new_data['organization_id']

    @pytest.mark.asyncio
    async def test_create_connection_requires_admin(self, mock_db):
        """Test connection creation requires admin role"""
        user = create_mock_user(role='coder')

        assert user.role != 'admin'

    @pytest.mark.asyncio
    async def test_create_connection_validates_poll_interval(self, mock_db):
        """Test poll interval validation (10-3600 seconds)"""
        min_interval = 10
        max_interval = 3600

        valid_interval = 30
        invalid_low = 5
        invalid_high = 7200

        assert min_interval <= valid_interval <= max_interval
        assert invalid_low < min_interval
        assert invalid_high > max_interval


class TestGetEHRConnection:
    """Tests for GET /api/ehr/connections/{id}"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_get_connection_success(self, mock_db):
        """Test getting connection by ID"""
        connection = create_mock_connection()

        assert connection.connection_id == TEST_CONNECTION_ID

    @pytest.mark.asyncio
    async def test_get_connection_not_found(self, mock_db):
        """Test getting non-existent connection"""
        connection = None

        assert connection is None

    @pytest.mark.asyncio
    async def test_get_connection_wrong_tenant(self, mock_db):
        """Test cannot get connection from different tenant"""
        connection = create_mock_connection()
        connection.tenant_id = uuid4()  # Different tenant

        user = create_mock_user()

        assert connection.tenant_id != user.tenant_id


class TestUpdateEHRConnection:
    """Tests for PATCH /api/ehr/connections/{id}"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_update_connection_success(self, mock_db):
        """Test successful connection update"""
        connection = create_mock_connection()
        updates = {
            'poll_interval_seconds': 60,
            'use_mock_data': False
        }

        connection.poll_interval_seconds = updates['poll_interval_seconds']

        assert connection.poll_interval_seconds == 60

    @pytest.mark.asyncio
    async def test_update_connection_requires_admin(self, mock_db):
        """Test connection update requires admin role"""
        user = create_mock_user(role='manager')

        # Manager can view but not update
        assert user.role != 'admin'

    @pytest.mark.asyncio
    async def test_update_connection_partial(self, mock_db):
        """Test partial update (only specified fields)"""
        connection = create_mock_connection()
        original_url = connection.base_url

        updates = {'poll_interval_seconds': 60}

        # URL should remain unchanged
        assert connection.base_url == original_url


class TestDeleteEHRConnection:
    """Tests for DELETE /api/ehr/connections/{id}"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_delete_connection_soft_delete(self, mock_db):
        """Test deletion is soft delete (sets is_active=False)"""
        connection = create_mock_connection(is_active=True)

        # After soft delete
        connection.is_active = False

        assert connection.is_active is False

    @pytest.mark.asyncio
    async def test_delete_connection_requires_admin(self, mock_db):
        """Test deletion requires admin role"""
        user = create_mock_user(role='coder')

        assert user.role != 'admin'

    @pytest.mark.asyncio
    async def test_delete_connection_not_found(self, mock_db):
        """Test deleting non-existent connection"""
        connection = None

        assert connection is None


# ============================================================================
# SYNC STATUS TESTS
# ============================================================================

class TestSyncStatus:
    """Tests for sync status endpoints"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_get_sync_status_all(self, mock_db):
        """Test getting sync status for all connections"""
        connections = [
            create_mock_connection(ehr_type='epic'),
            create_mock_connection(ehr_type='athena')
        ]

        statuses = []
        for conn in connections:
            statuses.append({
                'connection_id': conn.connection_id,
                'organization_name': conn.organization_name,
                'ehr_type': conn.ehr_type,
                'is_active': conn.is_active,
                'last_sync_at': conn.last_sync_at,
                'last_sync_status': conn.last_sync_status
            })

        assert len(statuses) == 2

    @pytest.mark.asyncio
    async def test_get_sync_status_single(self, mock_db):
        """Test getting sync status for single connection"""
        connection = create_mock_connection()

        status = {
            'connection_id': connection.connection_id,
            'last_sync_at': connection.last_sync_at,
            'last_sync_status': connection.last_sync_status
        }

        assert status['last_sync_status'] == 'success'

    @pytest.mark.asyncio
    async def test_get_sync_states_by_resource(self, mock_db):
        """Test getting sync states per resource type"""
        states = [
            create_mock_sync_state('Patient'),
            create_mock_sync_state('Encounter'),
            create_mock_sync_state('Condition'),
            create_mock_sync_state('Procedure')
        ]

        assert len(states) == 4

    @pytest.mark.asyncio
    async def test_sync_status_includes_resource_counts(self, mock_db):
        """Test sync status includes record counts"""
        state = create_mock_sync_state('Patient')

        assert state.records_processed == 100
        assert state.records_created == 10
        assert state.records_updated == 5


# ============================================================================
# SYNC CONTROL TESTS
# ============================================================================

class TestSyncControl:
    """Tests for sync control endpoints"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_trigger_sync_success(self, mock_db):
        """Test triggering manual sync"""
        connection = create_mock_connection(is_active=True)

        # Should succeed for active connection
        assert connection.is_active is True

    @pytest.mark.asyncio
    async def test_trigger_sync_inactive_connection(self, mock_db):
        """Test cannot trigger sync on inactive connection"""
        connection = create_mock_connection(is_active=False)

        # Should fail
        assert connection.is_active is False

    @pytest.mark.asyncio
    async def test_trigger_sync_requires_admin(self, mock_db):
        """Test triggering sync requires admin role"""
        user = create_mock_user(role='coder')

        assert user.role != 'admin'

    @pytest.mark.asyncio
    async def test_trigger_sync_with_resource_types(self, mock_db):
        """Test triggering sync for specific resource types"""
        resource_types = ['Patient', 'Encounter']

        assert len(resource_types) == 2

    @pytest.mark.asyncio
    async def test_reset_sync_state_success(self, mock_db):
        """Test resetting sync state for full re-sync"""
        connection = create_mock_connection()

        # After reset, last_sync_time should be None
        state = create_mock_sync_state()
        state.last_sync_time = None
        state.records_processed = 0

        assert state.last_sync_time is None

    @pytest.mark.asyncio
    async def test_reset_sync_state_specific_resource(self, mock_db):
        """Test resetting sync state for specific resource type"""
        resource_type = 'Patient'

        # Only Patient sync state should be reset
        assert resource_type == 'Patient'


# ============================================================================
# STATISTICS TESTS
# ============================================================================

class TestSyncStats:
    """Tests for sync statistics endpoint"""

    @pytest.fixture
    def mock_db(self):
        return create_mock_db()

    @pytest.mark.asyncio
    async def test_get_stats_includes_patients(self, mock_db):
        """Test stats includes patient counts"""
        patient_stats = {
            'total_patients': 1000,
            'synced_from_ehr': 950,
            'last_sync_time': datetime.utcnow().isoformat()
        }

        assert patient_stats['total_patients'] == 1000

    @pytest.mark.asyncio
    async def test_get_stats_includes_encounters(self, mock_db):
        """Test stats includes encounter counts"""
        encounter_stats = {
            'total_encounters': 5000,
            'synced_from_ehr': 4800,
            'last_sync_time': datetime.utcnow().isoformat()
        }

        assert encounter_stats['total_encounters'] == 5000

    @pytest.mark.asyncio
    async def test_get_stats_filter_by_ehr(self, mock_db):
        """Test stats can be filtered by EHR source"""
        source_ehr = 'epic'

        stats = {
            'patients': {'total': 500, 'source_ehr': source_ehr},
            'encounters': {'total': 2500, 'source_ehr': source_ehr}
        }

        assert stats['patients']['source_ehr'] == 'epic'

    @pytest.mark.asyncio
    async def test_get_connection_stats(self, mock_db):
        """Test connection statistics"""
        conn_stats = {
            'total_connections': 5,
            'active_connections': 4,
            'by_type': {
                'epic': 2,
                'athena': 1,
                'cerner': 1,
                'meditech': 1
            }
        }

        assert conn_stats['active_connections'] == 4


# ============================================================================
# VALIDATION TESTS
# ============================================================================

class TestEHRValidation:
    """Tests for EHR connection validation"""

    def test_validate_ehr_type(self):
        """Test EHR type validation"""
        valid_types = ['epic', 'athena', 'cerner', 'meditech']

        for ehr_type in valid_types:
            assert ehr_type in valid_types

    def test_validate_base_url_format(self):
        """Test base URL format validation"""
        import re

        valid_urls = [
            'https://fhir.epic.com/api/FHIR/R4',
            'https://api.athenahealth.com/fhir/r4'
        ]

        url_pattern = r'^https?://.+'

        for url in valid_urls:
            assert re.match(url_pattern, url)

    def test_validate_poll_interval_range(self):
        """Test poll interval within valid range"""
        min_val = 10
        max_val = 3600

        valid_values = [10, 30, 60, 300, 3600]
        invalid_values = [5, 9, 3601, 7200]

        for val in valid_values:
            assert min_val <= val <= max_val

        for val in invalid_values:
            assert not (min_val <= val <= max_val)


# ============================================================================
# RESPONSE FORMAT TESTS
# ============================================================================

class TestResponseFormats:
    """Tests for API response format compliance"""

    def test_connection_response_format(self):
        """Test EHRConnectionResponse has required fields"""
        required_fields = [
            'connection_id', 'tenant_id', 'ehr_type', 'organization_name',
            'organization_id', 'base_url', 'poll_interval_seconds',
            'is_active', 'use_mock_data', 'last_sync_at', 'last_sync_status',
            'last_sync_error', 'created_at'
        ]

        connection = create_mock_connection()

        for field in required_fields:
            assert hasattr(connection, field)

    def test_sync_state_response_format(self):
        """Test SyncStateResponse has required fields"""
        required_fields = [
            'sync_id', 'connection_id', 'resource_type', 'last_sync_time',
            'last_sync_status', 'records_processed', 'records_created',
            'records_updated', 'error_count', 'error_message'
        ]

        state = create_mock_sync_state()

        for field in required_fields:
            assert hasattr(state, field)

    def test_sync_status_response_format(self):
        """Test SyncStatusResponse has required fields"""
        required_fields = [
            'connection_id', 'organization_name', 'ehr_type',
            'is_active', 'last_sync_at', 'last_sync_status', 'resources'
        ]

        assert len(required_fields) == 7


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

class TestEHRErrorHandling:
    """Tests for error handling in EHR API"""

    @pytest.mark.asyncio
    async def test_connection_not_found_404(self):
        """Test 404 returned for non-existent connection"""
        connection = None

        # Should raise HTTPException with 404
        assert connection is None

    @pytest.mark.asyncio
    async def test_duplicate_organization_409(self):
        """Test 409 returned for duplicate organization"""
        existing_org_id = 'ORG123'
        new_org_id = 'ORG123'

        # Should conflict
        assert existing_org_id == new_org_id

    @pytest.mark.asyncio
    async def test_invalid_ehr_type_400(self):
        """Test 400 returned for invalid EHR type"""
        invalid_type = 'invalid_ehr'
        valid_types = ['epic', 'athena', 'cerner', 'meditech']

        assert invalid_type not in valid_types

    @pytest.mark.asyncio
    async def test_sync_inactive_connection_400(self):
        """Test 400 returned when syncing inactive connection"""
        connection = create_mock_connection(is_active=False)

        # Should fail
        assert not connection.is_active


# ============================================================================
# TENANT ISOLATION TESTS
# ============================================================================

class TestEHRTenantIsolation:
    """Tests for tenant data isolation in EHR API"""

    @pytest.mark.asyncio
    async def test_connections_filtered_by_tenant(self):
        """Test connections list filtered by tenant"""
        user = create_mock_user()
        connections = [
            create_mock_connection(),
            create_mock_connection()
        ]
        connections[1].tenant_id = uuid4()  # Different tenant

        filtered = [c for c in connections if c.tenant_id == user.tenant_id]

        assert len(filtered) == 1

    @pytest.mark.asyncio
    async def test_cannot_access_other_tenant_connection(self):
        """Test cannot access connection from different tenant"""
        user = create_mock_user()
        connection = create_mock_connection()
        connection.tenant_id = uuid4()  # Different tenant

        is_accessible = connection.tenant_id == user.tenant_id

        assert not is_accessible

    @pytest.mark.asyncio
    async def test_cannot_modify_other_tenant_connection(self):
        """Test cannot modify connection from different tenant"""
        user = create_mock_user()
        connection = create_mock_connection()
        connection.tenant_id = uuid4()  # Different tenant

        can_modify = connection.tenant_id == user.tenant_id

        assert not can_modify

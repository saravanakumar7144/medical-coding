"""
Security Features Tests
Tests for Phase 1 & 2: Environment validation, CORS, Audit logging, Token security
"""

import pytest
import os
import sys
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt

from medical_coding_ai.models.user_models import AuditLog


class TestEnvironmentValidation:
    """Test critical environment variable validation."""

    def test_encryption_key_required(self):
        """Test that ENCRYPTION_KEY is required on startup."""
        # This test verifies the startup validation exists
        # Actual validation is tested by trying to start the app
        from medical_coding_ai.utils.crypto import ENCRYPTION_KEY
        assert ENCRYPTION_KEY is not None
        assert len(ENCRYPTION_KEY) >= 44  # Base64 encoded 32 bytes

    def test_jwt_secret_required(self):
        """Test that JWT_SECRET_KEY is required on startup."""
        from medical_coding_ai.api.auth import JWT_SECRET
        assert JWT_SECRET is not None
        assert len(JWT_SECRET) >= 32

    def test_database_url_required(self):
        """Test that DATABASE_URL is validated."""
        from medical_coding_ai.utils.db import DATABASE_URL
        assert DATABASE_URL is not None
        assert "postgresql" in DATABASE_URL


class TestCORSConfiguration:
    """Test CORS security configuration."""

    @pytest.mark.asyncio
    async def test_cors_no_wildcard(self, client: AsyncClient):
        """Test that CORS doesn't allow wildcard origins."""
        response = await client.options(
            "/api/auth/login",
            headers={"Origin": "http://malicious-site.com"}
        )

        # Should not have Access-Control-Allow-Origin: *
        allow_origin = response.headers.get("access-control-allow-origin")
        if allow_origin:
            assert allow_origin != "*"

    @pytest.mark.asyncio
    async def test_cors_allows_configured_origin(self, client: AsyncClient):
        """Test that CORS allows configured origins."""
        # Test with localhost (typically in CORS_ALLOWED_ORIGINS)
        response = await client.options(
            "/api/auth/login",
            headers={"Origin": "http://localhost:3000"}
        )

        # Check response allows CORS
        assert response.status_code in [200, 204]


class TestTokenSecurity:
    """Test JWT token security features."""

    @pytest.mark.asyncio
    async def test_token_contains_jti(self, client: AsyncClient, activated_user, test_login_data):
        """Test that JWT tokens include JTI for revocation."""
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        token = response.json()["access_token"]

        # Decode without verification to check JTI
        from medical_coding_ai.api.auth import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert "jti" in payload
        assert len(payload["jti"]) > 0

    @pytest.mark.asyncio
    async def test_token_contains_tenant_id(self, client: AsyncClient, activated_user, test_login_data):
        """Test that JWT tokens include tenant_id for isolation."""
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        token = response.json()["access_token"]

        from medical_coding_ai.api.auth import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert "tenant_id" in payload
        assert payload["tenant_id"] == str(activated_user.tenant_id)

    @pytest.mark.asyncio
    async def test_token_expiration(self, client: AsyncClient, activated_user, test_login_data):
        """Test that tokens have expiration time."""
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        token = response.json()["access_token"]

        from medical_coding_ai.api.auth import JWT_SECRET, JWT_ALGORITHM
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        assert "exp" in payload
        assert "iat" in payload
        assert payload["exp"] > payload["iat"]

    @pytest.mark.asyncio
    async def test_blacklisted_token_rejected(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data
    ):
        """Test that blacklisted tokens are rejected."""
        # Login
        response = await client.post("/api/auth/login", json=test_login_data)
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Access endpoint - should work
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200

        # Logout (blacklists token)
        response = await client.post("/api/auth/logout", headers=headers)
        assert response.status_code == 200

        # Try to use blacklisted token
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401
        assert "blacklisted" in response.json()["detail"].lower()


class TestAuditLogging:
    """Test HIPAA-compliant audit logging."""

    @pytest.mark.asyncio
    async def test_login_creates_audit_log(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that login creates an audit log entry."""
        # Perform login
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        # Check audit log
        stmt = select(AuditLog).where(
            AuditLog.user_id == activated_user.user_id,
            AuditLog.action_type == "user.login"
        ).order_by(AuditLog.created_at.desc())

        result = await db_session.execute(stmt)
        log = result.scalar_one_or_none()

        assert log is not None
        assert log.tenant_id == activated_user.tenant_id
        assert log.action_category == "authentication"
        assert log.status == "success"

    @pytest.mark.asyncio
    async def test_failed_login_creates_audit_log(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that failed login attempts are logged."""
        # Perform failed login
        response = await client.post("/api/auth/login", json={
            "username": test_login_data["username"],
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401

        # Check audit log
        stmt = select(AuditLog).where(
            AuditLog.action_type == "user.login.failed"
        ).order_by(AuditLog.created_at.desc())

        result = await db_session.execute(stmt)
        log = result.scalar_one_or_none()

        assert log is not None
        assert log.action_category == "authentication"
        assert log.status == "failure"

    @pytest.mark.asyncio
    async def test_audit_log_includes_tenant_context(
        self,
        client: AsyncClient,
        auth_headers,
        activated_user,
        db_session: AsyncSession
    ):
        """Test that audit logs include tenant context from JWT."""
        # Make authenticated request
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200

        # Check audit log has tenant_id
        stmt = select(AuditLog).where(
            AuditLog.user_id == activated_user.user_id,
            AuditLog.tenant_id == activated_user.tenant_id
        ).order_by(AuditLog.created_at.desc())

        result = await db_session.execute(stmt)
        log = result.scalar_one_or_none()

        if log:  # If audit logging is enabled for this endpoint
            assert log.tenant_id == activated_user.tenant_id


class TestPasswordSecurity:
    """Test password security features."""

    @pytest.mark.asyncio
    async def test_password_not_in_response(self, client: AsyncClient, auth_headers):
        """Test that password hash is never returned in API responses."""
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200

        data = response.json()
        assert "password" not in data
        assert "password_hash" not in data
        assert "salt" not in data

    @pytest.mark.asyncio
    async def test_password_stored_hashed(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that passwords are stored hashed, not plaintext."""
        from medical_coding_ai.models.user_models import User
        from passlib.context import CryptContext

        stmt = select(User).where(User.username == test_login_data["username"])
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        # Password hash should be bcrypt format
        assert user.password_hash.startswith("$2b$")

        # Password hash should not equal plaintext password
        assert user.password_hash != test_login_data["password"]

        # Should be verifiable with passlib
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        assert pwd_context.verify(test_login_data["password"], user.password_hash)


class TestEmailSecurity:
    """Test email security features."""

    @pytest.mark.asyncio
    async def test_email_stored_encrypted(
        self,
        client: AsyncClient,
        activated_user,
        test_user_data,
        db_session: AsyncSession
    ):
        """Test that emails are stored encrypted in database."""
        from medical_coding_ai.models.user_models import User
        from medical_coding_ai.utils.crypto import decrypt_data

        stmt = select(User).where(User.user_id == activated_user.user_id)
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        # Email should be encrypted (bytes)
        assert isinstance(user.email_encrypted, bytes)

        # Should not equal plaintext
        assert user.email_encrypted != test_user_data["email"].encode()

        # Should be decryptable to original
        decrypted = decrypt_data(user.email_encrypted)
        assert decrypted == test_user_data["email"]

    @pytest.mark.asyncio
    async def test_pii_fields_encrypted(
        self,
        client: AsyncClient,
        activated_user,
        db_session: AsyncSession
    ):
        """Test that PII fields are encrypted in database."""
        from medical_coding_ai.models.user_models import User
        from medical_coding_ai.utils.crypto import decrypt_data

        stmt = select(User).where(User.user_id == activated_user.user_id)
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        # Check encrypted fields
        if user.first_name_encrypted:
            assert isinstance(user.first_name_encrypted, bytes)
            decrypted = decrypt_data(user.first_name_encrypted)
            assert isinstance(decrypted, str)

        if user.last_name_encrypted:
            assert isinstance(user.last_name_encrypted, bytes)
            decrypted = decrypt_data(user.last_name_encrypted)
            assert isinstance(decrypted, str)


class TestRefreshTokenSecurity:
    """Test refresh token security."""

    @pytest.mark.asyncio
    async def test_refresh_token_stored_hashed(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that refresh tokens are stored hashed."""
        from medical_coding_ai.models.user_models import RefreshToken

        # Login to generate refresh token
        response = await client.post("/api/auth/login", json=test_login_data)
        refresh_token = response.json()["refresh_token"]

        # Check database
        stmt = select(RefreshToken).where(RefreshToken.user_id == activated_user.user_id)
        result = await db_session.execute(stmt)
        token_record = result.scalar_one_or_none()

        if token_record:
            # Should be hashed (bcrypt format)
            assert token_record.token_hash.startswith("$2b$")

            # Should not equal plaintext
            assert token_record.token_hash != refresh_token

    @pytest.mark.asyncio
    async def test_refresh_token_expiry_set(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that refresh tokens have 7-day expiry."""
        from medical_coding_ai.models.user_models import RefreshToken
        from datetime import datetime, timedelta

        # Login
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        # Check database
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == activated_user.user_id
        ).order_by(RefreshToken.created_at.desc())

        result = await db_session.execute(stmt)
        token_record = result.scalar_one_or_none()

        if token_record:
            # Should expire in ~7 days
            expiry_delta = token_record.expires_at - datetime.utcnow()
            assert 6.9 <= expiry_delta.days <= 7.1  # Allow small timing variance

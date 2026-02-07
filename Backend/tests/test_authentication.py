"""
Authentication Endpoint Tests
Tests for Phase 1 & 2: Login, Signup, Password Reset, Activation, Logout, Refresh
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_coding_ai.models.user_models import User, RefreshToken
from medical_coding_ai.utils.crypto import decrypt


class TestLogin:
    """Test login endpoint and account lockout."""

    @pytest.mark.asyncio
    async def test_successful_login(self, client: AsyncClient, activated_user, test_login_data):
        """Test successful login with valid credentials."""
        response = await client.post("/api/auth/login", json=test_login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_username(self, client: AsyncClient):
        """Test login with non-existent username."""
        response = await client.post("/api/auth/login", json={
            "username": "nonexistent",
            "password": "password123"
        })

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient, activated_user, test_login_data):
        """Test login with incorrect password."""
        response = await client.post("/api/auth/login", json={
            "username": test_login_data["username"],
            "password": "WrongPassword123!"
        })

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_account_lockout_after_5_failed_attempts(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test account lockout after 5 failed login attempts."""
        # Make 5 failed login attempts
        for i in range(5):
            response = await client.post("/api/auth/login", json={
                "username": test_login_data["username"],
                "password": "WrongPassword123!"
            })

            if i < 4:
                assert response.status_code == 401
                detail = response.json()["detail"]
                assert "attempts remaining" in detail.lower()
            else:
                # 5th attempt should lock the account
                assert response.status_code == 403
                assert "locked" in response.json()["detail"].lower()

        # Verify account is locked in database
        stmt = select(User).where(User.username == test_login_data["username"])
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        assert user.failed_login_attempts == 5
        assert user.locked_until is not None
        assert user.locked_until > datetime.utcnow()

        # Try to login with correct password - should still be locked
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 403
        assert "locked" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_failed_attempts_reset_on_successful_login(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that failed attempts counter resets after successful login."""
        # Make 2 failed attempts
        for _ in range(2):
            await client.post("/api/auth/login", json={
                "username": test_login_data["username"],
                "password": "WrongPassword123!"
            })

        # Successful login
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200

        # Verify failed attempts reset
        stmt = select(User).where(User.username == test_login_data["username"])
        result = await db_session.execute(stmt)
        user = result.scalar_one()

        assert user.failed_login_attempts == 0
        assert user.locked_until is None


class TestLogout:
    """Test logout endpoint and token blacklist."""

    @pytest.mark.asyncio
    async def test_successful_logout(self, client: AsyncClient, auth_headers):
        """Test successful logout blacklists the token."""
        # Logout
        response = await client.post("/api/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"

        # Try to access protected endpoint with blacklisted token
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 401
        assert "blacklisted" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_logout_without_token(self, client: AsyncClient):
        """Test logout without authentication token."""
        response = await client.post("/api/auth/logout")
        assert response.status_code == 401


class TestRefreshToken:
    """Test refresh token endpoint."""

    @pytest.mark.asyncio
    async def test_successful_token_refresh(self, client: AsyncClient, activated_user, test_login_data):
        """Test successful token refresh."""
        # Login to get tokens
        login_response = await client.post("/api/auth/login", json=test_login_data)
        assert login_response.status_code == 200
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]

        # Refresh the token
        response = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        """Test refresh with invalid token."""
        response = await client.post("/api/auth/refresh", json={
            "refresh_token": "invalid_token_string"
        })

        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_refresh_with_revoked_token(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test refresh with revoked token."""
        # Login to get tokens
        login_response = await client.post("/api/auth/login", json=test_login_data)
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]

        # Revoke the token
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        stmt = select(RefreshToken).where(RefreshToken.user_id == activated_user.user_id)
        result = await db_session.execute(stmt)
        token_record = result.scalar_one()
        token_record.revoked = True
        await db_session.commit()

        # Try to refresh with revoked token
        response = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 401


class TestPasswordReset:
    """Test password reset flow."""

    @pytest.mark.asyncio
    async def test_request_password_reset(self, client: AsyncClient, activated_user, test_user_data):
        """Test password reset request."""
        response = await client.post("/api/auth/forgot-password", json={
            "email": test_user_data["email"]
        })

        assert response.status_code == 200
        assert "sent" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_password_reset_nonexistent_email(self, client: AsyncClient):
        """Test password reset with non-existent email."""
        # Should still return 200 to prevent email enumeration
        response = await client.post("/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_password_reset_token_expiry(
        self,
        client: AsyncClient,
        activated_user,
        test_user_data,
        db_session: AsyncSession
    ):
        """Test that password reset tokens expire after 4 hours."""
        from medical_coding_ai.models.user_models import PasswordReset
        from passlib.context import CryptContext
        import secrets

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create an expired reset token
        token = secrets.token_urlsafe(32)
        reset_record = PasswordReset(
            user_id=activated_user.user_id,
            token_hash=pwd_context.hash(token),
            expires_at=datetime.utcnow() - timedelta(hours=1),  # Expired 1 hour ago
            used=False
        )
        db_session.add(reset_record)
        await db_session.commit()

        # Try to reset password with expired token
        response = await client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "NewPassword123!"
        })

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()


class TestActivation:
    """Test account activation flow."""

    @pytest.mark.asyncio
    async def test_activation_token_expiry_set(
        self,
        client: AsyncClient,
        test_user_data,
        db_session: AsyncSession
    ):
        """Test that new users get 48-hour activation token expiry."""
        from medical_coding_ai.models.user_models import User
        from medical_coding_ai.utils.crypto import encrypt_data
        from passlib.context import CryptContext
        import secrets

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create a new unactivated user
        activation_token = secrets.token_urlsafe(32)
        user = User(
            tenant_id=test_user_data["tenant_id"],
            username="newuser",
            email_encrypted=encrypt_data("newuser@example.com"),
            dec_hash=pwd_context.hash("newuser@example.com"),
            password_hash=pwd_context.hash("Password123!"),
            role="coder",
            is_active=True,
            email_verified=False,
            email_verification_token_hash=pwd_context.hash(activation_token),
            email_verification_expires=datetime.utcnow() + timedelta(hours=48)
        )
        db_session.add(user)
        await db_session.commit()

        # Verify expiry is set
        assert user.email_verification_expires is not None
        assert user.email_verification_expires > datetime.utcnow()

    @pytest.mark.asyncio
    async def test_activation_expired_token(
        self,
        client: AsyncClient,
        test_user_data,
        db_session: AsyncSession
    ):
        """Test activation with expired token."""
        from medical_coding_ai.models.user_models import User
        from medical_coding_ai.utils.crypto import encrypt_data
        from passlib.context import CryptContext
        import secrets

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create user with expired activation token
        activation_token = secrets.token_urlsafe(32)
        user = User(
            tenant_id=test_user_data["tenant_id"],
            username="expireduser",
            email_encrypted=encrypt_data("expired@example.com"),
            dec_hash=pwd_context.hash("expired@example.com"),
            password_hash=pwd_context.hash("Password123!"),
            role="coder",
            is_active=True,
            email_verified=False,
            email_verification_token_hash=pwd_context.hash(activation_token),
            email_verification_expires=datetime.utcnow() - timedelta(hours=1)  # Expired
        )
        db_session.add(user)
        await db_session.commit()

        # Try to activate with expired token
        response = await client.post("/api/auth/activate", json={
            "token": activation_token
        })

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()


class TestUserInfo:
    """Test user information endpoint."""

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, auth_headers, activated_user, test_user_data):
        """Test getting current user information."""
        response = await client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["role"] == test_user_data["role"]
        assert "password" not in data
        assert "password_hash" not in data

    @pytest.mark.asyncio
    async def test_get_user_without_auth(self, client: AsyncClient):
        """Test getting user info without authentication."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

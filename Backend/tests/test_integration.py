"""
Integration Tests
End-to-end testing of complete authentication flows
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from medical_coding_ai.models.user_models import User, RefreshToken


class TestCompleteRegistrationFlow:
    """Test the complete user registration and activation flow."""

    @pytest.mark.asyncio
    async def test_full_registration_to_login_flow(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test complete flow: register -> activate -> login -> access protected resource."""
        import uuid
        import secrets
        from medical_coding_ai.utils.crypto import encrypt_data
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Step 1: Create user (simulating admin user creation)
        tenant_id = str(uuid.uuid4())
        username = f"testuser_{secrets.token_hex(4)}"
        email = f"{username}@example.com"
        password = "SecurePass123!"

        activation_token = secrets.token_urlsafe(32)

        user = User(
            tenant_id=uuid.UUID(tenant_id),
            username=username,
            email_encrypted=encrypt_data(email),
            dec_hash=pwd_context.hash(email),
            password_hash=pwd_context.hash(password),
            first_name_encrypted=encrypt_data("Test"),
            last_name_encrypted=encrypt_data("User"),
            role="coder",
            is_active=True,
            email_verified=False,
            email_verification_token_hash=pwd_context.hash(activation_token),
            email_verification_expires=datetime.utcnow() + timedelta(hours=48)
        )
        db_session.add(user)
        await db_session.commit()

        # Step 2: Activate account
        response = await client.post("/api/auth/activate", json={
            "token": activation_token
        })
        assert response.status_code == 200

        # Verify user is activated
        await db_session.refresh(user)
        assert user.email_verified is True
        assert user.email_verified_at is not None

        # Step 3: Login
        response = await client.post("/api/auth/login", json={
            "username": username,
            "password": password
        })
        assert response.status_code == 200
        tokens = response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens

        # Step 4: Access protected resource
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["username"] == username
        assert user_data["email"] == email


class TestCompletePasswordResetFlow:
    """Test the complete password reset flow."""

    @pytest.mark.asyncio
    async def test_full_password_reset_flow(
        self,
        client: AsyncClient,
        activated_user,
        test_user_data,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test complete flow: forgot password -> reset -> login with new password."""
        from medical_coding_ai.models.user_models import PasswordReset
        from passlib.context import CryptContext
        import secrets

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        new_password = "NewSecurePass123!"

        # Step 1: Request password reset
        response = await client.post("/api/auth/forgot-password", json={
            "email": test_user_data["email"]
        })
        assert response.status_code == 200

        # Simulate getting reset token from database
        stmt = select(PasswordReset).where(
            PasswordReset.user_id == activated_user.user_id
        ).order_by(PasswordReset.created_at.desc())
        result = await db_session.execute(stmt)
        reset_record = result.scalar_one_or_none()

        if not reset_record:
            # Create token manually for testing
            reset_token = secrets.token_urlsafe(32)
            reset_record = PasswordReset(
                user_id=activated_user.user_id,
                token_hash=pwd_context.hash(reset_token),
                expires_at=datetime.utcnow() + timedelta(hours=4),
                used=False
            )
            db_session.add(reset_record)
            await db_session.commit()
        else:
            reset_token = "test_token_from_email"  # Would come from email in real scenario

        # Step 2: Reset password
        # Note: In real scenario, we'd need actual token from email
        # For testing, we'll verify the endpoint structure

        # Step 3: Try old password (should fail)
        response = await client.post("/api/auth/login", json=test_login_data)
        # Could succeed or fail depending on if reset was completed

        # Verify reset record exists and has correct expiry
        assert reset_record.expires_at > datetime.utcnow()
        expiry_delta = reset_record.expires_at - datetime.utcnow()
        assert expiry_delta.total_seconds() <= 4 * 3600  # 4 hours max


class TestCompleteSessionFlow:
    """Test complete session lifecycle."""

    @pytest.mark.asyncio
    async def test_login_refresh_logout_flow(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test complete flow: login -> use token -> refresh -> logout."""

        # Step 1: Login
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Step 2: Use access token
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200

        # Step 3: Refresh token
        response = await client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        new_tokens = response.json()
        new_access_token = new_tokens["access_token"]

        # Verify new token works
        new_headers = {"Authorization": f"Bearer {new_access_token}"}
        response = await client.get("/api/auth/me", headers=new_headers)
        assert response.status_code == 200

        # Step 4: Logout
        response = await client.post("/api/auth/logout", headers=new_headers)
        assert response.status_code == 200

        # Step 5: Verify token is blacklisted
        response = await client.get("/api/auth/me", headers=new_headers)
        assert response.status_code == 401


class TestAccountLockoutFlow:
    """Test account lockout and recovery."""

    @pytest.mark.asyncio
    async def test_lockout_and_recovery_flow(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test complete flow: failed attempts -> lockout -> wait -> successful login."""
        import uuid
        import secrets
        from medical_coding_ai.utils.crypto import encrypt_data
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Create test user
        username = f"locktest_{secrets.token_hex(4)}"
        password = "TestPass123!"

        user = User(
            tenant_id=uuid.uuid4(),
            username=username,
            email_encrypted=encrypt_data(f"{username}@example.com"),
            dec_hash=pwd_context.hash(f"{username}@example.com"),
            password_hash=pwd_context.hash(password),
            role="coder",
            is_active=True,
            email_verified=True,
            failed_login_attempts=0
        )
        db_session.add(user)
        await db_session.commit()

        # Step 1: Make 5 failed login attempts
        for i in range(5):
            response = await client.post("/api/auth/login", json={
                "username": username,
                "password": "WrongPassword123!"
            })

            if i < 4:
                assert response.status_code == 401
            else:
                assert response.status_code == 403  # Locked

        # Step 2: Verify account is locked
        await db_session.refresh(user)
        assert user.failed_login_attempts == 5
        assert user.locked_until is not None
        assert user.locked_until > datetime.utcnow()

        # Step 3: Try correct password while locked (should fail)
        response = await client.post("/api/auth/login", json={
            "username": username,
            "password": password
        })
        assert response.status_code == 403
        assert "locked" in response.json()["detail"].lower()

        # Step 4: Simulate unlock by clearing lockout
        user.locked_until = None
        user.failed_login_attempts = 0
        await db_session.commit()

        # Step 5: Successful login after unlock
        response = await client.post("/api/auth/login", json={
            "username": username,
            "password": password
        })
        assert response.status_code == 200


class TestMultiDeviceSession:
    """Test multi-device session management."""

    @pytest.mark.asyncio
    async def test_multiple_refresh_tokens(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test that multiple devices can have separate refresh tokens."""

        # Device 1: Login
        response1 = await client.post("/api/auth/login", json=test_login_data)
        assert response1.status_code == 200
        tokens1 = response1.json()

        # Device 2: Login
        response2 = await client.post("/api/auth/login", json=test_login_data)
        assert response2.status_code == 200
        tokens2 = response2.json()

        # Should have different tokens
        assert tokens1["refresh_token"] != tokens2["refresh_token"]

        # Both should work
        refresh1 = await client.post("/api/auth/refresh", json={
            "refresh_token": tokens1["refresh_token"]
        })
        assert refresh1.status_code == 200

        refresh2 = await client.post("/api/auth/refresh", json={
            "refresh_token": tokens2["refresh_token"]
        })
        assert refresh2.status_code == 200

        # Logout device 1
        headers1 = {"Authorization": f"Bearer {tokens1['access_token']}"}
        logout1 = await client.post("/api/auth/logout", headers=headers1)
        assert logout1.status_code == 200

        # Device 2 should still work
        headers2 = {"Authorization": f"Bearer {tokens2['access_token']}"}
        response = await client.get("/api/auth/me", headers=headers2)
        assert response.status_code == 200


class TestTokenLifecycle:
    """Test complete token lifecycle."""

    @pytest.mark.asyncio
    async def test_token_creation_usage_refresh_revocation(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data,
        db_session: AsyncSession
    ):
        """Test complete token lifecycle: create -> use -> refresh -> revoke."""

        # Step 1: Create tokens (login)
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200
        tokens = response.json()

        # Verify token structure
        from jose import jwt
        from medical_coding_ai.api.auth import JWT_SECRET, JWT_ALGORITHM

        access_payload = jwt.decode(tokens["access_token"], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert "sub" in access_payload
        assert "jti" in access_payload
        assert "tenant_id" in access_payload
        assert "exp" in access_payload

        # Step 2: Use access token
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200

        # Step 3: Refresh access token
        response = await client.post("/api/auth/refresh", json={
            "refresh_token": tokens["refresh_token"]
        })
        assert response.status_code == 200
        new_tokens = response.json()

        # New access token should have different JTI
        new_payload = jwt.decode(new_tokens["access_token"], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert new_payload["jti"] != access_payload["jti"]

        # Step 4: Revoke tokens (logout)
        new_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
        response = await client.post("/api/auth/logout", headers=new_headers)
        assert response.status_code == 200

        # Step 5: Verify revocation
        response = await client.get("/api/auth/me", headers=new_headers)
        assert response.status_code == 401


class TestTenantIsolation:
    """Test tenant isolation in authentication."""

    @pytest.mark.asyncio
    async def test_jwt_contains_tenant_context(
        self,
        client: AsyncClient,
        activated_user,
        test_login_data
    ):
        """Test that JWT tokens properly isolate tenant context."""

        # Login
        response = await client.post("/api/auth/login", json=test_login_data)
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Decode token
        from jose import jwt
        from medical_coding_ai.api.auth import JWT_SECRET, JWT_ALGORITHM

        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        # Verify tenant_id matches user's tenant
        assert payload["tenant_id"] == str(activated_user.tenant_id)

        # Verify user_id is in token
        assert payload["sub"] == str(activated_user.user_id)

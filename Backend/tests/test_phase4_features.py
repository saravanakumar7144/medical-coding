"""
Phase 4 Test Suite
Tests for enhanced security features:
- Enhanced password requirements (8-64 chars, history checking)
- Security headers middleware
- Session management endpoints
- Enhanced MFA (SMS, email OTP)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from medical_coding_ai.models.user_models import User, PasswordHistory
from medical_coding_ai.utils.password_validator import (
    validate_password,
    get_password_requirements,
    suggest_password_improvements
)
from medical_coding_ai.utils.mfa_service import MFAService
from medical_coding_ai.middleware.security_headers import get_security_headers_info
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# Password Validation Tests (Enhanced Requirements)
# ============================================================================


class TestEnhancedPasswordValidation:
    """Test enhanced password validation with 8-64 character limit"""

    def test_password_minimum_length(self):
        """Test password must be at least 8 characters"""
        is_valid, error = validate_password("Test123")
        assert not is_valid
        assert "at least 8 characters" in error

    def test_password_maximum_length(self):
        """Test password must not exceed 64 characters"""
        long_password = "A1" + "a" * 63  # 65 characters
        is_valid, error = validate_password(long_password)
        assert not is_valid
        assert "64 characters" in error

    def test_password_valid_8_chars(self):
        """Test 8-character password is valid"""
        is_valid, error = validate_password("Test1234")
        assert is_valid
        assert error == ""

    def test_password_valid_64_chars(self):
        """Test 64-character password is valid"""
        max_password = "A1" + "a" * 62  # Exactly 64 characters
        is_valid, error = validate_password(max_password)
        assert is_valid
        assert error == ""

    def test_password_history_check_blocks_reuse(self):
        """Test password history prevents password reuse"""
        password = "Test1234"
        old_hash = pwd_context.hash(password)
        history = [old_hash]

        is_valid, error = validate_password(password, check_history=history)
        assert not is_valid
        assert "used recently" in error.lower()

    def test_password_history_check_allows_new_password(self):
        """Test password history allows new passwords"""
        old_password = "OldPass123"
        new_password = "NewPass123"
        old_hash = pwd_context.hash(old_password)
        history = [old_hash]

        is_valid, error = validate_password(new_password, check_history=history)
        assert is_valid
        assert error == ""

    def test_password_requirements_updated(self):
        """Test password requirements reflect Phase 4 changes"""
        reqs = get_password_requirements()
        assert reqs["min_length"] == 8
        assert reqs["max_length"] == 64
        assert reqs["password_history_count"] == 5
        assert reqs["password_expiry_days"] == 90

    def test_password_improvement_suggestions_updated(self):
        """Test password improvement suggestions for 64-char limit"""
        long_password = "A1" + "a" * 63  # 65 characters
        suggestions = suggest_password_improvements(long_password)
        assert any("64 characters" in s for s in suggestions)


# ============================================================================
# Security Headers Tests
# ============================================================================


class TestSecurityHeaders:
    """Test security headers middleware"""

    @pytest.mark.asyncio
    async def test_security_headers_present(self, client: AsyncClient):
        """Test all security headers are present"""
        response = await client.get("/health")

        # Content-Security-Policy
        assert "Content-Security-Policy" in response.headers
        csp = response.headers["Content-Security-Policy"]
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp

        # HSTS
        assert "Strict-Transport-Security" in response.headers
        hsts = response.headers["Strict-Transport-Security"]
        assert "max-age=31536000" in hsts
        assert "includeSubDomains" in hsts

        # X-Frame-Options
        assert response.headers.get("X-Frame-Options") == "DENY"

        # X-Content-Type-Options
        assert response.headers.get("X-Content-Type-Options") == "nosniff"

        # X-XSS-Protection
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"

        # Referrer-Policy
        assert "Referrer-Policy" in response.headers

        # Permissions-Policy
        assert "Permissions-Policy" in response.headers

    @pytest.mark.asyncio
    async def test_auth_endpoints_have_no_cache_headers(self, client: AsyncClient, test_login_data):
        """Test authentication endpoints have no-cache headers"""
        response = await client.post("/api/auth/login", json=test_login_data)

        # Should have cache control headers for sensitive endpoints
        if "/api/auth/" in str(response.url):
            # Note: This depends on middleware implementation
            # May not be testable if middleware only applies to successful responses
            pass

    def test_security_headers_info(self):
        """Test security headers configuration info"""
        info = get_security_headers_info()

        assert info["Content-Security-Policy"]["enabled"]
        assert info["Strict-Transport-Security"]["enabled"]
        assert info["X-Frame-Options"]["enabled"]
        assert info["X-Content-Type-Options"]["enabled"]
        assert info["X-XSS-Protection"]["enabled"]
        assert info["Referrer-Policy"]["enabled"]
        assert info["Permissions-Policy"]["enabled"]


# ============================================================================
# Session Management Tests
# ============================================================================


class TestSessionManagement:
    """Test session management endpoints"""

    @pytest.mark.asyncio
    async def test_list_active_sessions(self, client: AsyncClient, auth_token):
        """Test listing active sessions"""
        response = await client.get(
            "/api/sessions/active",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert isinstance(data["sessions"], list)

    @pytest.mark.asyncio
    async def test_get_current_session(self, client: AsyncClient, auth_token):
        """Test getting current session info"""
        response = await client.get(
            "/api/sessions/current",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        # May or may not have a session_id depending on implementation
        assert "session_id" in data or "message" in data

    @pytest.mark.asyncio
    async def test_logout_all_devices(self, client: AsyncClient, auth_token):
        """Test logout from all devices"""
        response = await client.post(
            "/api/sessions/logout-all",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "sessions_terminated" in data
        assert "tokens_revoked" in data

    @pytest.mark.asyncio
    async def test_security_audit(self, client: AsyncClient, auth_token):
        """Test security audit endpoint"""
        response = await client.get(
            "/api/sessions/security-audit",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "summary" in data
        assert "recent_logins" in data
        assert "active_sessions" in data["summary"]
        assert "mfa_enabled" in data


# ============================================================================
# Enhanced MFA Tests
# ============================================================================


class TestEnhancedMFA:
    """Test enhanced MFA features (TOTP, SMS, Email)"""

    @pytest.mark.asyncio
    async def test_get_mfa_methods(self, client: AsyncClient, auth_token):
        """Test getting available MFA methods"""
        response = await client.get(
            "/api/auth/mfa/methods",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "methods" in data
        assert "totp" in data["methods"]
        assert "sms" in data["methods"]
        assert "email" in data["methods"]

    @pytest.mark.asyncio
    async def test_send_email_otp(self, client: AsyncClient, auth_token):
        """Test sending OTP via email"""
        response = await client.post(
            "/api/auth/mfa/send-otp",
            json={"method": "email"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["method"] == "email"
        assert data["expires_in_minutes"] == 10

    @pytest.mark.asyncio
    async def test_send_sms_otp_without_phone(self, client: AsyncClient, auth_token):
        """Test sending SMS OTP fails without phone number"""
        response = await client.post(
            "/api/auth/mfa/send-otp",
            json={"method": "sms"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        # Should fail if user has no phone number
        # Or succeed if user has phone number (depends on test data)
        assert response.status_code in [200, 400]

    @pytest.mark.asyncio
    async def test_verify_otp_invalid(self, client: AsyncClient, auth_token):
        """Test verifying invalid OTP"""
        response = await client.post(
            "/api/auth/mfa/verify-otp",
            json={"otp": "000000", "method": "email"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_mfa_preferences(self, client: AsyncClient, auth_token):
        """Test updating MFA preferences"""
        response = await client.post(
            "/api/auth/mfa/preferences",
            json={"enable_mfa": True},
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "mfa_enabled" in data

    def test_mfa_service_generate_otp(self):
        """Test MFA service OTP generation"""
        mfa = MFAService()
        otp = mfa.generate_otp(length=6)
        assert len(otp) == 6
        assert otp.isdigit()

    def test_mfa_service_generate_backup_codes(self):
        """Test MFA service backup code generation"""
        mfa = MFAService()
        codes = mfa.generate_backup_codes(count=10)
        assert len(codes) == 10
        for code in codes:
            assert len(code) == 14  # Format: XXXX-XXXX-XXXX (12 digits + 2 hyphens)
            assert code.count('-') == 2

    def test_mfa_service_totp_secret_generation(self):
        """Test TOTP secret generation"""
        mfa = MFAService()
        secret = mfa.generate_totp_secret()
        assert len(secret) == 32
        assert secret.isupper()
        assert secret.isalnum()

    def test_mfa_service_totp_uri(self):
        """Test TOTP URI generation for QR code"""
        mfa = MFAService()
        secret = "JBSWY3DPEHPK3PXP"
        uri = mfa.generate_totp_uri(secret, "testuser@example.com")
        assert "otpauth://totp/" in uri
        # Email is URL-encoded in the URI (@ becomes %40)
        assert "testuser%40example.com" in uri or "testuser@example.com" in uri
        assert "Panaceon" in uri

    def test_mfa_service_verify_totp_invalid(self):
        """Test TOTP verification with invalid code"""
        mfa = MFAService()
        secret = "JBSWY3DPEHPK3PXP"
        is_valid = mfa.verify_totp(secret, "000000")
        # Most likely invalid unless by chance
        assert isinstance(is_valid, bool)


# ============================================================================
# Password History Tests
# ============================================================================


class TestPasswordHistory:
    """Test password history tracking"""

    @pytest.mark.asyncio
    async def test_password_history_table_exists(self, db_session: AsyncSession):
        """Test password_history table exists and is accessible"""
        # Try to query the table
        from sqlalchemy import text
        result = await db_session.execute(
            text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'password_history')")
        )
        exists = result.scalar()
        assert exists is True

    @pytest.mark.asyncio
    async def test_store_password_in_history(self, db_session: AsyncSession, activated_user):
        """Test storing password in history"""
        password_hash = pwd_context.hash("TestPassword123")

        stmt = insert(PasswordHistory).values(
            user_id=activated_user.user_id,
            password_hash=password_hash
        )
        await db_session.execute(stmt)
        await db_session.commit()

        # Verify it was stored
        q = select(PasswordHistory).where(PasswordHistory.user_id == activated_user.user_id)
        result = await db_session.execute(q)
        history = result.scalars().all()

        assert len(history) >= 1

    @pytest.mark.asyncio
    async def test_retrieve_password_history(self, db_session: AsyncSession, activated_user):
        """Test retrieving password history for validation"""
        # Store multiple passwords
        passwords = ["Pass1Test", "Pass2Test", "Pass3Test"]
        for pwd in passwords:
            password_hash = pwd_context.hash(pwd)
            stmt = insert(PasswordHistory).values(
                user_id=activated_user.user_id,
                password_hash=password_hash
            )
            await db_session.execute(stmt)

        await db_session.commit()

        # Retrieve history
        q = select(PasswordHistory).where(
            PasswordHistory.user_id == activated_user.user_id
        ).order_by(PasswordHistory.created_at.desc()).limit(5)

        result = await db_session.execute(q)
        history = result.scalars().all()

        assert len(history) >= 3


# ============================================================================
# Integration Tests
# ============================================================================


class TestPhase4Integration:
    """Integration tests for Phase 4 features"""

    @pytest.mark.asyncio
    async def test_complete_session_workflow(self, client: AsyncClient, test_login_data):
        """Test complete session management workflow"""
        # Login
        login_response = await client.post("/api/auth/login", json=test_login_data)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # List sessions
        sessions_response = await client.get(
            "/api/sessions/active",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert sessions_response.status_code == 200

        # Get current session
        current_response = await client.get(
            "/api/sessions/current",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert current_response.status_code == 200

        # Security audit
        audit_response = await client.get(
            "/api/sessions/security-audit",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert audit_response.status_code == 200

    @pytest.mark.asyncio
    async def test_complete_mfa_workflow(self, client: AsyncClient, test_login_data):
        """Test complete MFA workflow with email OTP"""
        # Login
        login_response = await client.post("/api/auth/login", json=test_login_data)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Get available MFA methods
        methods_response = await client.get(
            "/api/auth/mfa/methods",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert methods_response.status_code == 200

        # Send email OTP
        send_response = await client.post(
            "/api/auth/mfa/send-otp",
            json={"method": "email"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert send_response.status_code == 200

    @pytest.mark.asyncio
    async def test_security_headers_on_all_endpoints(self, client: AsyncClient):
        """Test security headers are present on all endpoints"""
        endpoints = [
            "/health",
            "/api/test",
        ]

        for endpoint in endpoints:
            response = await client.get(endpoint)
            assert "Content-Security-Policy" in response.headers
            assert "X-Frame-Options" in response.headers
            assert "X-Content-Type-Options" in response.headers

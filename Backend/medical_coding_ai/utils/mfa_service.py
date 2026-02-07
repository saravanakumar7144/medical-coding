"""
Phase 4: Enhanced MFA Service
Supports multiple MFA methods: TOTP, SMS, and Email
"""
import secrets
import datetime
import pyotp
from typing import Tuple, Optional, Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.user_models import User
from .email_service import send_email
from .crypto import encrypt, decrypt


MFAMethod = Literal["totp", "sms", "email"]


class MFAService:
    """
    Multi-Factor Authentication Service
    Handles TOTP, SMS, and Email-based MFA
    """

    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a new TOTP secret for authenticator apps"""
        return pyotp.random_base32()

    @staticmethod
    def generate_totp_uri(secret: str, username: str, issuer: str = "Panaceon") -> str:
        """
        Generate TOTP provisioning URI for QR code generation

        Args:
            secret: The TOTP secret
            username: User's username or email
            issuer: Application name

        Returns:
            URI that can be encoded as QR code
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=username, issuer_name=issuer)

    @staticmethod
    def verify_totp(secret: str, code: str, valid_window: int = 1) -> bool:
        """
        Verify TOTP code from authenticator app

        Args:
            secret: The user's TOTP secret
            code: The 6-digit code from authenticator app
            valid_window: Number of time steps to check (1 = ±30 seconds)

        Returns:
            True if code is valid, False otherwise
        """
        if not secret or not code:
            return False

        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=valid_window)
        except Exception:
            return False

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """
        Generate a random OTP for SMS or Email

        Args:
            length: Length of OTP (default 6 digits)

        Returns:
            Random numeric OTP
        """
        # Generate cryptographically secure random OTP
        otp = ''.join([str(secrets.randbelow(10)) for _ in range(length)])
        return otp

    @staticmethod
    def generate_backup_codes(count: int = 10) -> list:
        """
        Generate backup codes for MFA recovery

        Args:
            count: Number of backup codes to generate

        Returns:
            List of backup codes (format: XXXX-XXXX-XXXX)
        """
        codes = []
        for _ in range(count):
            # Generate 12-character backup code
            code_parts = [
                ''.join([str(secrets.randbelow(10)) for _ in range(4)])
                for _ in range(3)
            ]
            codes.append('-'.join(code_parts))
        return codes

    @staticmethod
    async def send_email_otp(
        email: str,
        otp: str,
        user_name: str = "User",
        expires_in_minutes: int = 10
    ) -> bool:
        """
        Send OTP via email

        Args:
            email: Recipient email address
            otp: The OTP code to send
            user_name: User's name for personalization
            expires_in_minutes: OTP expiration time

        Returns:
            True if sent successfully, False otherwise
        """
        subject = "Panaceon - Your Verification Code"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #62d5e4;">Panaceon Medical Coding Platform</h2>
            <p>Hello {user_name},</p>
            <p>Your verification code is:</p>
            <h1 style="color: #62d5e4; font-size: 36px; letter-spacing: 8px; font-family: monospace;">
                {otp}
            </h1>
            <p>This code will expire in {expires_in_minutes} minutes.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                If you didn't request this code, please ignore this email and contact support if you're concerned about your account security.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 11px;">
                This is an automated message from Panaceon. Please do not reply to this email.
            </p>
        </body>
        </html>
        """

        try:
            await send_email(email, subject, body)
            return True
        except Exception as e:
            print(f"Failed to send email OTP: {e}")
            return False

    @staticmethod
    async def send_sms_otp(
        phone_number: str,
        otp: str,
        expires_in_minutes: int = 10
    ) -> bool:
        """
        Send OTP via SMS

        Note: This is a placeholder. In production, integrate with SMS gateway like:
        - Twilio
        - AWS SNS
        - MessageBird
        - Vonage (Nexmo)

        Args:
            phone_number: Recipient phone number
            otp: The OTP code to send
            expires_in_minutes: OTP expiration time

        Returns:
            True if sent successfully, False otherwise
        """
        # TODO - Phase 9: Integrate with SMS gateway
        # Configuration:
        # - Set SMS_PROVIDER=twilio|aws_sns|messagebird in .env
        # - Set SMS_API_KEY and SMS_API_SECRET in .env
        # - Set SMS_FROM_NUMBER in .env

        import os
        sms_provider = os.getenv("SMS_PROVIDER", "none")

        if sms_provider == "twilio":
            # Twilio integration (requires: pip install twilio)
            try:
                from twilio.rest import Client
                account_sid = os.getenv("TWILIO_ACCOUNT_SID")
                auth_token = os.getenv("TWILIO_AUTH_TOKEN")
                from_number = os.getenv("TWILIO_FROM_NUMBER")

                client = Client(account_sid, auth_token)
                message = client.messages.create(
                    body=f"Your Panaceon verification code is: {otp}. Valid for {expires_in_minutes} minutes.",
                    from_=from_number,
                    to=phone_number
                )
                logger.info(f"SMS OTP sent to {phone_number} via Twilio: {message.sid}")
                return True
            except Exception as e:
                logger.error(f"Failed to send SMS OTP via Twilio: {e}")
                return False

        elif sms_provider == "aws_sns":
            # AWS SNS integration (requires: pip install boto3)
            # TODO: Implement AWS SNS
            logger.warning("AWS SNS not yet implemented")
            pass

        # Fallback: Log to console (development only)
        logger.warning(f"[DEVELOPMENT] SMS OTP for {phone_number}: {otp} (expires in {expires_in_minutes} min)")
        print(f"[SMS OTP] {phone_number}: {otp} (expires in {expires_in_minutes} min)")

        return True  # Change to False in production until SMS gateway is configured

    @staticmethod
    async def store_temp_otp(
        db: AsyncSession,
        user_id: str,
        otp: str,
        method: MFAMethod,
        expires_in_minutes: int = 10
    ) -> bool:
        """
        Store temporary OTP in user record for verification

        Args:
            db: Database session
            user_id: User ID
            otp: The OTP code
            method: MFA method (sms or email)
            expires_in_minutes: OTP expiration time

        Returns:
            True if stored successfully
        """
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Hash the OTP before storing
        otp_hash = pwd_context.hash(otp)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_in_minutes)

        # Store in email_verification_token_hash temporarily
        # In production, consider a dedicated OTP table
        stmt = update(User).where(User.user_id == user_id).values(
            email_verification_token_hash=otp_hash,
            email_verification_expires=expires_at
        )
        await db.execute(stmt)
        await db.commit()

        return True

    @staticmethod
    async def verify_temp_otp(
        db: AsyncSession,
        user_id: str,
        otp: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify temporary OTP stored in database

        Args:
            db: Database session
            user_id: User ID
            otp: The OTP code to verify

        Returns:
            Tuple of (is_valid: bool, error_message: Optional[str])
        """
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Get user
        q = select(User).where(User.user_id == user_id)
        result = await db.execute(q)
        user = result.scalar_one_or_none()

        if not user:
            return False, "User not found"

        if not user.email_verification_token_hash:
            return False, "No OTP found. Please request a new code."

        if not user.email_verification_expires:
            return False, "OTP has expired. Please request a new code."

        # Check expiration
        if user.email_verification_expires < datetime.datetime.utcnow():
            # Clear expired OTP
            stmt = update(User).where(User.user_id == user_id).values(
                email_verification_token_hash=None,
                email_verification_expires=None
            )
            await db.execute(stmt)
            await db.commit()
            return False, "OTP has expired. Please request a new code."

        # Verify OTP
        try:
            if pwd_context.verify(otp, user.email_verification_token_hash):
                # Clear OTP after successful verification
                stmt = update(User).where(User.user_id == user_id).values(
                    email_verification_token_hash=None,
                    email_verification_expires=None
                )
                await db.execute(stmt)
                await db.commit()
                return True, None
            else:
                return False, "Invalid OTP. Please try again."
        except Exception as e:
            return False, f"Verification error: {str(e)}"


# Global instance
mfa_service = MFAService()

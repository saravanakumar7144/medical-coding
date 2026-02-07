from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from ..utils.db import get_db
from ..models.user_models import User, PasswordReset, RefreshToken
from ..models.security_models import LoginAttempt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from jose import jwt
import os
import datetime
import secrets
import pyotp
import bcrypt
import hashlib
import hmac
from sqlalchemy import select, insert, update
from typing import Optional
from ..utils.crypto import encrypt, decrypt, deterministic_hash
from ..utils.password_validator import validate_password
from ..utils.email_service import send_activation_email, send_password_reset_email
from slowapi import Limiter
from slowapi.util import get_remote_address


router = APIRouter()

# Initialize rate limiter for authentication endpoints
limiter = Limiter(key_func=get_remote_address)

# Use bcrypt to match seed_data.py hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt directly (bypasses passlib compatibility issues).
    """
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password using direct bcrypt (bypasses passlib compatibility issues).
    """
    try:
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception:
        return False


def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256 (for refresh tokens, activation tokens, reset tokens).
    Tokens can be longer than bcrypt's 72-byte limit, so we use SHA-256.
    """
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def verify_token(plain_token: str, hashed_token: str) -> bool:
    """
    Verify a token by comparing SHA-256 hashes using constant-time comparison.
    """
    return hmac.compare_digest(hash_token(plain_token), hashed_token)



async def log_login_attempt(
    db: AsyncSession,
    username: str,
    success: bool,
    request: Request,
    user: Optional[User] = None,
    failure_reason: Optional[str] = None,
    mfa_required: bool = False,
    mfa_success: Optional[bool] = None,
    mfa_method: Optional[str] = None
):
    """
    Log login attempt to security monitoring database.
    IP addresses are stored unencrypted for security auditing purposes.
    """
    try:
        # Get client IP - stored unencrypted for security monitoring
        client_ip = request.client.host if request.client else 'unknown'

        # Get user agent
        user_agent = request.headers.get('user-agent', '')

        # Create login attempt record
        stmt = insert(LoginAttempt).values(
            tenant_id=user.tenant_id if user else None,
            user_id=user.user_id if user else None,
            username=username,
            success=success,
            failure_reason=failure_reason,
            ip_address=client_ip,
            user_agent=user_agent,
            mfa_required=mfa_required,
            mfa_success=mfa_success,
            mfa_method=mfa_method,
            attempted_at=datetime.datetime.utcnow()
        )
        await db.execute(stmt)
        await db.commit()
    except Exception as e:
        # Don't fail login if logging fails
        print(f'Failed to log login attempt: {e}')

# ============================================================================
# JWT CONFIGURATION (CRITICAL SECURITY)
# ============================================================================
# JWT is used for authentication tokens - if compromised, attackers can forge tokens
# ============================================================================

JWT_SECRET = os.getenv('JWT_SECRET_KEY')

# Startup validation - fail fast if JWT secret is missing or insecure
if not JWT_SECRET:
    import sys
    error_msg = (
        "\n" + "=" * 80 + "\n"
        "❌ CRITICAL ERROR: JWT_SECRET_KEY environment variable is not set!\n"
        "\n"
        "The application cannot start without a JWT secret.\n"
        "This secret is used to sign authentication tokens.\n"
        "\n"
        "To generate a secure JWT secret, run:\n"
        "  python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
        "\n"
        "Then set the environment variable:\n"
        "  - Linux/Mac: export JWT_SECRET_KEY='your_generated_secret'\n"
        "  - Windows: set JWT_SECRET_KEY=your_generated_secret\n"
        "  - Or add to .env file: JWT_SECRET_KEY=your_generated_secret\n"
        "\n"
        "⚠️  IMPORTANT: Keep this secret secure! If compromised, attackers can forge tokens.\n"
        "=" * 80
    )
    print(error_msg, file=sys.stderr)
    sys.exit(1)

if len(JWT_SECRET) < 32:
    import sys
    error_msg = (
        "\n" + "=" * 80 + "\n"
        f"❌ CRITICAL ERROR: JWT_SECRET_KEY is too short ({len(JWT_SECRET)} chars)\n"
        "\n"
        "JWT secret must be at least 32 characters for HS256 algorithm.\n"
        "\n"
        "Generate a new secret:\n"
        "  python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
        "=" * 80
    )
    print(error_msg, file=sys.stderr)
    sys.exit(1)

JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour (clarified from misleading 24-hour constant)


class UserCreate(BaseModel):
    tenant_id: str
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    dob: Optional[datetime.date] = None
    ssn: Optional[str] = None
    employee_id: Optional[str] = None
    role: str = 'coder'
    timezone: str = 'UTC'
    language: str = 'en'
    hipaa_training_completed: bool = False
    hipaa_training_date: Optional[datetime.date] = None
    privacy_policy_accepted: bool = False
    mfa_enabled: bool = False


class SignInRequest(BaseModel):
    tenant_id: Optional[str] = None
    username: str  # Can be username OR email
    password: str
    otp: Optional[str] = None


class ActivateAccountRequest(BaseModel):
    token: str
    user_id: str
    new_password: Optional[str] = None  # Optional: Allow user to set password during activation


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    user_id: str
    new_password: str


class LegalAcceptanceRequest(BaseModel):
    terms_accepted: bool
    privacy_policy_accepted: bool
    terms_version: str = "1.0"
    privacy_policy_version: str = "1.0"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = 'bearer'
    expires_in: Optional[int] = 3600  # Token expiry in seconds (default 1 hour)


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    """
    Create JWT access token with JTI for revocation support

    Args:
        data: Token payload (must include 'sub' for user_id)
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    import uuid

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.datetime.utcnow(),  # Issued at
        "jti": str(uuid.uuid4()),  # JWT ID for token revocation
        "type": "access"  # Token type
    })

    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


from .deps import get_current_user, require_admin, oauth2_scheme


@router.post('/users', status_code=201)
@limiter.limit("10/hour")
async def create_user(
    request: Request,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Create a new user (admin only)
    Sends activation email with 48-hour token
    """
    # Validate password policy (8-12 alphanumeric)
    is_valid, error_msg = validate_password(payload.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Check if username exists
    q = select(User).where(User.username == payload.username)
    res = await db.execute(q)
    user = res.scalar_one_or_none()
    if user:
        raise HTTPException(status_code=400, detail='Username already exists')

    # Check if email already exists (using deterministic hash)
    email_hash = deterministic_hash(payload.email)
    q = select(User).where(User.dec_hash == email_hash, User.tenant_id == payload.tenant_id)
    res = await db.execute(q)
    existing_email = res.scalar_one_or_none()
    if existing_email:
        raise HTTPException(status_code=400, detail='Email already registered. Please use a different email address.')

    # Generate activation token (48 hours)
    activation_token = secrets.token_urlsafe(32)
    activation_token_hash = hash_token(activation_token)
    activation_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=48)

    # Hash password
    hashed = hash_password(payload.password)

    # Encrypt sensitive fields
    email_encrypted = encrypt(payload.email)
    dec_hash = deterministic_hash(payload.email)
    first_name_encrypted = encrypt(payload.first_name)
    last_name_encrypted = encrypt(payload.last_name)

    # Optional fields
    phone_encrypted = encrypt(payload.phone) if payload.phone else None
    dob_encrypted = encrypt(str(payload.dob)) if payload.dob else None
    ssn_encrypted = encrypt(payload.ssn) if payload.ssn else None

    stmt = insert(User).values(
        tenant_id=payload.tenant_id,
        username=payload.username,
        email_encrypted=email_encrypted,
        dec_hash=dec_hash,
        password_hash=hashed,
        first_name_encrypted=first_name_encrypted,
        last_name_encrypted=last_name_encrypted,
        phone_encrypted=phone_encrypted,
        dob_encrypted=dob_encrypted,
        ssn_encrypted=ssn_encrypted,
        employee_id=payload.employee_id,
        role=payload.role,
        mfa_enabled=payload.mfa_enabled,
        is_active=False,  # User inactive until email verified
        email_verification_token_hash=activation_token_hash,
        email_verification_expires=activation_expires
    ).returning(User.user_id)

    result = await db.execute(stmt)
    await db.commit()
    new_id = result.scalar_one()

    # Send activation email
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    activation_link = f"{frontend_url}/activate?token={activation_token}&user_id={new_id}"

    try:
        await send_activation_email(
            to_email=payload.email,
            username=payload.username,
            activation_link=activation_link
        )
    except Exception as e:
        # Log error but don't fail user creation
        print(f"Failed to send activation email: {e}")

    return {
        "user_id": str(new_id),
        "username": payload.username,
        "message": "User created. Activation email sent."
    }


@router.post('/activate-account')
@limiter.limit("10/hour")
async def activate_account(request: Request, payload: ActivateAccountRequest, db: AsyncSession = Depends(get_db)):
    """
    Activate user account with 48-hour token
    """
    token = payload.token
    user_id = payload.user_id
    
    # Get user
    q = select(User).where(User.user_id == user_id)
    res = await db.execute(q)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    # Check if already activated
    if user.email_verified:
        return {"activated": True, "message": "Account already activated"}

    # Verify token hash matches
    if not user.email_verification_token_hash:
        raise HTTPException(status_code=400, detail='No activation token found')

    if not verify_token(token, user.email_verification_token_hash):
        raise HTTPException(status_code=400, detail='Invalid activation token')

    # Check if token has expired (48 hours)
    if user.email_verification_expires and user.email_verification_expires < datetime.datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail='Activation token has expired. Please contact your administrator to request a new activation link.'
        )

    # If new password provided, validate and set it
    update_values = {
        "is_active": True,
        "email_verified": True,
        "email_verified_at": datetime.datetime.utcnow(),
        "email_verification_token_hash": None,  # Clear token after use
        "email_verification_expires": None  # Clear expiry after use
    }

    if payload.new_password:
        # Validate password
        from ..utils.password_validator import validate_password
        is_valid, error_message = validate_password(payload.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)

        # Hash password
        password_hash = hash_password(payload.new_password)
        update_values["password_hash"] = password_hash
        update_values["password_changed_at"] = datetime.datetime.utcnow()

        # Set password expiry (90 days from now)
        update_values["password_expires_at"] = datetime.datetime.utcnow() + datetime.timedelta(days=90)

        # Store in password history
        from ..models.user_models import PasswordHistory
        history_stmt = insert(PasswordHistory).values(
            user_id=user_id,
            password_hash=password_hash
        )
        await db.execute(history_stmt)

    # Activate account
    stmt = update(User).where(User.user_id == user_id).values(**update_values)
    await db.execute(stmt)
    await db.commit()

    message = "Account activated successfully. You can now sign in."
    if payload.new_password:
        message = "Account activated and password set successfully. You can now sign in."

    return {
        "activated": True,
        "message": message
    }


@router.post('/signin', response_model=TokenResponse)
@limiter.limit("5/minute")
async def signin(request: Request, payload: SignInRequest, db: AsyncSession = Depends(get_db)):
    """
    Sign in with username or email.
    All users must be in the database.
    """
    # Try to find user by username first
    q = select(User).where(User.username == payload.username)
    res = await db.execute(q)
    user = res.scalar_one_or_none()

    # If not found by username, try to find by email (using deterministic hash)
    if not user:
        # Check if input looks like an email (contains @)
        if '@' in payload.username:
            email_hash = deterministic_hash(payload.username)
            q = select(User).where(User.dec_hash == email_hash)
            res = await db.execute(q)
            user = res.scalar_one_or_none()

    if not user:
        await log_login_attempt(db, payload.username, False, request, failure_reason='User not found')
        raise HTTPException(status_code=400, detail='Invalid credentials')

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.datetime.utcnow():
        time_remaining = (user.locked_until - datetime.datetime.utcnow()).seconds // 60
        raise HTTPException(
            status_code=403,
            detail=f'Account is locked due to too many failed login attempts. Please try again in {time_remaining} minutes.'
        )

    # Verify password
    if not verify_password(payload.password, user.password_hash):
        # Increment failed login attempts
        new_failed_attempts = (user.failed_login_attempts or 0) + 1

        # Lock account if 5 or more failed attempts
        if new_failed_attempts >= 5:
            locked_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
            stmt = update(User).where(User.user_id == user.user_id).values(
                failed_login_attempts=new_failed_attempts,
                locked_until=locked_until
            )
            await db.execute(stmt)
            await db.commit()

            await log_login_attempt(db, payload.username, False, request, user, 'Account locked due to too many failed attempts')

            raise HTTPException(
                status_code=403,
                detail='Account locked due to too many failed login attempts. Please try again in 30 minutes.'
            )
        else:
            # Update failed attempts count
            stmt = update(User).where(User.user_id == user.user_id).values(
                failed_login_attempts=new_failed_attempts
            )
            await db.execute(stmt)
            await db.commit()

            await log_login_attempt(db, payload.username, False, request, user, f'Invalid password ({5 - new_failed_attempts} attempts remaining)')

            raise HTTPException(
                status_code=400,
                detail=f'Invalid credentials. {5 - new_failed_attempts} attempts remaining.'
            )

    # Check if account is activated
    if not user.is_active or not user.email_verified:
        await log_login_attempt(db, payload.username, False, request, user, 'Account not activated')
        raise HTTPException(
            status_code=403,
            detail='Account not activated. Please check your email for activation link.'
        )

    # If user has MFA enabled, verify OTP
    if user.mfa_enabled:
        if not payload.otp:
            await log_login_attempt(db, payload.username, False, request, user, 'MFA required but not provided', mfa_required=True)
            raise HTTPException(status_code=403, detail='MFA required')
        # verify TOTP
        totp = pyotp.TOTP(user.mfa_secret) if user.mfa_secret else None
        if not totp or not totp.verify(payload.otp, valid_window=1):
            await log_login_attempt(db, payload.username, False, request, user, 'Invalid MFA OTP', mfa_required=True, mfa_success=False, mfa_method='TOTP')
            raise HTTPException(status_code=403, detail='Invalid OTP')

    # Log successful login attempt
    mfa_used = user.mfa_enabled
    await log_login_attempt(
        db, 
        payload.username, 
        True, 
        request, 
        user, 
        mfa_required=mfa_used,
        mfa_success=mfa_used,
        mfa_method='TOTP' if mfa_used else None
    )

    # Reset failed login attempts and locked status on successful login
    if user.failed_login_attempts > 0 or user.locked_until:
        stmt = update(User).where(User.user_id == user.user_id).values(
            failed_login_attempts=0,
            locked_until=None,
            last_login_at=datetime.datetime.utcnow()
        )
        await db.execute(stmt)
        await db.commit()

    # Generate access token (1 hour) and refresh token (7 days)
    access_token = create_access_token(
        {"sub": str(user.user_id), "role": user.role, "tenant_id": str(user.tenant_id)},
        expires_delta=datetime.timedelta(hours=1)
    )

    # Generate and store refresh token
    refresh_token_raw = secrets.token_urlsafe(32)
    refresh_token_hash = hash_token(refresh_token_raw)
    refresh_expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)

    # Store refresh token in database
    stmt = insert(RefreshToken).values(
        user_id=user.user_id,
        token_hash=refresh_token_hash,
        expires_at=refresh_expires
    )
    await db.execute(stmt)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_raw,
        "token_type": "bearer",
        "expires_in": 3600  # 1 hour in seconds
    }


@router.post('/refresh', response_model=TokenResponse)
async def refresh_access_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    Validates refresh token, checks expiry, and generates new access token.

    Args:
        refresh_token: The refresh token from the initial login
        db: Database session

    Returns:
        New access token (refresh token remains the same)

    Raises:
        HTTPException: If token is invalid, expired, or revoked
    """
    # Find all refresh tokens and check which one matches (brute force verification)
    q = select(RefreshToken).where(
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.datetime.utcnow()
    )
    result = await db.execute(q)
    refresh_tokens = result.scalars().all()

    matching_token = None
    for rt in refresh_tokens:
        try:
            if verify_token(refresh_token, rt.token_hash):
                matching_token = rt
                break
        except Exception:
            continue

    if not matching_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token. Please log in again."
        )

    # Get user from database
    q = select(User).where(User.user_id == matching_token.user_id)
    result = await db.execute(q)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User account is inactive or deleted."
        )

    # Generate new access token
    access_token = create_access_token(
        {"sub": str(user.user_id), "role": user.role, "tenant_id": str(user.tenant_id)},
        expires_delta=datetime.timedelta(hours=1)
    )

    # Update last_used_at timestamp
    stmt = update(RefreshToken).where(RefreshToken.id == matching_token.id).values(
        last_used_at=datetime.datetime.utcnow()
    )
    await db.execute(stmt)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  # Return same refresh token
        "token_type": "bearer",
        "expires_in": 3600  # 1 hour in seconds
    }


@router.post('/mfa/setup')
async def mfa_setup(request: Request, db: AsyncSession = Depends(get_db)):
    # Expect a JSON body with username
    body = await request.json()
    username = body.get('username')
    if not username:
        raise HTTPException(status_code=400, detail='username required')

    q = select(User).where(User.username == username)
    res = await db.execute(q)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    # Generate secret
    secret = pyotp.random_base32()
    backup_codes = [secrets.token_urlsafe(8) for _ in range(5)]

    stmt = update(User).where(User.user_id == user.user_id).values(
        mfa_secret=secret,
        mfa_backup_codes=backup_codes
    )
    await db.execute(stmt)
    await db.commit()

    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.username, issuer_name="MedicalCodingAI")

    return {
        "otpauth_uri": uri,
        "secret": secret,
        "backup_codes": backup_codes
    }


@router.post('/mfa/verify')
async def mfa_verify(username: str, otp: str, db: AsyncSession = Depends(get_db)):
    q = select(User).where(User.username == username)
    res = await db.execute(q)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    totp = pyotp.TOTP(user.mfa_secret) if user.mfa_secret else None
    if not totp or not totp.verify(otp, valid_window=1):
        raise HTTPException(status_code=400, detail='Invalid OTP')

    return {"verified": True}


@router.post('/forgot-password')
@limiter.limit("3/hour")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Request password reset with 4-hour token
    Always returns success to prevent email enumeration
    """
    email = payload.email
    
    # Find user by email (need to decrypt email to compare)
    # For now, using deterministic hash for lookup
    dec_hash = deterministic_hash(email)
    q = select(User).where(User.dec_hash == dec_hash)
    res = await db.execute(q)
    user = res.scalar_one_or_none()

    if user:
        # Generate reset token (4 hours)
        token = secrets.token_urlsafe(32)
        token_hash = hash_token(token)
        expires = datetime.datetime.utcnow() + datetime.timedelta(hours=4)

        stmt = insert(PasswordReset).values(
            user_id=user.user_id,
            token_hash=token_hash,
            expires_at=expires
        )
        await db.execute(stmt)
        await db.commit()

        # Build reset link
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={token}&user_id={user.user_id}"

        # Send password reset email
        try:
            email_decrypted = decrypt(user.email_encrypted)
            await send_password_reset_email(
                to_email=email_decrypted,
                username=user.username,
                reset_link=reset_link
            )
        except Exception as e:
            print(f"Failed to send password reset email: {e}")

    # Always return success (security: don't reveal if email exists)
    return {"sent": True, "message": "If an account exists with that email, a password reset link has been sent."}


@router.post('/reset-password')
@limiter.limit("3/hour")
async def reset_password(request: Request, payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Reset password with valid token
    Validates new password meets policy requirements
    """
    token = payload.token
    user_id = payload.user_id
    new_password = payload.new_password
    
    # Validate new password policy
    is_valid, error_msg = validate_password(new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Find all unused password reset tokens for this user
    q = select(PasswordReset).where(
        PasswordReset.user_id == user_id,
        PasswordReset.used == False
    )
    res = await db.execute(q)
    password_resets = res.scalars().all()

    # Find matching token by verifying hash
    matching_reset = None
    for pr in password_resets:
        if verify_token(token, pr.token_hash):
            matching_reset = pr
            break

    if not matching_reset:
        raise HTTPException(status_code=400, detail='Invalid or expired reset token')

    # Check token expiration
    if matching_reset.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail='Reset token has expired')

    # Update password
    hashed = hash_password(new_password)
    stmt = update(User).where(User.user_id == user_id).values(
        password_hash=hashed,
        password_changed_at=datetime.datetime.utcnow()
    )
    await db.execute(stmt)

    # Mark token as used
    stmt2 = update(PasswordReset).where(PasswordReset.id == matching_reset.id).values(used=True)
    await db.execute(stmt2)
    await db.commit()

    return {"reset": True, "message": "Password reset successfully. You can now sign in with your new password."}




@router.get('/me')
async def get_me(user = Depends(get_current_user)):
    # Check if this is a demo user (DemoUser class from deps.py)
    if hasattr(user, 'email') and user.user_id.startswith('demo-'):
        # Demo user - fields are not encrypted
        first_name = user.first_name_encrypted or ""
        last_name = user.last_name_encrypted or ""
        name = f"{first_name} {last_name}".strip()
        return {
            "id": str(user.user_id),
            "email": user.email,
            "name": name if name else user.email,  # Fallback to email if no name
            "roles": [user.role],
            "activeRole": user.role,
            "organizationId": str(user.tenant_id),
            "mfaEnabled": user.mfa_enabled,
            "termsAccepted": user.terms_accepted or False,
            "privacyPolicyAccepted": user.privacy_policy_accepted or False,
            "termsVersion": user.terms_version,
            "privacyPolicyVersion": user.privacy_policy_version
        }

    # Real user - decrypt fields with proper null handling
    first_name = decrypt(user.first_name_encrypted) or ""
    last_name = decrypt(user.last_name_encrypted) or ""
    name = f"{first_name} {last_name}".strip()

    return {
        "id": str(user.user_id),
        "email": user.username,
        "name": name if name else user.username,  # Fallback to username/email if no name
        "roles": [user.role],
        "activeRole": user.role,
        "organizationId": str(user.tenant_id),
        "mfaEnabled": user.mfa_enabled,
        "termsAccepted": user.terms_accepted or False,
        "privacyPolicyAccepted": user.privacy_policy_accepted or False,
        "termsVersion": user.terms_version,
        "privacyPolicyVersion": user.privacy_policy_version
    }


@router.post('/accept-legal')
async def accept_legal(
    payload: LegalAcceptanceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept Terms & Conditions and Privacy Policy

    Required for dashboard access after login
    Tracks version and timestamp of acceptance
    """
    # Validate that both are accepted
    if not payload.terms_accepted or not payload.privacy_policy_accepted:
        raise HTTPException(
            status_code=400,
            detail='Both Terms & Conditions and Privacy Policy must be accepted'
        )

    # Update user record
    now = datetime.datetime.utcnow()
    stmt = update(User).where(User.user_id == user.user_id).values(
        terms_accepted=True,
        terms_accepted_at=now,
        terms_version=payload.terms_version,
        privacy_policy_accepted=True,
        privacy_policy_accepted_at=now,
        privacy_policy_version=payload.privacy_policy_version
    )

    await db.execute(stmt)
    await db.commit()

    return {
        "accepted": True,
        "message": "Terms & Conditions and Privacy Policy accepted successfully",
        "terms_version": payload.terms_version,
        "privacy_policy_version": payload.privacy_policy_version,
        "accepted_at": now.isoformat()
    }


@router.post('/logout')
async def logout(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current user by blacklisting their access token.
    
    This prevents the token from being used again, even if it hasn't expired yet.
    The token will remain blacklisted until its natural expiry time.
    
    Args:
        current_user: Current authenticated user (from token)
        token: JWT token to blacklist
        db: Database session
    
    Returns:
        Success message
    
    Raises:
        HTTPException: If logout fails
    """
    from ..utils.redis_client import blacklist_token
    
    try:
        # Decode token to get JTI and expiry
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        if not jti:
            raise HTTPException(
                status_code=400,
                detail="Token does not have a JWT ID. Cannot blacklist."
            )
        
        # Add token to blacklist
        blacklisted = await blacklist_token(jti, exp)
        
        if not blacklisted:
            # Log warning but don't fail - user is still effectively logged out on client side
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to blacklist token for user {current_user.user_id}")
        
        return {
            "success": True,
            "message": "Logged out successfully"
        }
    
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Logout error for user {current_user.user_id}: {e}")
        
        # Return success anyway - client-side logout is sufficient
        # Server-side blacklist is best-effort
        return {
            "success": True,
            "message": "Logged out successfully (client-side)"
        }


# ============================================================================
# PHASE 4: ENHANCED MFA ENDPOINTS
# ============================================================================


class SendOTPRequest(BaseModel):
    method: str  # "sms" or "email"


class VerifyOTPRequest(BaseModel):
    otp: str
    method: str  # "sms" or "email"


@router.post('/mfa/send-otp')
async def send_mfa_otp(
    payload: SendOTPRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Phase 4: Send OTP via SMS or Email
    """
    from ..utils.mfa_service import mfa_service

    if payload.method not in ["sms", "email"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid method. Must be 'sms' or 'email'"
        )

    # Generate OTP
    otp = mfa_service.generate_otp(length=6)

    # Store OTP in database
    await mfa_service.store_temp_otp(
        db=db,
        user_id=str(user.user_id),
        otp=otp,
        method=payload.method,
        expires_in_minutes=10
    )

    # Send OTP based on method
    if payload.method == "sms":
        if not user.phone_encrypted:
            raise HTTPException(
                status_code=400,
                detail="No phone number on file. Please add a phone number first."
            )

        phone = decrypt(user.phone_encrypted)
        success = await mfa_service.send_sms_otp(phone, otp, expires_in_minutes=10)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send SMS. Please try again or use another method."
            )

        return {
            "success": True,
            "message": f"Verification code sent to {phone[-4:].rjust(len(phone), '*')}",
            "method": "sms",
            "expires_in_minutes": 10
        }

    elif payload.method == "email":
        email = decrypt(user.email_encrypted)
        user_name = f"{decrypt(user.first_name_encrypted)} {decrypt(user.last_name_encrypted)}"

        success = await mfa_service.send_email_otp(
            email=email,
            otp=otp,
            user_name=user_name,
            expires_in_minutes=10
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Please try again or use another method."
            )

        # Mask email for security
        email_parts = email.split('@')
        masked_email = f"{email_parts[0][:2]}***@{email_parts[1]}"

        return {
            "success": True,
            "message": f"Verification code sent to {masked_email}",
            "method": "email",
            "expires_in_minutes": 10
        }


@router.post('/mfa/verify-otp')
async def verify_mfa_otp(
    payload: VerifyOTPRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Phase 4: Verify OTP sent via SMS or Email
    """
    from ..utils.mfa_service import mfa_service

    # Verify OTP
    is_valid, error_message = await mfa_service.verify_temp_otp(
        db=db,
        user_id=str(user.user_id),
        otp=payload.otp
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_message or "Invalid OTP"
        )

    return {
        "success": True,
        "message": "OTP verified successfully",
        "method": payload.method
    }


@router.get('/mfa/methods')
async def get_mfa_methods(user: User = Depends(get_current_user)):
    """
    Phase 4: Get available MFA methods for user
    """
    methods = {
        "totp": {
            "enabled": user.mfa_enabled and user.mfa_secret_encrypted is not None,
            "name": "Authenticator App",
            "description": "Use Google Authenticator, Authy, or similar app"
        },
        "sms": {
            "enabled": user.phone_encrypted is not None,
            "name": "SMS",
            "description": "Receive code via text message",
            "available": user.phone_encrypted is not None
        },
        "email": {
            "enabled": True,  # Always available
            "name": "Email",
            "description": "Receive code via email",
            "available": True
        }
    }

    return {
        "methods": methods,
        "primary_method": "totp" if user.mfa_enabled else None
    }


class UpdateMFAPreferencesRequest(BaseModel):
    primary_method: Optional[str] = None  # "totp", "sms", or "email"
    enable_mfa: Optional[bool] = None


@router.post('/mfa/preferences')
async def update_mfa_preferences(
    payload: UpdateMFAPreferencesRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Phase 4: Update MFA preferences
    """
    updates = {}

    if payload.enable_mfa is not None:
        updates['mfa_enabled'] = payload.enable_mfa

    if updates:
        stmt = update(User).where(User.user_id == user.user_id).values(**updates)
        await db.execute(stmt)
        await db.commit()

    return {
        "success": True,
        "message": "MFA preferences updated successfully",
        "mfa_enabled": payload.enable_mfa if payload.enable_mfa is not None else user.mfa_enabled
    }

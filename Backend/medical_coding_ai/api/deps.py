from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import os
from ..utils.db import get_db
from ..models.user_models import User
from ..utils.redis_client import is_token_blacklisted

# Import JWT_SECRET from auth.py to ensure consistency
# Note: JWT_SECRET is validated at startup in auth.py
from .auth import JWT_SECRET, JWT_ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/signin")


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """
    Get current authenticated user from JWT token.
    Validates token and checks if it's blacklisted (logged out).

    Args:
        token: JWT token from Authorization header
        db: Database session

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: If token is invalid, expired, blacklisted, or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode and validate JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")  # JWT ID for blacklist check
        token_type: str = payload.get("type")
        tenant_id: str = payload.get("tenant_id")  # Tenant ID for validation

        if user_id is None:
            raise credentials_exception

        # Validate token type
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if token is blacklisted (user logged out)
        if jti and await is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except JWTError:
        raise credentials_exception

    # Get user from database
    q = select(User).where(User.user_id == user_id)
    result = await db.execute(q)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    # Validate tenant_id matches (prevent token tampering)
    if tenant_id and str(user.tenant_id) != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tenant mismatch. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_admin(current_user: User = Depends(get_current_user)):
    """
    Dependency that requires the current user to have admin role

    Args:
        current_user: Current authenticated user

    Returns:
        User: The admin user

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Only administrators can perform this action."
        )
    return current_user

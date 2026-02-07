"""
Phase 4: Session Management API
Provides endpoints for managing active user sessions
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel
from typing import List, Optional
import datetime
from ..models.session_models import UserSession
from ..models.user_models import User, RefreshToken
from ..utils.db import get_db
from ..utils.crypto import encrypt, decrypt
from .deps import get_current_user


router = APIRouter()


class SessionInfo(BaseModel):
    """Session information response model"""
    session_id: str
    device_info: dict
    ip_address: str
    created_at: str
    last_activity_at: str
    is_current: bool
    is_active: bool


class SessionListResponse(BaseModel):
    """List of active sessions response"""
    sessions: List[SessionInfo]
    total: int


@router.get('/active', response_model=SessionListResponse)
async def list_active_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all active sessions for the current user
    Shows device info, IP address, and last activity for each session
    """
    # Get all active sessions for user
    q = select(UserSession).where(
        UserSession.user_id == user.user_id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.datetime.utcnow()
    ).order_by(UserSession.last_activity_at.desc())

    result = await db.execute(q)
    sessions = result.scalars().all()

    # Get current request IP for comparison
    client_ip = request.client.host if request.client else "unknown"

    session_list = []
    for session in sessions:
        # Decrypt IP address for display
        try:
            ip_address = decrypt(session.ip_address_encrypted)
        except Exception:
            ip_address = "encrypted"

        # Determine if this is the current session
        is_current = (ip_address == client_ip and
                     session.last_activity_at and
                     (datetime.datetime.utcnow() - session.last_activity_at).seconds < 300)

        session_list.append(SessionInfo(
            session_id=str(session.session_id),
            device_info=session.device_info or {},
            ip_address=ip_address,
            created_at=session.created_at.isoformat() if session.created_at else "",
            last_activity_at=session.last_activity_at.isoformat() if session.last_activity_at else "",
            is_current=is_current,
            is_active=session.is_active
        ))

    return SessionListResponse(
        sessions=session_list,
        total=len(session_list)
    )


@router.post('/logout-all')
async def logout_all_devices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout from all devices by:
    1. Terminating all active user sessions
    2. Revoking all refresh tokens

    User will need to login again on all devices
    """
    # Terminate all user sessions
    stmt = update(UserSession).where(
        UserSession.user_id == user.user_id,
        UserSession.is_active == True
    ).values(
        is_active=False,
        terminated_at=datetime.datetime.utcnow(),
        termination_reason='User requested logout from all devices'
    )
    sessions_result = await db.execute(stmt)
    terminated_sessions = sessions_result.rowcount

    # Revoke all refresh tokens
    stmt = update(RefreshToken).where(
        RefreshToken.user_id == user.user_id,
        RefreshToken.revoked == False
    ).values(
        revoked=True
    )
    tokens_result = await db.execute(stmt)
    revoked_tokens = tokens_result.rowcount

    await db.commit()

    return {
        "success": True,
        "message": "Logged out from all devices successfully",
        "sessions_terminated": terminated_sessions,
        "tokens_revoked": revoked_tokens
    }


@router.delete('/{session_id}')
async def terminate_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Terminate a specific session
    User must own the session being terminated
    """
    # Find the session
    q = select(UserSession).where(
        UserSession.session_id == session_id,
        UserSession.user_id == user.user_id
    )
    result = await db.execute(q)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found or does not belong to you"
        )

    if not session.is_active:
        return {
            "success": True,
            "message": "Session already terminated"
        }

    # Terminate the session
    stmt = update(UserSession).where(
        UserSession.session_id == session_id
    ).values(
        is_active=False,
        terminated_at=datetime.datetime.utcnow(),
        termination_reason='User requested session termination'
    )
    await db.execute(stmt)

    # Revoke associated refresh token if exists
    if session.refresh_token_hash:
        stmt = update(RefreshToken).where(
            RefreshToken.token_hash == session.refresh_token_hash
        ).values(
            revoked=True
        )
        await db.execute(stmt)

    await db.commit()

    return {
        "success": True,
        "message": "Session terminated successfully",
        "session_id": session_id
    }


@router.get('/current')
async def get_current_session(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get information about the current session
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # Find current session by recent activity and IP
    q = select(UserSession).where(
        UserSession.user_id == user.user_id,
        UserSession.is_active == True
    ).order_by(UserSession.last_activity_at.desc()).limit(10)

    result = await db.execute(q)
    sessions = result.scalars().all()

    # Try to find matching session
    current_session = None
    for session in sessions:
        try:
            session_ip = decrypt(session.ip_address_encrypted)
            if session_ip == client_ip:
                # Check if last activity was within 5 minutes
                if (datetime.datetime.utcnow() - session.last_activity_at).seconds < 300:
                    current_session = session
                    break
        except Exception:
            continue

    if not current_session:
        return {
            "session_id": None,
            "message": "Current session not found"
        }

    return {
        "session_id": str(current_session.session_id),
        "device_info": current_session.device_info or {},
        "created_at": current_session.created_at.isoformat() if current_session.created_at else None,
        "last_activity_at": current_session.last_activity_at.isoformat() if current_session.last_activity_at else None,
        "expires_at": current_session.expires_at.isoformat() if current_session.expires_at else None,
        "mfa_verified": current_session.mfa_verified
    }


@router.get('/security-audit')
async def get_security_audit(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get security audit information for the user
    Shows login history, suspicious activities, and session statistics
    """
    # Get all sessions (active and terminated) for the last 30 days
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)

    q = select(UserSession).where(
        UserSession.user_id == user.user_id,
        UserSession.created_at > thirty_days_ago
    ).order_by(UserSession.created_at.desc())

    result = await db.execute(q)
    sessions = result.scalars().all()

    # Count active sessions
    active_count = sum(1 for s in sessions if s.is_active and s.expires_at > datetime.datetime.utcnow())

    # Count suspicious activities
    suspicious_count = sum(1 for s in sessions if s.suspicious_activity)

    # Get unique IPs
    unique_ips = set()
    for session in sessions:
        try:
            ip = decrypt(session.ip_address_encrypted)
            unique_ips.add(ip)
        except Exception:
            pass

    # Recent logins (last 10)
    recent_logins = []
    for session in sessions[:10]:
        try:
            ip = decrypt(session.ip_address_encrypted)
        except Exception:
            ip = "encrypted"

        recent_logins.append({
            "timestamp": session.created_at.isoformat() if session.created_at else None,
            "ip_address": ip,
            "device_info": session.device_info or {},
            "suspicious": session.suspicious_activity,
            "mfa_verified": session.mfa_verified
        })

    return {
        "user_id": str(user.user_id),
        "summary": {
            "active_sessions": active_count,
            "total_sessions_30_days": len(sessions),
            "suspicious_activities": suspicious_count,
            "unique_ip_addresses": len(unique_ips)
        },
        "recent_logins": recent_logins,
        "last_password_change": user.password_changed_at.isoformat() if user.password_changed_at else None,
        "mfa_enabled": user.mfa_enabled
    }

"""
Security Monitoring API Endpoints
Phase 5.1: Security Dashboard and Monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, text
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid

from ..utils.db import get_db
from ..models.user_models import User
from ..models.security_models import SecurityEvent, LoginAttempt
from .deps import get_current_user


router = APIRouter(prefix='/api/security', tags=['security-monitoring'])


# ============================================================================
# Pydantic Models
# ============================================================================

class SecurityEventResponse(BaseModel):
    event_id: str
    event_type: str
    severity: str
    user_id: Optional[str]
    username: Optional[str]
    ip_address: str
    country: Optional[str]
    city: Optional[str]
    details: Optional[dict]
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginAttemptResponse(BaseModel):
    attempt_id: str
    username: str
    success: bool
    failure_reason: Optional[str]
    ip_address: str
    country: Optional[str]
    city: Optional[str]
    mfa_required: bool
    attempted_at: datetime

    class Config:
        from_attributes = True


class SecurityDashboardResponse(BaseModel):
    summary: dict
    recent_events: List[SecurityEventResponse]
    failed_logins_today: int
    suspicious_activities: int
    unresolved_events: int


class SecurityMetrics(BaseModel):
    total_events: int
    events_by_severity: dict
    events_by_type: dict
    failed_logins_trend: List[dict]
    top_countries: List[dict]
    resolution_rate: float


# ============================================================================
# Helper Functions
# ============================================================================

def decrypt_ip(encrypted_ip: str) -> str:
    """
    Decrypt IP address for display

    TODO - Phase 9: Implement actual decryption using crypto.py
    Currently returns masked IP for privacy

    Configuration:
    - Set ENABLE_IP_DECRYPTION=true in .env to enable decryption
    - Requires crypto.py decrypt() implementation
    """
    import os

    # Check if IP decryption is enabled
    enable_decryption = os.getenv("ENABLE_IP_DECRYPTION", "false").lower() == "true"

    if enable_decryption:
        from ..utils.crypto import decrypt
        try:
            return decrypt(encrypted_ip)
        except Exception as e:
            logger.warning(f"Failed to decrypt IP: {e}")
            return "***.***.***.**"
    else:
        # Return masked IP for privacy compliance
        return "***.***.***.**"


async def get_location_from_ip(ip_address: str) -> dict:
    """
    Get geographic location from IP address

    TODO - Phase 9: Integrate with IP geolocation service
    Options:
    - MaxMind GeoLite2 (free, local database)
    - ipapi.co (API, rate-limited free tier)
    - ip-api.com (API, free for non-commercial)

    Configuration:
    - Set IP_GEOLOCATION_PROVIDER=maxmind|ipapi|ip-api in .env
    - Set IP_GEOLOCATION_API_KEY if using paid service

    For now, returns placeholder data
    """
    import os

    provider = os.getenv("IP_GEOLOCATION_PROVIDER", "none")

    if provider == "maxmind":
        # TODO: Implement MaxMind GeoLite2 lookup
        # import geoip2.database
        # reader = geoip2.database.Reader('/path/to/GeoLite2-City.mmdb')
        # response = reader.city(ip_address)
        # return {'country': response.country.name, 'city': response.city.name, ...}
        pass
    elif provider == "ipapi":
        # TODO: Implement ipapi.co API call
        # import httpx
        # async with httpx.AsyncClient() as client:
        #     response = await client.get(f"https://ipapi.co/{ip_address}/json/")
        #     data = response.json()
        #     return {'country': data['country_name'], 'city': data['city'], ...}
        pass

    # Placeholder response
    return {
        "country": "United States",
        "city": "Unknown",
        "latitude": None,
        "longitude": None
    }


# ============================================================================
# Security Dashboard Endpoints
# ============================================================================

@router.get('/dashboard', response_model=SecurityDashboardResponse)
async def get_security_dashboard(
    time_range: str = Query('24h', pattern='^(1h|24h|7d|30d)$'),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get security dashboard summary

    Requires: Admin or Manager role

    Time ranges:
    - 1h: Last hour
    - 24h: Last 24 hours (default)
    - 7d: Last 7 days
    - 30d: Last 30 days
    """
    # Check permissions
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail='Admin or Manager role required')

    # Calculate time threshold
    time_map = {
        '1h': timedelta(hours=1),
        '24h': timedelta(hours=24),
        '7d': timedelta(days=7),
        '30d': timedelta(days=30)
    }
    time_threshold = datetime.utcnow() - time_map[time_range]

    # Get summary statistics
    # Count total events
    total_events_q = select(func.count(SecurityEvent.event_id)).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold
        )
    )
    total_events_result = await db.execute(total_events_q)
    total_events = total_events_result.scalar() or 0

    # Count by severity
    severity_q = select(
        SecurityEvent.severity,
        func.count(SecurityEvent.event_id).label('count')
    ).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold
        )
    ).group_by(SecurityEvent.severity)
    severity_result = await db.execute(severity_q)
    severity_counts = {row.severity: row.count for row in severity_result}

    # Count failed logins today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    failed_logins_q = select(func.count(LoginAttempt.attempt_id)).where(
        and_(
            LoginAttempt.tenant_id == current_user.tenant_id,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at >= today_start
        )
    )
    failed_logins_result = await db.execute(failed_logins_q)
    failed_logins_today = failed_logins_result.scalar() or 0

    # Count suspicious activities
    suspicious_q = select(func.count(SecurityEvent.event_id)).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.event_type.like('%suspicious%'),
            SecurityEvent.created_at >= time_threshold
        )
    )
    suspicious_result = await db.execute(suspicious_q)
    suspicious_activities = suspicious_result.scalar() or 0

    # Count unresolved events
    unresolved_q = select(func.count(SecurityEvent.event_id)).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.resolved == False,
            SecurityEvent.created_at >= time_threshold
        )
    )
    unresolved_result = await db.execute(unresolved_q)
    unresolved_events = unresolved_result.scalar() or 0

    # Get recent events with username join
    from ..models.user_models import User
    recent_events_q = (
        select(SecurityEvent, User.username)
        .outerjoin(User, SecurityEvent.user_id == User.user_id)
        .where(
            and_(
                SecurityEvent.tenant_id == current_user.tenant_id,
                SecurityEvent.created_at >= time_threshold
            )
        )
        .order_by(desc(SecurityEvent.created_at))
        .limit(20)
    )
    recent_events_result = await db.execute(recent_events_q)
    recent_events_rows = recent_events_result.all()

    # Format recent events
    formatted_events = []
    for event, username in recent_events_rows:
        formatted_events.append(SecurityEventResponse(
            event_id=str(event.event_id),
            event_type=event.event_type,
            severity=event.severity,
            user_id=str(event.user_id) if event.user_id else None,
            username=username,  # Now populated from users table join
            ip_address=decrypt_ip(event.ip_address),
            country=event.country,
            city=event.city,
            details=event.details,
            resolved=event.resolved,
            created_at=event.created_at
        ))

    return SecurityDashboardResponse(
        summary={
            "total_events": total_events,
            "critical": severity_counts.get('critical', 0),
            "high": severity_counts.get('high', 0),
            "medium": severity_counts.get('medium', 0),
            "low": severity_counts.get('low', 0),
            "time_range": time_range
        },
        recent_events=formatted_events,
        failed_logins_today=failed_logins_today,
        suspicious_activities=suspicious_activities,
        unresolved_events=unresolved_events
    )


@router.get('/events', response_model=List[SecurityEventResponse])
async def list_security_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    resolved: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List security events with filtering

    Requires: Admin or Manager role
    """
    # Check permissions
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail='Admin or Manager role required')

    # Build query
    conditions = [SecurityEvent.tenant_id == current_user.tenant_id]

    if severity:
        conditions.append(SecurityEvent.severity == severity)
    if event_type:
        conditions.append(SecurityEvent.event_type == event_type)
    if resolved is not None:
        conditions.append(SecurityEvent.resolved == resolved)

    q = select(SecurityEvent).where(and_(*conditions)).order_by(
        desc(SecurityEvent.created_at)
    ).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(q)
    events = result.scalars().all()

    return [
        SecurityEventResponse(
            event_id=str(event.event_id),
            event_type=event.event_type,
            severity=event.severity,
            user_id=str(event.user_id) if event.user_id else None,
            username=None,
            ip_address=decrypt_ip(event.ip_address),
            country=event.country,
            city=event.city,
            details=event.details,
            resolved=event.resolved,
            created_at=event.created_at
        )
        for event in events
    ]


@router.post('/events/{event_id}/resolve')
async def resolve_security_event(
    event_id: uuid.UUID,
    resolution_notes: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a security event as resolved

    Requires: Admin or Manager role
    """
    # Check permissions
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail='Admin or Manager role required')

    # Get event
    q = select(SecurityEvent).where(
        and_(
            SecurityEvent.event_id == event_id,
            SecurityEvent.tenant_id == current_user.tenant_id
        )
    )
    result = await db.execute(q)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail='Security event not found')

    if event.resolved:
        raise HTTPException(status_code=400, detail='Event already resolved')

    # Mark as resolved
    event.resolved = True
    event.resolved_by = current_user.user_id
    event.resolved_at = datetime.utcnow()
    event.resolution_notes = resolution_notes

    await db.commit()

    return {
        "success": True,
        "message": "Security event resolved successfully"
    }


@router.get('/login-attempts', response_model=List[LoginAttemptResponse])
async def list_login_attempts(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    success: Optional[bool] = None,
    username: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List login attempts with filtering

    Requires: Admin or Manager role
    """
    # Check permissions
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail='Admin or Manager role required')

    # Build query
    conditions = [LoginAttempt.tenant_id == current_user.tenant_id]

    if success is not None:
        conditions.append(LoginAttempt.success == success)
    if username:
        conditions.append(LoginAttempt.username.ilike(f'%{username}%'))

    q = select(LoginAttempt).where(and_(*conditions)).order_by(
        desc(LoginAttempt.attempted_at)
    ).offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(q)
    attempts = result.scalars().all()

    return [
        LoginAttemptResponse(
            attempt_id=str(attempt.attempt_id),
            username=attempt.username,
            success=attempt.success,
            failure_reason=attempt.failure_reason,
            ip_address=decrypt_ip(attempt.ip_address),
            country=attempt.country,
            city=attempt.city,
            mfa_required=attempt.mfa_required,
            attempted_at=attempt.attempted_at
        )
        for attempt in attempts
    ]


@router.get('/metrics', response_model=SecurityMetrics)
async def get_security_metrics(
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get security metrics and statistics

    Requires: Admin or Manager role
    """
    # Check permissions
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail='Admin or Manager role required')

    time_threshold = datetime.utcnow() - timedelta(days=days)

    # Total events
    total_q = select(func.count(SecurityEvent.event_id)).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold
        )
    )
    total_result = await db.execute(total_q)
    total_events = total_result.scalar() or 0

    # Events by severity
    severity_q = select(
        SecurityEvent.severity,
        func.count(SecurityEvent.event_id).label('count')
    ).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold
        )
    ).group_by(SecurityEvent.severity)
    severity_result = await db.execute(severity_q)
    events_by_severity = {row.severity: row.count for row in severity_result}

    # Events by type
    type_q = select(
        SecurityEvent.event_type,
        func.count(SecurityEvent.event_id).label('count')
    ).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold
        )
    ).group_by(SecurityEvent.event_type).order_by(desc('count')).limit(10)
    type_result = await db.execute(type_q)
    events_by_type = {row.event_type: row.count for row in type_result}

    # Failed logins trend (last 7 days)
    failed_logins_trend = []
    for i in range(7):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        count_q = select(func.count(LoginAttempt.attempt_id)).where(
            and_(
                LoginAttempt.tenant_id == current_user.tenant_id,
                LoginAttempt.success == False,
                LoginAttempt.attempted_at >= day_start,
                LoginAttempt.attempted_at < day_end
            )
        )
        count_result = await db.execute(count_q)
        count = count_result.scalar() or 0

        failed_logins_trend.append({
            "date": day_start.date().isoformat(),
            "count": count
        })

    # Top countries
    countries_q = select(
        SecurityEvent.country,
        func.count(SecurityEvent.event_id).label('count')
    ).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold,
            SecurityEvent.country.isnot(None)
        )
    ).group_by(SecurityEvent.country).order_by(desc('count')).limit(10)
    countries_result = await db.execute(countries_q)
    top_countries = [{"country": row.country, "count": row.count} for row in countries_result]

    # Resolution rate
    resolved_q = select(func.count(SecurityEvent.event_id)).where(
        and_(
            SecurityEvent.tenant_id == current_user.tenant_id,
            SecurityEvent.created_at >= time_threshold,
            SecurityEvent.resolved == True
        )
    )
    resolved_result = await db.execute(resolved_q)
    resolved_count = resolved_result.scalar() or 0

    resolution_rate = (resolved_count / total_events * 100) if total_events > 0 else 0

    return SecurityMetrics(
        total_events=total_events,
        events_by_severity=events_by_severity,
        events_by_type=events_by_type,
        failed_logins_trend=list(reversed(failed_logins_trend)),  # Oldest to newest
        top_countries=top_countries,
        resolution_rate=round(resolution_rate, 2)
    )

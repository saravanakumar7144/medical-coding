"""
Health Check and Readiness Endpoints

These endpoints are used by container orchestration systems (Kubernetes, Docker, etc.)
to determine application health and readiness to accept traffic.
"""

import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as redis
import os

from ..utils.db import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check endpoint

    Returns HTTP 200 if the application is running.
    Used by load balancers and monitoring systems to check if the service is alive.

    Returns:
        dict: Status and version information
    """
    return {
        "status": "healthy",
        "version": "v0.6.0",
        "service": "panaceon-medical-coding-api"
    }


@router.get("/readiness", status_code=status.HTTP_200_OK)
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Readiness check endpoint

    Verifies that all critical dependencies are available:
    - Database connection
    - Redis connection (if configured)

    Returns HTTP 200 if ready, HTTP 503 if not ready.

    This endpoint should be used by Kubernetes readiness probes to determine
    if the pod is ready to accept traffic.

    Returns:
        dict: Readiness status and dependency checks
    """
    checks = {
        "database": False,
        "redis": False
    }

    all_ready = True

    # Check database connection
    try:
        result = await db.execute(text("SELECT 1"))
        row = result.fetchone()
        if row and row[0] == 1:
            checks["database"] = True
            logger.debug("Database check: OK")
        else:
            all_ready = False
            logger.warning("Database check: Failed - unexpected result")
    except Exception as e:
        all_ready = False
        logger.error(f"Database check failed: {e}")
        checks["database_error"] = str(e)

    # Check Redis connection (if configured)
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            redis_client = redis.from_url(redis_url, decode_responses=True)
            await redis_client.ping()
            checks["redis"] = True
            logger.debug("Redis check: OK")
            await redis_client.close()
        except Exception as e:
            all_ready = False
            logger.error(f"Redis check failed: {e}")
            checks["redis_error"] = str(e)
    else:
        # Redis not configured, skip check
        checks["redis"] = "not_configured"

    if not all_ready:
        # Return 503 Service Unavailable if dependencies are not ready
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "checks": checks,
                "message": "Some dependencies are not available"
            }
        )

    return {
        "status": "ready",
        "checks": checks,
        "message": "All systems operational"
    }


@router.get("/liveness", status_code=status.HTTP_200_OK)
async def liveness_check():
    """
    Liveness check endpoint

    Simple check to verify the application process is alive and not deadlocked.
    Used by Kubernetes liveness probes to determine if the pod should be restarted.

    This is a lightweight check that doesn't verify dependencies.

    Returns:
        dict: Liveness status
    """
    return {
        "status": "alive",
        "message": "Application is running"
    }

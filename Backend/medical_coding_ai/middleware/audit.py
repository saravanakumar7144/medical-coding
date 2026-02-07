from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from ..utils.db import get_db
from ..models.user_models import AuditLog
import asyncio
import logging
from typing import Optional, Tuple
from jose import jwt, JWTError

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # capture some context
        user_agent = request.headers.get('user-agent')
        ip = request.client.host if request.client else None
        path = request.url.path
        method = request.method

        # Extract user_id and tenant_id from JWT token if present
        user_id, tenant_id = self._extract_user_context(request)

        response = await call_next(request)

        # run fire-and-forget log (don't block response)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(self._log(request, path, method, ip, user_agent, user_id, tenant_id))
        except Exception as e:
            # Log error but don't block response
            logger.error(f"Failed to schedule audit log task: {e}")

        return response

    def _extract_user_context(self, request: Request) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract user_id and tenant_id from JWT token in Authorization header.
        Returns (None, None) for unauthenticated requests.

        Args:
            request: FastAPI Request object

        Returns:
            Tuple of (user_id, tenant_id) or (None, None) if not authenticated
        """
        try:
            # Get Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return None, None

            # Extract token
            token = auth_header.split(' ')[1]

            # Import JWT configuration from auth module
            from ..api.auth import JWT_SECRET, JWT_ALGORITHM

            # Decode token (without validation - just for audit purposes)
            # Note: Full validation happens in get_current_user() dependency
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

            user_id = payload.get('sub')
            tenant_id = payload.get('tenant_id')

            return user_id, tenant_id

        except JWTError:
            # Invalid token - this is fine, middleware should not reject requests
            # Token validation happens in the endpoint dependencies
            return None, None
        except Exception as e:
            # Log unexpected errors but don't fail the request
            logger.warning(f"Unexpected error extracting user context for audit: {e}")
            return None, None

    async def _log(self, request: Request, path: str, method: str, ip: str, user_agent: str,
                   user_id: Optional[str], tenant_id: Optional[str]):
        """
        Persist audit log entry to database.

        Args:
            request: FastAPI Request object
            path: API endpoint path
            method: HTTP method
            ip: Client IP address
            user_agent: User agent string
            user_id: User ID from JWT token (None if unauthenticated)
            tenant_id: Tenant ID from JWT token (None if unauthenticated)
        """
        async for db in get_db():
            try:
                entry = AuditLog(
                    tenant_id=tenant_id,
                    user_id=user_id,
                    action_type='request',
                    action_category='data_access',
                    api_endpoint=path,
                    http_method=method,
                    ip_address=ip,
                    user_agent=user_agent
                )
                db.add(entry)
                await db.commit()
                return
            except Exception as e:
                # Log to stderr for monitoring but don't fail the request
                logger.error(f"Failed to persist audit log: {e}")
                try:
                    await db.rollback()
                except Exception:
                    pass
                return

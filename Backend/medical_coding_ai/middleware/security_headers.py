"""
Phase 4: Security Headers Middleware
Adds comprehensive security headers to all HTTP responses
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses

    Headers added:
    - Content-Security-Policy (CSP): Prevents XSS and injection attacks
    - Strict-Transport-Security (HSTS): Forces HTTPS connections
    - X-Frame-Options: Prevents clickjacking attacks
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-XSS-Protection: Enables browser XSS filter
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Content Security Policy (CSP)
        # Restricts sources for scripts, styles, images, etc.
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Allow inline scripts for React
            "style-src 'self' 'unsafe-inline'",  # Allow inline styles for Tailwind
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' http://localhost:* https:",  # Allow API calls
            "frame-ancestors 'none'",  # Equivalent to X-Frame-Options: DENY
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # HTTP Strict Transport Security (HSTS)
        # Forces browsers to use HTTPS for all future requests (1 year)
        # Note: Only effective when served over HTTPS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # X-Frame-Options
        # Prevents the page from being embedded in an iframe (clickjacking protection)
        response.headers["X-Frame-Options"] = "DENY"

        # X-Content-Type-Options
        # Prevents browsers from MIME-sniffing responses
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-XSS-Protection
        # Enables browser's XSS filter (legacy, but still useful for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer-Policy
        # Controls how much referrer information is included with requests
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions-Policy (formerly Feature-Policy)
        # Controls which browser features can be used
        permissions_policy = [
            "geolocation=()",  # Disable geolocation
            "microphone=()",   # Disable microphone
            "camera=()",       # Disable camera
            "payment=()",      # Disable payment API
            "usb=()",          # Disable USB
            "magnetometer=()", # Disable magnetometer
            "gyroscope=()",    # Disable gyroscope
            "accelerometer=()" # Disable accelerometer
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions_policy)

        # X-Permitted-Cross-Domain-Policies
        # Prevents Adobe Flash and PDF documents from loading data from this domain
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Cache-Control for sensitive endpoints
        # Prevent caching of sensitive data
        if "/api/auth/" in request.url.path or "/api/users/" in request.url.path:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response


def get_security_headers_info() -> dict:
    """
    Get information about security headers configuration
    Useful for security audits and documentation
    """
    return {
        "Content-Security-Policy": {
            "enabled": True,
            "description": "Prevents XSS and injection attacks by restricting content sources",
            "directives": {
                "default-src": "'self'",
                "script-src": "'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src": "'self' 'unsafe-inline'",
                "img-src": "'self' data: https:",
                "connect-src": "'self' http://localhost:* https:"
            }
        },
        "Strict-Transport-Security": {
            "enabled": True,
            "description": "Forces HTTPS connections for 1 year",
            "max_age": 31536000,
            "include_subdomains": True,
            "preload": True
        },
        "X-Frame-Options": {
            "enabled": True,
            "description": "Prevents clickjacking by denying iframe embedding",
            "value": "DENY"
        },
        "X-Content-Type-Options": {
            "enabled": True,
            "description": "Prevents MIME type sniffing",
            "value": "nosniff"
        },
        "X-XSS-Protection": {
            "enabled": True,
            "description": "Enables browser XSS filter",
            "value": "1; mode=block"
        },
        "Referrer-Policy": {
            "enabled": True,
            "description": "Controls referrer information sent with requests",
            "value": "strict-origin-when-cross-origin"
        },
        "Permissions-Policy": {
            "enabled": True,
            "description": "Controls browser feature access",
            "disabled_features": [
                "geolocation", "microphone", "camera", "payment",
                "usb", "magnetometer", "gyroscope", "accelerometer"
            ]
        }
    }

"""
Epic Backend Services JWT Authentication

Implements the Epic Backend Services authentication flow:
1. Generate JWT assertion signed with private key
2. Exchange JWT for access token at Epic's token endpoint
3. Use access token for FHIR API calls

Reference: https://fhir.epic.com/Documentation?docId=oauth2&section=Backend-OAuth2-Guide
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Optional
import uuid

try:
    import jwt
except ImportError:
    jwt = None

try:
    import httpx
except ImportError:
    httpx = None

logger = logging.getLogger(__name__)


class EpicAuth:
    """
    Epic Backend Services authentication handler.

    Uses JWT Bearer token flow for server-to-server authentication.
    """

    # Epic token endpoint (production)
    TOKEN_ENDPOINT = "/oauth2/token"

    # JWT configuration
    JWT_ALGORITHM = "RS384"
    JWT_EXPIRY_MINUTES = 5

    def __init__(
        self,
        base_url: str,
        client_id: str,
        private_key: Optional[str] = None,
        public_key_id: Optional[str] = None
    ):
        """
        Initialize Epic authentication.

        Args:
            base_url: Epic FHIR base URL
            client_id: Epic client ID (from App Orchard registration)
            private_key: RSA private key in PEM format
            public_key_id: Key ID if required by Epic
        """
        self.base_url = base_url.rstrip('/') if base_url else ''
        self.client_id = client_id
        self.private_key = private_key
        self.public_key_id = public_key_id

        # Token cache
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    async def get_access_token(self) -> str:
        """
        Get a valid access token, refreshing if necessary.

        Returns:
            Access token string

        Raises:
            AuthenticationError: If authentication fails
        """
        # Check if we have a valid cached token
        if self._access_token and self._token_expires_at:
            # Refresh 5 minutes before expiry
            if datetime.utcnow() < self._token_expires_at - timedelta(minutes=5):
                return self._access_token

        # Generate new token
        return await self._request_access_token()

    async def _request_access_token(self) -> str:
        """
        Request a new access token from Epic.

        Returns:
            Access token string
        """
        if not self.private_key:
            raise AuthenticationError("Private key required for Epic Backend Services")

        if jwt is None:
            raise ImportError("PyJWT is required for Epic authentication. Install with: pip install pyjwt")

        if httpx is None:
            raise ImportError("httpx is required for Epic authentication. Install with: pip install httpx")

        # Generate JWT assertion
        jwt_assertion = self._generate_jwt_assertion()

        # Exchange JWT for access token
        token_url = f"{self.base_url}{self.TOKEN_ENDPOINT}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                    "client_assertion": jwt_assertion,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            if response.status_code != 200:
                error_msg = f"Epic token request failed: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise AuthenticationError(error_msg)

            token_data = response.json()

            # Cache the token
            self._access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)  # Default 1 hour
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

            logger.info(f"Obtained Epic access token, expires in {expires_in}s")
            return self._access_token

    def _generate_jwt_assertion(self) -> str:
        """
        Generate a JWT assertion for Epic Backend Services.

        Returns:
            Signed JWT string
        """
        now = int(time.time())
        expiry = now + (self.JWT_EXPIRY_MINUTES * 60)

        # Epic JWT claims
        claims = {
            "iss": self.client_id,
            "sub": self.client_id,
            "aud": f"{self.base_url}{self.TOKEN_ENDPOINT}",
            "jti": str(uuid.uuid4()),
            "exp": expiry,
            "nbf": now,
            "iat": now,
        }

        # JWT headers
        headers = {
            "alg": self.JWT_ALGORITHM,
            "typ": "JWT",
        }

        if self.public_key_id:
            headers["kid"] = self.public_key_id

        # Sign the JWT
        token = jwt.encode(
            claims,
            self.private_key,
            algorithm=self.JWT_ALGORITHM,
            headers=headers
        )

        return token

    def clear_cache(self):
        """Clear the cached access token."""
        self._access_token = None
        self._token_expires_at = None


class AuthenticationError(Exception):
    """Raised when Epic authentication fails."""
    pass

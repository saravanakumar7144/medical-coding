"""
Epic FHIR HTTP Client

Handles HTTP communication with Epic FHIR R4 API.
Includes:
- Automatic retry with exponential backoff
- Rate limiting handling
- Pagination support
- Error handling
"""

import logging
from typing import Dict, Any, Optional, List
import asyncio

try:
    import httpx
except ImportError:
    httpx = None

logger = logging.getLogger(__name__)


class EpicClient:
    """
    HTTP client for Epic FHIR R4 API.

    Handles authentication headers, pagination, and error handling.
    """

    # FHIR API version
    FHIR_VERSION = "R4"

    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAY_BASE = 1.0  # seconds
    RETRY_DELAY_MAX = 30.0  # seconds

    # Request timeout
    TIMEOUT_SECONDS = 30

    def __init__(self, base_url: str):
        """
        Initialize the Epic FHIR client.

        Args:
            base_url: Epic FHIR base URL (e.g., https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4)
        """
        self.base_url = base_url.rstrip('/') if base_url else ''

        if httpx is None:
            logger.warning("httpx not installed. Install with: pip install httpx")

    async def get(
        self,
        path: str,
        params: Optional[Dict[str, str]] = None,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Make a GET request to the Epic FHIR API.

        Args:
            path: API path (e.g., '/Patient')
            params: Query parameters
            token: OAuth access token

        Returns:
            JSON response as dict

        Raises:
            EpicApiError: If the request fails
        """
        url = f"{self.base_url}{path}"
        headers = self._build_headers(token)

        for attempt in range(self.MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                    response = await client.get(url, params=params, headers=headers)

                    # Handle rate limiting
                    if response.status_code == 429:
                        retry_after = int(response.headers.get('Retry-After', 60))
                        logger.warning(f"Rate limited. Waiting {retry_after}s before retry")
                        await asyncio.sleep(retry_after)
                        continue

                    # Handle success
                    if response.status_code == 200:
                        return response.json()

                    # Handle errors
                    if response.status_code >= 400:
                        raise EpicApiError(
                            f"API request failed: {response.status_code}",
                            status_code=response.status_code,
                            response_body=response.text
                        )

            except httpx.TimeoutException:
                logger.warning(f"Request timeout (attempt {attempt + 1}/{self.MAX_RETRIES})")
                if attempt == self.MAX_RETRIES - 1:
                    raise EpicApiError("Request timed out after retries")

            except httpx.RequestError as e:
                logger.warning(f"Request error (attempt {attempt + 1}/{self.MAX_RETRIES}): {e}")
                if attempt == self.MAX_RETRIES - 1:
                    raise EpicApiError(f"Request failed: {e}")

            # Exponential backoff
            delay = min(self.RETRY_DELAY_BASE * (2 ** attempt), self.RETRY_DELAY_MAX)
            await asyncio.sleep(delay)

        raise EpicApiError("Max retries exceeded")

    async def get_all_pages(
        self,
        path: str,
        params: Optional[Dict[str, str]] = None,
        token: Optional[str] = None,
        max_pages: int = 100
    ) -> List[Dict]:
        """
        Fetch all pages of a FHIR Bundle response.

        Args:
            path: API path
            params: Initial query parameters
            token: OAuth access token
            max_pages: Maximum number of pages to fetch

        Returns:
            List of all resources from all pages
        """
        all_resources = []
        page_count = 0

        while page_count < max_pages:
            response = await self.get(path, params, token)

            # Extract resources from bundle
            entries = response.get('entry', [])
            for entry in entries:
                if 'resource' in entry:
                    all_resources.append(entry['resource'])

            page_count += 1

            # Check for next page
            next_link = self._get_next_link(response)
            if not next_link:
                break

            # Update URL for next page
            path = next_link.replace(self.base_url, '')
            params = None  # URL already contains params

        logger.info(f"Fetched {len(all_resources)} resources across {page_count} pages")
        return all_resources

    def _build_headers(self, token: Optional[str]) -> Dict[str, str]:
        """Build request headers."""
        headers = {
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json',
        }

        if token:
            headers['Authorization'] = f'Bearer {token}'

        return headers

    def _get_next_link(self, bundle: Dict) -> Optional[str]:
        """Extract the 'next' link from a FHIR Bundle for pagination."""
        links = bundle.get('link', [])
        for link in links:
            if link.get('relation') == 'next':
                return link.get('url')
        return None


class EpicApiError(Exception):
    """Raised when an Epic API request fails."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_body: Optional[str] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body

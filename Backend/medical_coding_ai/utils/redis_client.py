"""
Redis Client for Token Blacklist
Handles connection to Redis for storing blacklisted JWT tokens
"""
import os
import logging
from typing import Optional
try:
    import redis.asyncio as aioredis
except ImportError:
    # Fallback for older redis versions
    import aioredis

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """
    Get or create Redis client instance
    Returns None if Redis is not available (graceful degradation)
    """
    global _redis_client
    
    if _redis_client is None:
        try:
            _redis_client = await aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # Test connection
            await _redis_client.ping()
            logger.info(f"✓ Redis connected: {REDIS_URL}")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}. Token blacklist will use in-memory fallback.")
            _redis_client = None
    
    return _redis_client


async def close_redis():
    """Close Redis connection"""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {e}")
        finally:
            _redis_client = None


# In-memory fallback for when Redis is not available
_memory_blacklist: set = set()


async def blacklist_token(jti: str, exp: int) -> bool:
    """
    Add token to blacklist until its expiry
    
    Args:
        jti: JWT ID (unique token identifier)
        exp: Token expiry timestamp (unix epoch)
    
    Returns:
        True if blacklisted successfully, False otherwise
    """
    try:
        redis_client = await get_redis()
        
        if redis_client:
            # Use Redis for distributed blacklist
            import time
            ttl = exp - int(time.time())
            
            if ttl > 0:
                await redis_client.setex(f"blacklist:{jti}", ttl, "1")
                logger.debug(f"Token {jti[:8]}... blacklisted in Redis (TTL: {ttl}s)")
                return True
        else:
            # Fallback to in-memory blacklist
            _memory_blacklist.add(jti)
            logger.debug(f"Token {jti[:8]}... blacklisted in memory")
            return True
    except Exception as e:
        logger.error(f"Error blacklisting token: {e}")
        # Fallback to memory
        _memory_blacklist.add(jti)
        return False


async def is_token_blacklisted(jti: str) -> bool:
    """
    Check if token is blacklisted
    
    Args:
        jti: JWT ID to check
    
    Returns:
        True if blacklisted, False otherwise
    """
    try:
        redis_client = await get_redis()
        
        if redis_client:
            # Check Redis
            exists = await redis_client.exists(f"blacklist:{jti}")
            return exists > 0
        else:
            # Check in-memory blacklist
            return jti in _memory_blacklist
    except Exception as e:
        logger.error(f"Error checking token blacklist: {e}")
        # Fallback to memory check
        return jti in _memory_blacklist


async def cleanup_memory_blacklist():
    """
    Periodic cleanup of in-memory blacklist
    Only needed when Redis is not available
    """
    # Note: In-memory blacklist doesn't auto-expire like Redis
    # This is a limitation of the fallback system
    # For production, Redis should be used
    if not await get_redis():
        logger.warning("In-memory blacklist is being used. Tokens will not auto-expire.")

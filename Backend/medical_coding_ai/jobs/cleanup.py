"""
Cleanup Jobs for Panaceon V-06 Authentication System
=====================================================

Scheduled jobs to clean up expired tokens, sessions, and old audit logs.

Usage:
    # Manual cleanup
    python -m medical_coding_ai.jobs.cleanup

    # Or import and schedule with APScheduler
    from medical_coding_ai.jobs.cleanup import run_all_cleanup_jobs
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import delete, select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CleanupService:
    """Service for cleaning up expired authentication data"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def cleanup_expired_password_resets(self, grace_hours: int = 24) -> int:
        """
        Clean up expired password reset tokens.
        
        Args:
            grace_hours: Additional hours after expiry before deletion (default 24)
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(hours=grace_hours)
            
            # Count records to delete
            count_query = text("""
                SELECT COUNT(*) FROM password_resets 
                WHERE expires_at < :cutoff
            """)
            result = await self.db.execute(count_query, {"cutoff": cutoff})
            count = result.scalar() or 0
            
            if count > 0:
                # Delete expired records
                delete_query = text("""
                    DELETE FROM password_resets 
                    WHERE expires_at < :cutoff
                """)
                await self.db.execute(delete_query, {"cutoff": cutoff})
                await self.db.commit()
                logger.info(f"Cleaned up {count} expired password reset tokens")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up password resets: {e}")
            await self.db.rollback()
            return 0

    async def cleanup_expired_sessions(self, grace_days: int = 7) -> int:
        """
        Clean up expired user sessions.
        
        Args:
            grace_days: Additional days after expiry before deletion (default 7)
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(days=grace_days)
            
            # Count records to delete
            count_query = text("""
                SELECT COUNT(*) FROM user_sessions 
                WHERE expires_at < :cutoff OR (is_active = false AND updated_at < :cutoff)
            """)
            result = await self.db.execute(count_query, {"cutoff": cutoff})
            count = result.scalar() or 0
            
            if count > 0:
                # Delete expired/inactive records
                delete_query = text("""
                    DELETE FROM user_sessions 
                    WHERE expires_at < :cutoff OR (is_active = false AND updated_at < :cutoff)
                """)
                await self.db.execute(delete_query, {"cutoff": cutoff})
                await self.db.commit()
                logger.info(f"Cleaned up {count} expired sessions")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {e}")
            await self.db.rollback()
            return 0

    async def cleanup_old_audit_logs(self, retention_days: int = 365) -> int:
        """
        Clean up old audit logs beyond retention period.
        
        Args:
            retention_days: Days to retain audit logs (default 365)
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(days=retention_days)
            
            # Count records to delete
            count_query = text("""
                SELECT COUNT(*) FROM audit_logs 
                WHERE created_at < :cutoff
            """)
            result = await self.db.execute(count_query, {"cutoff": cutoff})
            count = result.scalar() or 0
            
            if count > 0:
                # Delete old records in batches to avoid lock issues
                batch_size = 10000
                total_deleted = 0
                
                while True:
                    delete_query = text("""
                        DELETE FROM audit_logs 
                        WHERE id IN (
                            SELECT id FROM audit_logs 
                            WHERE created_at < :cutoff 
                            LIMIT :batch_size
                        )
                    """)
                    result = await self.db.execute(delete_query, {
                        "cutoff": cutoff,
                        "batch_size": batch_size
                    })
                    deleted = result.rowcount
                    total_deleted += deleted
                    await self.db.commit()
                    
                    if deleted < batch_size:
                        break
                
                logger.info(f"Cleaned up {total_deleted} old audit logs")
                return total_deleted
            
            return 0
            
        except Exception as e:
            logger.error(f"Error cleaning up audit logs: {e}")
            await self.db.rollback()
            return 0

    async def cleanup_blacklisted_tokens(self, grace_hours: int = 24) -> int:
        """
        Clean up expired blacklisted tokens.
        
        Args:
            grace_hours: Additional hours after expiry before deletion (default 24)
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(hours=grace_hours)
            
            # Count records to delete
            count_query = text("""
                SELECT COUNT(*) FROM token_blacklist 
                WHERE expires_at < :cutoff
            """)
            result = await self.db.execute(count_query, {"cutoff": cutoff})
            count = result.scalar() or 0
            
            if count > 0:
                # Delete expired records
                delete_query = text("""
                    DELETE FROM token_blacklist 
                    WHERE expires_at < :cutoff
                """)
                await self.db.execute(delete_query, {"cutoff": cutoff})
                await self.db.commit()
                logger.info(f"Cleaned up {count} expired blacklisted tokens")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up blacklisted tokens: {e}")
            await self.db.rollback()
            return 0

    async def cleanup_expired_refresh_tokens(self, grace_days: int = 7) -> int:
        """
        Clean up expired refresh tokens.
        
        Args:
            grace_days: Additional days after expiry before deletion (default 7)
        
        Returns:
            Number of records deleted
        """
        try:
            cutoff = datetime.utcnow() - timedelta(days=grace_days)
            
            # Count records to delete
            count_query = text("""
                SELECT COUNT(*) FROM refresh_tokens 
                WHERE expires_at < :cutoff OR revoked = true
            """)
            result = await self.db.execute(count_query, {"cutoff": cutoff})
            count = result.scalar() or 0
            
            if count > 0:
                # Delete expired/revoked records
                delete_query = text("""
                    DELETE FROM refresh_tokens 
                    WHERE expires_at < :cutoff OR revoked = true
                """)
                await self.db.execute(delete_query, {"cutoff": cutoff})
                await self.db.commit()
                logger.info(f"Cleaned up {count} expired/revoked refresh tokens")
            
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up refresh tokens: {e}")
            await self.db.rollback()
            return 0

    async def run_all_cleanup(self) -> dict:
        """
        Run all cleanup jobs.
        
        Returns:
            Dictionary with counts of deleted records per category
        """
        logger.info("Starting cleanup jobs...")
        
        results = {
            "password_resets": await self.cleanup_expired_password_resets(),
            "sessions": await self.cleanup_expired_sessions(),
            "audit_logs": await self.cleanup_old_audit_logs(),
            "blacklisted_tokens": await self.cleanup_blacklisted_tokens(),
            "refresh_tokens": await self.cleanup_expired_refresh_tokens(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        total = sum(v for k, v in results.items() if isinstance(v, int))
        logger.info(f"Cleanup completed. Total records deleted: {total}")
        
        return results


async def run_all_cleanup_jobs():
    """
    Main function to run all cleanup jobs.
    Call this from a scheduler or manually.
    """
    from medical_coding_ai.utils.db import async_session
    
    async with async_session() as db:
        service = CleanupService(db)
        return await service.run_all_cleanup()


# API endpoint function for manual cleanup trigger
async def manual_cleanup_endpoint(db: AsyncSession) -> dict:
    """
    Endpoint function to trigger manual cleanup.
    Use from an admin API endpoint.
    """
    service = CleanupService(db)
    return await service.run_all_cleanup()


if __name__ == "__main__":
    # Run cleanup when script is executed directly
    print("Running cleanup jobs...")
    results = asyncio.run(run_all_cleanup_jobs())
    print(f"Cleanup results: {results}")

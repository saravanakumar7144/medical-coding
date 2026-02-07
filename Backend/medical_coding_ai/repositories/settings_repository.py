"""
Settings Repository
Data access layer for tenant AI settings, security settings, and backup records
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from ..models.settings_models import TenantAISettings, TenantSecuritySettings, BackupRecord
from ..models.tenant_models import Tenant


class AISettingsRepository:
    """Repository for tenant AI settings operations"""

    @staticmethod
    async def get_by_tenant(db: AsyncSession, tenant_id: UUID) -> Optional[TenantAISettings]:
        """Get AI settings for a tenant"""
        stmt = select(TenantAISettings).where(TenantAISettings.tenant_id == tenant_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, tenant_id: UUID, **kwargs) -> TenantAISettings:
        """Create AI settings for a tenant"""
        settings = TenantAISettings(tenant_id=tenant_id, **kwargs)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        return settings

    @staticmethod
    async def update(db: AsyncSession, tenant_id: UUID, **kwargs) -> Optional[TenantAISettings]:
        """Update AI settings for a tenant"""
        # Add updated_at timestamp
        kwargs['updated_at'] = datetime.utcnow()

        stmt = (
            update(TenantAISettings)
            .where(TenantAISettings.tenant_id == tenant_id)
            .values(**kwargs)
            .returning(TenantAISettings)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_or_create(db: AsyncSession, tenant_id: UUID) -> TenantAISettings:
        """Get existing settings or create default for tenant"""
        settings = await AISettingsRepository.get_by_tenant(db, tenant_id)
        if not settings:
            settings = await AISettingsRepository.create(db, tenant_id)
        return settings


class SecuritySettingsRepository:
    """Repository for tenant security settings operations"""

    @staticmethod
    async def get_by_tenant(db: AsyncSession, tenant_id: UUID) -> Optional[TenantSecuritySettings]:
        """Get security settings for a tenant"""
        stmt = select(TenantSecuritySettings).where(TenantSecuritySettings.tenant_id == tenant_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, tenant_id: UUID, **kwargs) -> TenantSecuritySettings:
        """Create security settings for a tenant"""
        settings = TenantSecuritySettings(tenant_id=tenant_id, **kwargs)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        return settings

    @staticmethod
    async def update(db: AsyncSession, tenant_id: UUID, **kwargs) -> Optional[TenantSecuritySettings]:
        """Update security settings for a tenant"""
        # Add updated_at timestamp
        kwargs['updated_at'] = datetime.utcnow()

        stmt = (
            update(TenantSecuritySettings)
            .where(TenantSecuritySettings.tenant_id == tenant_id)
            .values(**kwargs)
            .returning(TenantSecuritySettings)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_or_create(db: AsyncSession, tenant_id: UUID) -> TenantSecuritySettings:
        """Get existing settings or create default for tenant"""
        settings = await SecuritySettingsRepository.get_by_tenant(db, tenant_id)
        if not settings:
            settings = await SecuritySettingsRepository.create(db, tenant_id)
        return settings


class BackupRepository:
    """Repository for backup record operations"""

    @staticmethod
    async def get_by_id(db: AsyncSession, backup_id: UUID) -> Optional[BackupRecord]:
        """Get backup record by ID"""
        stmt = select(BackupRecord).where(BackupRecord.backup_id == backup_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_tenant(
        db: AsyncSession,
        tenant_id: UUID,
        include_deleted: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[BackupRecord]:
        """List backup records for a tenant"""
        stmt = select(BackupRecord).where(BackupRecord.tenant_id == tenant_id)

        if not include_deleted:
            stmt = stmt.where(BackupRecord.deleted == False)

        stmt = stmt.order_by(BackupRecord.created_at.desc()).limit(limit).offset(offset)

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, tenant_id: UUID, created_by: UUID, **kwargs) -> BackupRecord:
        """Create a new backup record"""
        backup = BackupRecord(
            tenant_id=tenant_id,
            created_by=created_by,
            **kwargs
        )
        db.add(backup)
        await db.commit()
        await db.refresh(backup)
        return backup

    @staticmethod
    async def update_status(
        db: AsyncSession,
        backup_id: UUID,
        status: str,
        **kwargs
    ) -> Optional[BackupRecord]:
        """Update backup status and related fields"""
        update_data = {'status': status, **kwargs}

        # Add completed_at if status is completed
        if status == 'completed' and 'completed_at' not in kwargs:
            update_data['completed_at'] = datetime.utcnow()

        stmt = (
            update(BackupRecord)
            .where(BackupRecord.backup_id == backup_id)
            .values(**update_data)
            .returning(BackupRecord)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def mark_deleted(db: AsyncSession, backup_id: UUID) -> Optional[BackupRecord]:
        """Soft delete a backup record"""
        stmt = (
            update(BackupRecord)
            .where(BackupRecord.backup_id == backup_id)
            .values(deleted=True, deleted_at=datetime.utcnow())
            .returning(BackupRecord)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_latest_by_tenant(db: AsyncSession, tenant_id: UUID) -> Optional[BackupRecord]:
        """Get the most recent backup for a tenant"""
        stmt = (
            select(BackupRecord)
            .where(BackupRecord.tenant_id == tenant_id)
            .where(BackupRecord.deleted == False)
            .order_by(BackupRecord.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

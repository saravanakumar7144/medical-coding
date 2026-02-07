"""
Simple seed script for Panaceon database - creates admin user
No emojis for Windows compatibility
"""

import asyncio
import sys
import os
from pathlib import Path

# Add Backend root to path (two levels up from scripts/initialization/)
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from sqlalchemy import select, insert, delete
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from datetime import datetime
import uuid

from medical_coding_ai.utils.db import get_async_session_context
from medical_coding_ai.models.tenant_models import Tenant
from medical_coding_ai.models.user_models import User
from medical_coding_ai.utils.crypto import encrypt, deterministic_hash


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def create_admin():
    """Create admin user"""

    print("=" * 60)
    print("Panaceon Simple Admin Seeding")
    print("=" * 60)

    try:
        async with get_async_session_context() as db:
            # Check for existing tenant
            result = await db.execute(select(Tenant).limit(1))
            tenant = result.scalar_one_or_none()

            if not tenant:
                print("\nCreating default tenant...")
                tenant_id = str(uuid.uuid4())
                stmt = insert(Tenant).values(
                    tenant_id=tenant_id,
                    tenant_name="Panaceon Healthcare",
                    company_name="Panaceon Healthcare Inc.",
                    enrollment_tier="enterprise",
                    max_users=100,
                    max_storage_gb=500
                )
                await db.execute(stmt)
                await db.commit()
                print(f"  Created tenant: {tenant_id[:8]}...")
            else:
                tenant_id = str(tenant.tenant_id)
                print(f"\nUsing existing tenant: {tenant.tenant_name} ({tenant_id[:8]}...)")

            # Check for existing admin user
            result = await db.execute(
                select(User).where(User.username == 'admin')
            )
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                print("\nAdmin user already exists. Deleting and recreating...")
                await db.execute(delete(User).where(User.username == 'admin'))
                await db.commit()

            # Create admin user
            print("\nCreating admin user...")

            password_hash = hash_password("Admin123")
            email = "admin@panaceon.com"
            email_encrypted = encrypt(email)
            dec_hash = deterministic_hash(email)
            first_name_encrypted = encrypt("Platform")
            last_name_encrypted = encrypt("Admin")
            phone_encrypted = encrypt("+1-555-0001")
            now = datetime.now()

            stmt = insert(User).values(
                tenant_id=tenant_id,
                username="admin",
                email_encrypted=email_encrypted,
                dec_hash=dec_hash,
                password_hash=password_hash,
                first_name_encrypted=first_name_encrypted,
                last_name_encrypted=last_name_encrypted,
                phone_encrypted=phone_encrypted,
                employee_id="EMP-ADMIN-001",
                role="admin",
                is_active=True,
                email_verified=True,
                email_verified_at=now,
                mfa_enabled=False,
                created_at=now
            ).returning(User.user_id)

            result = await db.execute(stmt)
            await db.commit()
            user_id = result.scalar_one()

            print(f"  Created user: admin ({str(user_id)[:8]}...)")

            print("\n" + "=" * 60)
            print("SUCCESS! Admin user created.")
            print("=" * 60)
            print("\nLogin credentials:")
            print("  Username: admin")
            print("  Password: Admin123")
            print("\nYou can now login at: http://localhost:3000/login")
            print("")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(create_admin())

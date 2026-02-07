"""
Seed script to create initial admin user for the platform.
Run this after init_db.py to create the admin user.

Usage:
    cd Backend
    python seed_admin.py
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add Backend root to path (two levels up from scripts/initialization/)
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.insert(0, backend_root)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import insert, select, text
import bcrypt
from medical_coding_ai.utils.db import engine, async_session
from medical_coding_ai.models.user_models import User
from medical_coding_ai.models.tenant_models import Tenant
from medical_coding_ai.utils.crypto import encrypt, deterministic_hash


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly."""
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')


async def seed_admin():
    """Create initial admin user and tenant"""
    async with async_session() as db:
        try:
            # Check if admin user already exists
            q = select(User).where(User.username == 'admin')
            result = await db.execute(q)
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("✓ Admin user already exists!")
                return
            
            # Create default tenant first
            tenant_id = str(uuid.uuid4())
            
            # Check if tenant table exists and create tenant
            try:
                tenant_stmt = insert(Tenant).values(
                    tenant_id=tenant_id,
                    name="Default Organization",
                    subdomain="default",
                    settings={},
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                await db.execute(tenant_stmt)
                print(f"✓ Created default tenant: {tenant_id}")
            except Exception as e:
                # Tenant might already exist or table might not exist
                print(f"! Tenant creation skipped: {e}")
                # Use a placeholder tenant ID
                tenant_id = str(uuid.uuid4())
            
            # Create admin user
            admin_password = "Admin123"
            hashed_password = hash_password(admin_password)
            
            # Encrypt sensitive fields
            email = "admin@test.com"
            email_encrypted = encrypt(email)
            email_hash = deterministic_hash(email)
            first_name_encrypted = encrypt("Platform")
            last_name_encrypted = encrypt("Admin")
            
            user_id = str(uuid.uuid4())
            
            stmt = insert(User).values(
                user_id=user_id,
                tenant_id=tenant_id,
                username='admin',
                email_encrypted=email_encrypted,
                dec_hash=email_hash,
                password_hash=hashed_password,
                first_name_encrypted=first_name_encrypted,
                last_name_encrypted=last_name_encrypted,
                employee_id='EMP001',
                role='admin',
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.utcnow(),
                mfa_enabled=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            await db.execute(stmt)
            await db.commit()
            
            print("\n" + "=" * 50)
            print("✓ Admin user created successfully!")
            print("=" * 50)
            print(f"  Username: admin")
            print(f"  Email:    admin@test.com")
            print(f"  Password: Admin123")
            print(f"  Role:     admin")
            print("=" * 50)
            print("\nYou can now login at http://localhost:3000/login")
            print()
            
            # Create coder user as well
            coder_password = "Coder123"
            coder_hashed = hash_password(coder_password)
            coder_email = "coder@test.com"
            coder_email_encrypted = encrypt(coder_email)
            coder_email_hash = deterministic_hash(coder_email)
            coder_first_name = encrypt("Test")
            coder_last_name = encrypt("Coder")
            
            coder_stmt = insert(User).values(
                user_id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                username='coder1',
                email_encrypted=coder_email_encrypted,
                dec_hash=coder_email_hash,
                password_hash=coder_hashed,
                first_name_encrypted=coder_first_name,
                last_name_encrypted=coder_last_name,
                employee_id='EMP002',
                role='coder',
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.utcnow(),
                mfa_enabled=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            await db.execute(coder_stmt)
            await db.commit()
            
            print("✓ Coder user created: coder1 / Coder123")
            
        except Exception as e:
            print(f"✗ Error creating admin: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()


if __name__ == "__main__":
    print("\n🔧 Seeding admin user...\n")
    asyncio.run(seed_admin())

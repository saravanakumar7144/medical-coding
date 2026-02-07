"""
Seed script for Panaceon database
Creates sample tenant and users for all roles
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
from datetime import datetime, timezone
import uuid

from medical_coding_ai.utils.db import get_async_session_context
from medical_coding_ai.models.tenant_models import Tenant
from medical_coding_ai.models.user_models import User
from medical_coding_ai.utils.crypto import encrypt, deterministic_hash


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly."""
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')


async def clear_existing_data(db: AsyncSession):
    """Clear existing users and tenants (for development only)"""
    print("\n🗑️  Clearing existing data...")

    try:
        # Delete users first (foreign key constraint)
        await db.execute(delete(User))
        # Delete tenants
        await db.execute(delete(Tenant))
        await db.commit()
        print("✓ Existing data cleared")
    except Exception as e:
        print(f"⚠️  Warning: Could not clear existing data: {e}")
        await db.rollback()


async def create_tenant(db: AsyncSession) -> str:
    """Create default tenant (organization)"""
    print("\n🏢 Creating default tenant...")

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

    print(f"✓ Tenant created: Panaceon Healthcare (ID: {tenant_id[:8]}...)")
    return tenant_id


async def create_user(db: AsyncSession, tenant_id: str, user_data: dict) -> str:
    """Create a single user"""

    # Hash password
    password_hash = hash_password(user_data['password'])

    # Encrypt sensitive fields
    email_encrypted = encrypt(user_data['email'])
    dec_hash = deterministic_hash(user_data['email'])
    first_name_encrypted = encrypt(user_data['first_name'])
    last_name_encrypted = encrypt(user_data['last_name'])
    phone_encrypted = encrypt(user_data.get('phone', '')) if user_data.get('phone') else None

    # Use offset-naive datetime for database
    now = datetime.now()

    stmt = insert(User).values(
        tenant_id=tenant_id,
        username=user_data['username'],
        email_encrypted=email_encrypted,
        dec_hash=dec_hash,
        password_hash=password_hash,
        first_name_encrypted=first_name_encrypted,
        last_name_encrypted=last_name_encrypted,
        phone_encrypted=phone_encrypted,
        employee_id=user_data.get('employee_id'),
        role=user_data['role'],
        is_active=True,  # Pre-activated for sample data
        email_verified=True,  # Pre-verified for sample data
        email_verified_at=now,
        mfa_enabled=False,  # Disable MFA for sample data
        created_at=now
    ).returning(User.user_id)

    result = await db.execute(stmt)
    await db.commit()
    user_id = result.scalar_one()

    return str(user_id)


async def seed_database():
    """Main seed function"""

    print("=" * 60)
    print("🌱 Panaceon Database Seeding")
    print("=" * 60)

    try:
        async with get_async_session_context() as db:
            # Step 1: Clear existing data (development only)
            await clear_existing_data(db)

            # Step 2: Create tenant
            tenant_id = await create_tenant(db)

            # Step 3: Create users for all roles
            print("\n👥 Creating sample users...")

            users_to_create = [
                {
                    'username': 'admin',
                    'email': 'admin@panaceon.com',
                    'password': 'Admin123',
                    'first_name': 'Platform',
                    'last_name': 'Admin',
                    'employee_id': 'EMP-ADMIN-001',
                    'phone': '+1-555-0001',
                    'role': 'admin'
                },
                {
                    'username': 'coder1',
                    'email': 'coder@panaceon.com',
                    'password': 'Coder123',
                    'first_name': 'Jane',
                    'last_name': 'Doe',
                    'employee_id': 'EMP-CODER-001',
                    'phone': '+1-555-0002',
                    'role': 'coder'
                },
                {
                    'username': 'billing1',
                    'email': 'billing@panaceon.com',
                    'password': 'Billing123',
                    'first_name': 'John',
                    'last_name': 'Smith',
                    'employee_id': 'EMP-BILL-001',
                    'phone': '+1-555-0003',
                    'role': 'billing'
                },
                {
                    'username': 'manager1',
                    'email': 'manager@panaceon.com',
                    'password': 'Manager123',
                    'first_name': 'Emily',
                    'last_name': 'Johnson',
                    'employee_id': 'EMP-MGR-001',
                    'phone': '+1-555-0004',
                    'role': 'manager'
                },
                {
                    'username': 'executive1',
                    'email': 'executive@panaceon.com',
                    'password': 'Executive1',
                    'first_name': 'Michael',
                    'last_name': 'Brown',
                    'employee_id': 'EMP-EXEC-001',
                    'phone': '+1-555-0005',
                    'role': 'executive'
                },
                {
                    'username': 'auditor1',
                    'email': 'auditor@panaceon.com',
                    'password': 'Auditor123',
                    'first_name': 'Sarah',
                    'last_name': 'Davis',
                    'employee_id': 'EMP-AUD-001',
                    'phone': '+1-555-0006',
                    'role': 'auditor'
                }
            ]

            created_users = []
            for user_data in users_to_create:
                user_id = await create_user(db, tenant_id, user_data)
                created_users.append({
                    'user_id': user_id[:8] + '...',
                    'username': user_data['username'],
                    'email': user_data['email'],
                    'password': user_data['password'],
                    'role': user_data['role']
                })
                print(f"  ✓ Created: {user_data['username']} ({user_data['role']})")

            print("\n" + "=" * 60)
            print("✅ Database seeding completed successfully!")
            print("=" * 60)

            # Display credentials table
            print("\n📋 Sample User Credentials:")
            print("-" * 80)
            print(f"{'Role':<15} {'Username':<15} {'Email':<30} {'Password':<15}")
            print("-" * 80)

            for user in created_users:
                print(f"{user['role'].capitalize():<15} {user['username']:<15} {user['email']:<30} {user['password']:<15}")

            print("-" * 80)
            print("\n💡 Tips:")
            print("  1. Login at: http://localhost:3000/login")
            print("  2. Use email OR username to login")
            print("  3. All accounts are pre-activated (no email verification needed)")
            print("  4. Admin can create additional users via the admin panel")
            print("\n✨ You can now start the backend and frontend servers!")
            print("  • Backend: uvicorn main:app --reload --host localhost --port 8000")
            print("  • Frontend: cd Frontend && npm run dev")
            print("\n")

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    print("\n⚠️  WARNING: This will DELETE all existing users and tenants!")
    print("This is intended for development purposes only.\n")

    response = input("Continue? (yes/no): ").strip().lower()

    if response == 'yes':
        asyncio.run(seed_database())
    else:
        print("Seeding cancelled.")

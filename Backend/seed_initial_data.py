
import asyncio
import os
import sys
import bcrypt
from datetime import datetime

# Setup path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from medical_coding_ai.utils.db import AsyncSessionLocal
from medical_coding_ai.models import Tenant, User
from medical_coding_ai.utils.crypto import encrypt, deterministic_hash
from sqlalchemy import select, insert
from sqlalchemy.orm import sessionmaker

def hash_password(password: str) -> str:
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')

async def seed_data():
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        # Define Admin Email
        admin_email = "admin@example.com"
        admin_pass = "admin"
        admin_username = "admin"
        
        # Encrypt email
        email_enc = encrypt(admin_email)
        email_hash = deterministic_hash(admin_email)
        
        # 1. Create Tenant
        tenant_name = "Default Organization"
        q = select(Tenant).where(Tenant.tenant_name == tenant_name)
        res = await session.execute(q)
        tenant = res.scalar_one_or_none()
        
        if not tenant:
            print(f"Creating tenant: {tenant_name}")
            tenant = Tenant(
                tenant_name=tenant_name,
                company_name="Default Organization Inc.",
                enrollment_tier="Enterprise",
                max_users=100,
                max_storage_gb=100,
                contact_email_encrypted=email_enc,
                contact_email_hash=email_hash,
                is_active=True
            )
            session.add(tenant)
            await session.commit()
            print(f"Tenant created with ID: {tenant.tenant_id}")
        else:
            print(f"Tenant '{tenant_name}' already exists.")

        # 2. Create Admin User
        q = select(User).where(User.username == admin_username)
        res = await session.execute(q)
        user = res.scalar_one_or_none()
        
        if not user:
            print(f"Creating user: {admin_username}")
            
            hashed_pass = hash_password(admin_pass)
            first_name_enc = encrypt("System")
            last_name_enc = encrypt("Admin")
            
            user = User(
                tenant_id=tenant.tenant_id,
                username=admin_username,
                email_encrypted=email_enc,
                dec_hash=email_hash,
                password_hash=hashed_pass,
                first_name_encrypted=first_name_enc,
                last_name_encrypted=last_name_enc,
                role='admin',
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.utcnow()
            )
            session.add(user)
            await session.commit()
            print(f"User '{admin_username}' created successfully.")
            print(f"Login with: Username='{admin_username}', Password='{admin_pass}'")
        else:
            print(f"User '{admin_username}' already exists.")

if __name__ == "__main__":
    if not os.path.exists(".env"):
        print("ERROR: .env file missing.")
        sys.exit(1)
        
    try:
        asyncio.run(seed_data())
    except Exception as e:
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()

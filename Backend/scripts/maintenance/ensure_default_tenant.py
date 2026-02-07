"""Ensure a default tenant exists for development/testing"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')

async def ensure_tenant():
    conn = await asyncpg.connect(DATABASE_URL)

    print("Checking for existing tenants...")

    # Check if any tenants exist
    count = await conn.fetchval("SELECT COUNT(*) FROM tenants WHERE is_active = true")

    if count == 0:
        print("No active tenants found. Creating default tenant...")

        # Insert default tenant with minimal required fields
        tenant_id = await conn.fetchval("""
            INSERT INTO tenants (
                tenant_name,
                company_name,
                enrollment_tier,
                is_active,
                max_users,
                max_storage_gb,
                hipaa_compliant,
                data_encryption_enabled
            ) VALUES (
                'Default Organization',
                'Default Organization',
                'enterprise',
                true,
                100,
                1000,
                true,
                true
            )
            ON CONFLICT (tenant_name) DO NOTHING
            RETURNING tenant_id
        """)

        if tenant_id:
            print(f"[OK] Created default tenant with ID: {tenant_id}")
        else:
            print("[INFO] Default tenant already exists")
    else:
        print(f"[OK] Found {count} active tenant(s)")

        # Show existing tenants
        tenants = await conn.fetch("SELECT tenant_id, tenant_name FROM tenants WHERE is_active = true LIMIT 5")
        for t in tenants:
            print(f"  - {t['tenant_name']} ({t['tenant_id']})")

    await conn.close()

asyncio.run(ensure_tenant())

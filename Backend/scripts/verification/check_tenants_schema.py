"""Check existing tenants table schema"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')

async def check_schema():
    conn = await asyncpg.connect(DATABASE_URL)

    print("Checking tenants table schema...")
    print("=" * 60)

    cols = await conn.fetch("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tenants'
        ORDER BY ordinal_position
    """)

    if not cols:
        print("Tenants table does not exist")
    else:
        print(f"Found {len(cols)} columns:")
        print()
        for col in cols:
            print(f"  {col['column_name']:<25} {col['data_type']:<20} NULL: {col['is_nullable']}")

    await conn.close()

asyncio.run(check_schema())

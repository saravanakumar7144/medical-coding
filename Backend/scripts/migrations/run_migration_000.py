"""
Run Migration 000: Fix Missing Tenants Table
This creates the tenants table that should have existed before Phase 8.
"""

import asyncio
import asyncpg
import sys
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("[ERROR] DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix DATABASE_URL if it has SQLAlchemy format (postgresql+asyncpg://)
if '+asyncpg' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    print(f"[INFO] Converted SQLAlchemy URL to asyncpg format")

async def run_migration():
    print("=" * 80)
    print("Phase 0: Fix Missing Tenants Table Migration")
    print("=" * 80)

    try:
        # Connect to database
        print("\n[*] Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("[OK] Connected successfully")

        # Read migration file
        migration_file = Path(__file__).parent / 'migrations' / '000_fix_tenants_table.sql'
        print(f"\n[*] Reading migration file: {migration_file}")

        if not migration_file.exists():
            print(f"[ERROR] Migration file not found: {migration_file}")
            sys.exit(1)

        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()

        print(f"[OK] Migration file loaded ({len(sql)} characters)")

        # Execute migration
        print("\n[*] Executing migration...")
        await conn.execute(sql)
        print("[OK] Migration executed successfully")

        # Verify table was created
        print("\n[*] Verifying tenants table...")
        result = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'tenants'
        """)

        if result == 1:
            print("[OK] Tenants table exists")

            # Count rows
            row_count = await conn.fetchval("SELECT COUNT(*) FROM tenants")
            print(f"[OK] Tenants table has {row_count} row(s)")
        else:
            print("[ERROR] Tenants table not found after migration")
            sys.exit(1)

        # Close connection
        await conn.close()

        print("\n" + "=" * 80)
        print("[SUCCESS] Migration 000 completed successfully!")
        print("=" * 80)
        print("\nNext step: Run Phase 8 migration (python run_migration_006.py)")

    except Exception as e:
        print(f"\n[ERROR] running migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(run_migration())

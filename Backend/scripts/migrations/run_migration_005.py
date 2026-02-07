"""
Run Phase 5.1 Security Monitoring Migration
"""

import asyncio
import asyncpg
import os
from pathlib import Path

async def run_migration():
    # Read DATABASE_URL from .env
    env_path = Path(__file__).parent / '.env'
    database_url = None

    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_url = line.split('=', 1)[1].strip()
                    break

    if not database_url:
        print("ERROR: DATABASE_URL not found in .env file")
        return False

    # Convert SQLAlchemy URL to asyncpg format
    # postgresql+asyncpg://admin:vicky111@localhost:7080/multitenant_db
    # -> postgresql://admin:vicky111@localhost:7080/multitenant_db
    if '+asyncpg://' in database_url:
        database_url = database_url.replace('+asyncpg://', '://')

    print(f"Connecting to database...")

    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)

        # Read migration file
        migration_path = Path(__file__).parent / 'migrations' / '005_phase5_security_monitoring.sql'

        if not migration_path.exists():
            print(f"ERROR: Migration file not found: {migration_path}")
            return False

        print(f"Reading migration file: {migration_path}")

        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()

        print("Executing migration...")

        # Execute migration
        await conn.execute(migration_sql)

        print("✅ Phase 5.1 migration completed successfully!")
        print("\nCreated tables:")
        print("  - security_events")
        print("  - login_attempts")
        print("\nCreated views:")
        print("  - failed_login_summary")
        print("  - security_event_summary")
        print("\nCreated functions:")
        print("  - log_failed_login_trigger()")
        print("  - detect_brute_force_trigger()")

        await conn.close()
        return True

    except Exception as e:
        print(f"❌ ERROR running migration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(run_migration())
    exit(0 if success else 1)

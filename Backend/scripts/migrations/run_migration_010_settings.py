"""
Migration 010: Create Settings Tables
Runs the SQL migration to create tenant_ai_settings, tenant_security_settings, and backup_records tables
"""

import asyncio
import sys
import os
from pathlib import Path

# Add Backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from medical_coding_ai.utils.db import DATABASE_URL


async def run_migration():
    """Run the migration SQL script"""
    print("=" * 70)
    print("Migration 010: Creating Settings Tables")
    print("=" * 70)

    # Get database URL
    database_url = DATABASE_URL
    print(f"\nConnecting to database...")
    print(f"Database URL: {database_url.split('@')[1] if '@' in database_url else 'Unknown'}")

    # Create engine
    engine = create_async_engine(database_url, echo=True)

    # Read SQL file
    sql_file = Path(__file__).parent.parent.parent.parent / "database" / "migrations" / "migration_010_settings_tables.sql"
    print(f"\nReading SQL from: {sql_file}")

    with open(sql_file, 'r') as f:
        sql_content = f.read()

    # Execute migration
    async with engine.begin() as conn:
        print("\nExecuting migration...")
        await conn.execute(text(sql_content))
        print("\n✓ Migration completed successfully!")

    await engine.dispose()

    # Verify tables were created
    async with engine.connect() as conn:
        print("\nVerifying tables...")

        result = await conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('tenant_ai_settings', 'tenant_security_settings', 'backup_records')
            ORDER BY table_name
        """))

        tables = result.fetchall()
        if len(tables) == 3:
            print("✓ All 3 tables created successfully:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print(f"⚠ Warning: Expected 3 tables, found {len(tables)}")

    await engine.dispose()

    print("\n" + "=" * 70)
    print("Migration 010 Complete")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_migration())

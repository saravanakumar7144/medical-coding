"""
Drop Phase 8 Tables
Safely drops all Phase 8 tables to allow clean re-migration
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')

async def drop_tables():
    conn = await asyncpg.connect(DATABASE_URL)

    print("=" * 80)
    print("Drop Phase 8 Tables")
    print("=" * 80)

    # Tables in reverse dependency order (children first)
    phase8_tables = [
        'era_line_items',
        'remittance_advice',
        'claim_notes',
        'clearinghouse_transactions',
        'claim_denials',
        'claim_line_items',
        'claims',
        'encounter_procedures',
        'encounter_diagnoses',
        'encounters',
        'patient_insurance',
        'insurance_payers',
        'patients'
    ]

    print("\n⚠ WARNING: This will delete all Phase 8 data!")
    print("   Press Ctrl+C within 5 seconds to cancel...\n")

    try:
        await asyncio.sleep(5)
    except KeyboardInterrupt:
        print("\n[CANCELLED] No tables were dropped")
        await conn.close()
        return

    print("\n[*] Dropping Phase 8 tables...")

    for table in phase8_tables:
        try:
            await conn.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
            print(f"  ✓ Dropped {table}")
        except Exception as e:
            print(f"  ✗ Error dropping {table}: {e}")

    # Drop views
    views = ['vw_claim_summary', 'vw_denial_analysis', 'vw_revenue_cycle_metrics']
    print("\n[*] Dropping Phase 8 views...")
    for view in views:
        try:
            await conn.execute(f"DROP VIEW IF EXISTS {view} CASCADE")
            print(f"  ✓ Dropped {view}")
        except Exception as e:
            print(f"  ✗ Error dropping {view}: {e}")

    # Drop functions
    functions = [
        'update_timestamp()',
        'auto_create_claim_on_encounter_completion()'
    ]
    print("\n[*] Dropping Phase 8 functions...")
    for func in functions:
        try:
            await conn.execute(f"DROP FUNCTION IF EXISTS {func} CASCADE")
            print(f"  ✓ Dropped {func}")
        except Exception as e:
            print(f"  ✗ Error dropping {func}: {e}")

    await conn.close()

    print("\n" + "=" * 80)
    print("✓ Phase 8 cleanup complete!")
    print("=" * 80)
    print("\nNext step: Run Phase 8 migration")
    print("  python run_migration_006.py")

asyncio.run(drop_tables())

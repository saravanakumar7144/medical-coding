"""
Check Phase 8 Database Status
Checks which Phase 8 tables/indexes exist
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')

async def check_status():
    conn = await asyncpg.connect(DATABASE_URL)

    print("=" * 80)
    print("Phase 8 Database Status Check")
    print("=" * 80)

    # Check for Phase 8 tables
    phase8_tables = [
        'patients', 'insurance_payers', 'patient_insurance',
        'encounters', 'encounter_diagnoses', 'encounter_procedures',
        'claims', 'claim_line_items', 'claim_denials',
        'clearinghouse_transactions', 'claim_notes',
        'remittance_advice', 'era_line_items'
    ]

    print("\n[*] Checking Phase 8 tables...")
    existing_tables = []
    for table in phase8_tables:
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            )
        """, table)
        status = "✓ EXISTS" if exists else "✗ MISSING"
        print(f"  {status:12} {table}")
        if exists:
            existing_tables.append(table)

    # Check for indexes
    print("\n[*] Checking sample indexes...")
    sample_indexes = ['idx_patients_tenant', 'idx_encounters_patient', 'idx_claims_patient']
    for idx in sample_indexes:
        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM pg_indexes
                WHERE indexname = $1
            )
        """, idx)
        status = "✓ EXISTS" if exists else "✗ MISSING"
        print(f"  {status:12} {idx}")

    await conn.close()

    print("\n" + "=" * 80)
    print(f"Summary: {len(existing_tables)}/{len(phase8_tables)} Phase 8 tables exist")
    print("=" * 80)

    if len(existing_tables) > 0 and len(existing_tables) < len(phase8_tables):
        print("\n⚠ WARNING: Partial migration detected!")
        print("   Some Phase 8 tables exist but not all.")
        print("\nOptions:")
        print("  1. Drop existing Phase 8 tables and re-run clean migration")
        print("     python drop_phase8_tables.py")
        print("     python run_migration_006.py")
        print("\n  2. Skip creation of existing objects (migration should handle this)")
        print("     python run_migration_006.py")
    elif len(existing_tables) == len(phase8_tables):
        print("\n✓ All Phase 8 tables exist - migration already complete!")
    else:
        print("\n✓ No Phase 8 tables found - ready for clean migration")

asyncio.run(check_status())

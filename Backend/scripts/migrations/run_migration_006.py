"""
Run Phase 8 EHR/Claims Integration Migration
"""

import asyncio
import asyncpg
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
    if '+asyncpg://' in database_url:
        database_url = database_url.replace('+asyncpg://', '://')

    print(f"Connecting to database...")

    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)

        # Read migration file
        migration_path = Path(__file__).parent / 'migrations' / '006_phase8_ehr_claims_integration.sql'

        if not migration_path.exists():
            print(f"ERROR: Migration file not found: {migration_path}")
            return False

        print(f"Reading migration file: {migration_path}")

        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()

        print("Executing migration (this may take a minute)...")

        # Execute migration
        await conn.execute(migration_sql)

        print("Phase 8 EHR/Claims Integration migration completed successfully!")
        print("\nCreated 16 tables:")
        print("  - patients")
        print("  - insurance_payers")
        print("  - patient_insurance")
        print("  - encounters")
        print("  - encounter_diagnoses")
        print("  - encounter_procedures")
        print("  - claims")
        print("  - claim_line_items")
        print("  - claim_denials")
        print("  - clearinghouse_transactions")
        print("  - claim_notes")
        print("  - remittance_advice")
        print("  - era_line_items")
        print("\nCreated 3 views:")
        print("  - vw_claim_summary")
        print("  - vw_denial_analysis")
        print("  - vw_revenue_cycle_metrics")
        print("\nCreated triggers and functions for automation")
        print("\nInserted 5 sample insurance payers")

        await conn.close()
        return True

    except Exception as e:
        print(f"ERROR running migration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(run_migration())
    exit(0 if success else 1)

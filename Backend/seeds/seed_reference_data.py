"""
Reference Data Seeder

Seeds the database with common ICD-10 and CPT codes for development and testing.

Usage:
    python seed_reference_data.py

Requires:
    - DATABASE_URL environment variable set
    - Database tables created (run migrations first)
"""

import os
import sys
import csv
import asyncio
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text


async def seed_icd10_codes(session: AsyncSession, csv_path: str):
    """Seed ICD-10 codes from CSV file."""
    print(f"Seeding ICD-10 codes from {csv_path}...")

    count = 0
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            is_billable = row['is_billable'].upper() == 'TRUE'

            await session.execute(
                text("""
                    INSERT INTO icd10_codes (code, description, is_billable, category)
                    VALUES (:code, :description, :is_billable, :category)
                    ON CONFLICT (code) DO UPDATE SET
                        description = EXCLUDED.description,
                        is_billable = EXCLUDED.is_billable,
                        category = EXCLUDED.category
                """),
                {
                    'code': row['code'],
                    'description': row['description'],
                    'is_billable': is_billable,
                    'category': row['category']
                }
            )
            count += 1

    await session.commit()
    print(f"  Seeded {count} ICD-10 codes")
    return count


async def seed_cpt_codes(session: AsyncSession, csv_path: str):
    """Seed CPT codes from CSV file."""
    print(f"Seeding CPT codes from {csv_path}...")

    count = 0
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rvu_work = float(row['rvu_work']) if row['rvu_work'] else None
            rvu_facility = float(row['rvu_facility']) if row['rvu_facility'] else None

            # Determine code type: CPT for numeric codes, HCPCS for alpha codes
            code = row['code'].strip()
            code_type = 'HCPCS' if code[0].isalpha() else 'CPT'

            await session.execute(
                text("""
                    INSERT INTO cpt_codes (code, description, code_type, category, rvu_work, rvu_facility)
                    VALUES (:code, :description, :code_type, :category, :rvu_work, :rvu_facility)
                    ON CONFLICT (code) DO UPDATE SET
                        description = EXCLUDED.description,
                        code_type = EXCLUDED.code_type,
                        category = EXCLUDED.category,
                        rvu_work = EXCLUDED.rvu_work,
                        rvu_facility = EXCLUDED.rvu_facility
                """),
                {
                    'code': code,
                    'description': row['description'],
                    'code_type': code_type,
                    'category': row['category'],
                    'rvu_work': rvu_work,
                    'rvu_facility': rvu_facility
                }
            )
            count += 1

    await session.commit()
    print(f"  Seeded {count} CPT codes")
    return count


async def seed_sample_ehr_connection(session: AsyncSession, tenant_id: str):
    """Seed a sample EHR connection for testing."""
    import uuid

    print("Seeding sample EHR connection...")

    connection_id = str(uuid.uuid4())

    await session.execute(
        text("""
            INSERT INTO ehr_connections (
                connection_id, tenant_id, ehr_type, organization_name,
                base_url, poll_interval_seconds, is_active, use_mock_data
            )
            VALUES (
                :connection_id, :tenant_id, 'epic', 'Test Epic Organization',
                'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
                30, true, true
            )
            ON CONFLICT DO NOTHING
        """),
        {
            'connection_id': connection_id,
            'tenant_id': tenant_id
        }
    )

    await session.commit()
    print(f"  Created sample EHR connection: {connection_id}")
    return connection_id


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("Panaceon Reference Data Seeder")
    print("=" * 60)

    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    AsyncSessionLocal = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    # Get paths to CSV files
    seeds_dir = Path(__file__).parent
    icd10_csv = seeds_dir / 'icd10_common.csv'
    cpt_csv = seeds_dir / 'cpt_common.csv'

    # Check files exist
    if not icd10_csv.exists():
        print(f"ERROR: {icd10_csv} not found")
        sys.exit(1)
    if not cpt_csv.exists():
        print(f"ERROR: {cpt_csv} not found")
        sys.exit(1)

    # Seed data
    async with AsyncSessionLocal() as session:
        try:
            icd10_count = await seed_icd10_codes(session, str(icd10_csv))
            cpt_count = await seed_cpt_codes(session, str(cpt_csv))

            print()
            print("=" * 60)
            print("Seeding complete!")
            print(f"  - ICD-10 codes: {icd10_count}")
            print(f"  - CPT codes: {cpt_count}")
            print("=" * 60)

        except Exception as e:
            print(f"ERROR: {e}")
            await session.rollback()
            raise


if __name__ == '__main__':
    asyncio.run(main())

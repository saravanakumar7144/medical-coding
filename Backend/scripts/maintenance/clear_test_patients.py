"""
Clear all test patient data with old encryption format
"""
import asyncio
from medical_coding_ai.utils.db import AsyncSessionLocal
from sqlalchemy import text

async def clear_patients():
    print("=" * 80)
    print("Clearing Test Patient Data")
    print("=" * 80)

    async with AsyncSessionLocal() as session:
        try:
            # Delete all patients (cascades to related records)
            result = await session.execute(text("DELETE FROM patients"))
            count = result.rowcount
            await session.commit()

            print(f"\n[OK] Deleted {count} patient records")

            # Verify
            result = await session.execute(text("SELECT COUNT(*) FROM patients"))
            remaining = result.scalar()

            print(f"[OK] Remaining patients: {remaining}")

            if remaining == 0:
                print("\n[SUCCESS] Database cleaned successfully!")
                print("\nYou can now test patient creation:")
                print("  - Frontend: http://localhost:5173/patients")
                print("  - Or run: python test_patient_creation.py")
            else:
                print(f"\n[WARNING] {remaining} patients still remain")

        except Exception as e:
            print(f"\n[ERROR] {e}")
            await session.rollback()

    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(clear_patients())

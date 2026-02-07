
import asyncio
import os
import sys
from sqlalchemy import text

# Ensure backend dir is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from medical_coding_ai.utils.db import AsyncSessionLocal

async def check():
    print("Checking tables...")
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(text("SELECT count(*) FROM icd10_codes"))
            print("SUCCESS: Table 'icd10_codes' exists and is readable.")
        except Exception as e:
            print(f"FAIL: Error accessing 'icd10_codes': {e}")

        try:
            await session.execute(text("SELECT count(*) FROM users"))
            print("SUCCESS: Table 'users' exists and is readable.")
        except Exception as e:
            print(f"FAIL: Error accessing 'users': {e}")

if __name__ == "__main__":
    try:
        asyncio.run(check())
    except Exception as e:
        print(f"Error: {e}")

import asyncio
import sys
sys.path.insert(0, '.')
from medical_coding_ai.utils.db import get_async_session_context
from medical_coding_ai.models.user_models import User
from sqlalchemy import select, text

async def check_user():
    async with get_async_session_context() as session:
        # Raw SQL query to see what's actually in the database
        res = await session.execute(text("SELECT username, password_hash FROM users WHERE username = 'admin'"))
        row = res.fetchone()
        if row:
            username, password_hash = row
            print(f'Username: {username}')
            print(f'Password Hash: "{password_hash}"')
            print(f'Hash Length: {len(password_hash)}')
            print(f'Hash Type: {type(password_hash).__name__}')
            print(f'Hash repr: {repr(password_hash)}')
        else:
            print('No admin user found')

asyncio.run(check_user())

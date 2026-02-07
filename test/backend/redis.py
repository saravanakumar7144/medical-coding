import asyncio
from redis import asyncio as aioredis

async def test_redis():
    try:
        redis = await aioredis.from_url("redis://localhost:6379", decode_responses=True)
        await redis.ping()
        print("✅ Redis connection successful!")

        # Test set/get
        await redis.set("test_key", "test_value")
        value = await redis.get("test_key")
        print(f"✅ Redis read/write working: {value}")

        await redis.close()
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")

asyncio.run(test_redis())

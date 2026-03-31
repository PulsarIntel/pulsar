import json

import redis.asyncio as redis

from finance.core.config import settings

_pool: redis.Redis | None = None

def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            retry_on_timeout=True,
            socket_timeout=5,
            socket_connect_timeout=5,
            health_check_interval=30,
        )
    return _pool

async def close_redis() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None

async def get_cached(key: str) -> dict | list | None:
    r = get_redis()
    val = await r.get(key)
    if val is None:
        return None
    return json.loads(val)

async def set_cached(key: str, data: dict | list, ttl: int = 60) -> None:
    r = get_redis()
    await r.set(key, json.dumps(data), ex=ttl)

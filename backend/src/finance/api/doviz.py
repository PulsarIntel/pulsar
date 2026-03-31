import json
import logging

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends

from finance.api.ratelimit import realtime_limiter
from finance.core.config import settings
from finance.services.providers.doviz_provider import (
    DOVIZ_CATEGORY_LABELS,
    DOVIZ_SYMBOLS,
    REDIS_KEY,
)

logger = logging.getLogger("finance.api.doviz")

router = APIRouter(prefix="/doviz", tags=["doviz"], dependencies=[Depends(realtime_limiter)])

async def _get_redis() -> aioredis.Redis:
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )

@router.get("/quotes")
async def doviz_quotes(category: str | None = None):
    try:
        r = await _get_redis()
        raw = await r.hgetall(REDIS_KEY)
        await r.aclose()
        result = {k: json.loads(v) for k, v in raw.items()}
        if category:
            cats = set(category.split(","))
            result = {k: v for k, v in result.items() if v.get("category") in cats}
        return result
    except Exception:
        logger.exception("Failed to fetch doviz quotes")
        return {}

@router.get("/quotes/{symbol}")
async def doviz_quote(symbol: str):
    try:
        r = await _get_redis()
        raw = await r.hget(REDIS_KEY, symbol)
        await r.aclose()
        if raw:
            return json.loads(raw)
        return {"error": "Symbol not found"}
    except Exception:
        logger.exception("Failed to fetch doviz quote for %s", symbol)
        return {"error": "Internal error"}

@router.get("/symbols")
async def doviz_symbols():
    return {
        "symbols": {
            k: {**v, "category_label": DOVIZ_CATEGORY_LABELS.get(v["category"], v["category"])}
            for k, v in DOVIZ_SYMBOLS.items()
        },
        "categories": DOVIZ_CATEGORY_LABELS,
    }

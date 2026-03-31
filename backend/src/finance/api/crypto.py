import json
import logging
from datetime import datetime, timedelta, timezone

import httpx
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query

from finance.api.ratelimit import realtime_limiter
from finance.core.config import settings
from finance.services.providers.crypto_provider import (
    CRYPTO_SYMBOLS,
    REDIS_KEY,
)

logger = logging.getLogger("finance.api.crypto")

router = APIRouter(prefix="/crypto", tags=["crypto"], dependencies=[Depends(realtime_limiter)])

async def _get_redis() -> aioredis.Redis:
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )

@router.get("/quotes")
async def crypto_quotes():
    try:
        r = await _get_redis()
        raw = await r.hgetall(REDIS_KEY)
        await r.aclose()
        return {k: json.loads(v) for k, v in raw.items()}
    except Exception:
        logger.exception("Failed to fetch crypto quotes")
        return {}

@router.get("/quotes/{symbol:path}")
async def crypto_quote(symbol: str):
    try:
        r = await _get_redis()
        raw = await r.hget(REDIS_KEY, symbol)
        await r.aclose()
        if raw:
            return json.loads(raw)
        return {"error": "Symbol not found"}
    except Exception:
        logger.exception("Failed to fetch crypto quote for %s", symbol)
        return {"error": "Internal error"}

@router.get("/symbols")
async def crypto_symbols():
    return {
        "symbols": {m["ticker"]: m for m in CRYPTO_SYMBOLS.values()},
        "categories": {"crypto": "Cryptocurrency"},
    }

_TICKER_TO_BINANCE = {v["ticker"]: k for k, v in CRYPTO_SYMBOLS.items()}

@router.get("/bars/{symbol:path}")
async def crypto_bars(
    symbol: str,
    timeframe: str = Query(default="1d", description="Binance kline interval (1m, 5m, 1h, 1d)"),
    start: str | None = Query(default=None, description="Start date ISO format"),
    end: str | None = Query(default=None, description="End date ISO format"),
    limit: int = Query(default=100, ge=1, le=1000),
):
    binance_symbol = _TICKER_TO_BINANCE.get(symbol)
    if not binance_symbol:
        return {"error": f"Unknown symbol: {symbol}"}

    params: dict = {
        "symbol": binance_symbol,
        "interval": timeframe,
        "limit": limit,
    }
    if start:
        params["startTime"] = int(datetime.fromisoformat(start.replace("Z", "+00:00")).timestamp() * 1000)
    if end:
        params["endTime"] = int(datetime.fromisoformat(end.replace("Z", "+00:00")).timestamp() * 1000)

    url = f"{settings.BINANCE_API_URL}/api/v3/klines"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            raw = resp.json()
            bars = [
                {
                    "t": k[0],
                    "o": float(k[1]),
                    "h": float(k[2]),
                    "l": float(k[3]),
                    "c": float(k[4]),
                    "v": float(k[5]),
                }
                for k in raw
            ]
            return {"bars": {symbol: bars}}
    except httpx.HTTPStatusError as e:
        logger.error("Binance klines HTTP error: %s %s", e.response.status_code, e.response.text)
        return {"error": f"Binance API error: {e.response.status_code}"}
    except Exception:
        logger.exception("Failed to fetch crypto bars for %s", symbol)
        return {"error": "Internal error"}

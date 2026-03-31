import asyncio
import json
import logging
import time

import redis.asyncio as aioredis
import websockets

from finance.core.config import settings
from finance.services.providers.base import MarketDataProvider

logger = logging.getLogger("finance.crypto")

PUBSUB_CHANNEL = "quotes:crypto"
REDIS_KEY = "crypto:quotes"
THROTTLE_INTERVAL = 0.3
REDIS_COOLDOWN_SECS = 10

CRYPTO_SYMBOLS: dict[str, dict] = {
    "BTCUSDT": {"name": "Bitcoin", "symbol": "BTC", "ticker": "BTC/USD"},
    "ETHUSDT": {"name": "Ethereum", "symbol": "ETH", "ticker": "ETH/USD"},
    "SOLUSDT": {"name": "Solana", "symbol": "SOL", "ticker": "SOL/USD"},
    "DOGEUSDT": {"name": "Dogecoin", "symbol": "DOGE", "ticker": "DOGE/USD"},
    "XRPUSDT": {"name": "XRP", "symbol": "XRP", "ticker": "XRP/USD"},
    "ADAUSDT": {"name": "Cardano", "symbol": "ADA", "ticker": "ADA/USD"},
    "AVAXUSDT": {"name": "Avalanche", "symbol": "AVAX", "ticker": "AVAX/USD"},
    "DOTUSDT": {"name": "Polkadot", "symbol": "DOT", "ticker": "DOT/USD"},
    "LINKUSDT": {"name": "Chainlink", "symbol": "LINK", "ticker": "LINK/USD"},
    "MATICUSDT": {"name": "Polygon", "symbol": "MATIC", "ticker": "MATIC/USD"},
    "UNIUSDT": {"name": "Uniswap", "symbol": "UNI", "ticker": "UNI/USD"},
    "LTCUSDT": {"name": "Litecoin", "symbol": "LTC", "ticker": "LTC/USD"},
    "SHIBUSDT": {"name": "Shiba Inu", "symbol": "SHIB", "ticker": "SHIB/USD"},
    "ATOMUSDT": {"name": "Cosmos", "symbol": "ATOM", "ticker": "ATOM/USD"},
    "BCHUSDT": {"name": "Bitcoin Cash", "symbol": "BCH", "ticker": "BCH/USD"},
}

_BINANCE_LOOKUP = {k.lower(): v for k, v in CRYPTO_SYMBOLS.items()}

def _normalize_ticker(msg: dict) -> dict | None:
    binance_symbol = msg.get("s", "").lower()
    key = binance_symbol.upper()
    meta = CRYPTO_SYMBOLS.get(key)
    if meta is None:
        return None

    price = float(msg.get("c", 0))
    open_price = float(msg.get("o", 0))
    change = price - open_price
    change_pct = (change / open_price * 100) if open_price else 0

    return {
        "type": "crypto_quote",
        "provider": "binance",
        "exchange": "binance",
        "ticker": meta["ticker"],
        "name": meta["name"],
        "symbol": meta["symbol"],
        "category": "crypto",
        "price": price,
        "bid": 0,
        "ask": 0,
        "high": float(msg.get("h", 0)),
        "low": float(msg.get("l", 0)),
        "change": round(change, 8),
        "changePercent": round(change_pct, 4),
        "volume": float(msg.get("v", 0)),
        "timestamp": msg.get("E", ""),
    }

class CryptoProvider(MarketDataProvider):
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._redis: aioredis.Redis | None = None
        self._redis_cooldown_until: float = 0
        self._pending: dict[str, dict] = {}
        self._flush_task: asyncio.Task | None = None

    @property
    def name(self) -> str:
        return "crypto"

    @property
    def pubsub_channel(self) -> str:
        return PUBSUB_CHANNEL

    @property
    def symbols(self) -> list[str]:
        return [m["ticker"] for m in CRYPTO_SYMBOLS.values()]

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._task = loop.create_task(self._run())
        self._flush_task = loop.create_task(self._flush_loop())

    async def stop(self) -> None:
        if self._flush_task:
            self._flush_task.cancel()
        if self._task:
            self._task.cancel()
        if self._redis:
            await self._redis.aclose()
            self._redis = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                retry_on_timeout=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                health_check_interval=30,
                single_connection_client=True,
            )
        return self._redis

    async def _publish(self, data: dict) -> None:
        if time.monotonic() < self._redis_cooldown_until:
            return
        try:
            r = await self._get_redis()
            pipe = r.pipeline()
            pipe.publish(PUBSUB_CHANNEL, json.dumps(data))
            pipe.hset(REDIS_KEY, data["ticker"], json.dumps(data))
            await pipe.execute()
        except Exception as e:
            self._redis_cooldown_until = time.monotonic() + REDIS_COOLDOWN_SECS
            logger.warning("Redis publish failed, cooling down: %s", e)
            try:
                if self._redis:
                    await self._redis.aclose()
            except Exception:
                pass
            self._redis = None

    async def _flush_loop(self) -> None:
        while True:
            await asyncio.sleep(THROTTLE_INTERVAL)
            if not self._pending:
                continue
            batch = dict(self._pending)
            self._pending.clear()
            for data in batch.values():
                await self._publish(data)

    async def _run(self) -> None:
        backoff = 1
        max_backoff = 60

        streams = [f"{s.lower()}@miniTicker" for s in CRYPTO_SYMBOLS]
        stream_path = "/".join(streams)
        ws_url = f"{settings.CRYPTO_WS_URL}/stream?streams={stream_path}"

        while True:
            try:
                async with websockets.connect(
                    ws_url,
                    ping_interval=30,
                    close_timeout=5,
                ) as ws:
                    logger.info(
                        "Connected to Binance WebSocket (%d symbols)",
                        len(CRYPTO_SYMBOLS),
                    )
                    backoff = 1

                    async for raw in ws:
                        try:
                            msg = json.loads(raw)
                            data = msg.get("data", msg)
                            normalized = _normalize_ticker(data)
                            if normalized:
                                self._pending[normalized["ticker"]] = normalized
                        except json.JSONDecodeError:
                            continue

            except asyncio.CancelledError:
                logger.info("Crypto provider task cancelled")
                break
            except Exception:
                logger.exception(
                    "Binance WebSocket error, reconnecting in %ds", backoff
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, max_backoff)

import asyncio
import json
import logging
import time
import threading
from typing import Optional

import redis.asyncio as aioredis
from alpaca.data.enums import DataFeed
from alpaca.data.live.stock import StockDataStream

from finance.core.config import settings

logger = logging.getLogger("finance.stream")

PUBSUB_CHANNEL = "quotes:realtime"

_stream: Optional[StockDataStream] = None
_thread: Optional[threading.Thread] = None
_redis_pool: Optional[aioredis.Redis] = None
_main_loop: Optional[asyncio.AbstractEventLoop] = None
_redis_cooldown_until: float = 0
_redis_reconnecting: bool = False

REDIS_COOLDOWN_SECS = 10
THROTTLE_INTERVAL = 0.3

_pending_trades: dict[str, dict] = {}
_pending_quotes: dict[str, dict] = {}
_flush_task: Optional[asyncio.Task] = None

def _get_feed() -> DataFeed:
    return DataFeed.SIP if settings.ALPACA_FEED == "sip" else DataFeed.IEX

async def _flush_pending() -> None:
    while True:
        await asyncio.sleep(THROTTLE_INTERVAL)
        if not _pending_trades and not _pending_quotes:
            continue

        trades = dict(_pending_trades)
        quotes = dict(_pending_quotes)
        _pending_trades.clear()
        _pending_quotes.clear()

        for data in trades.values():
            await _async_publish(PUBSUB_CHANNEL, data)
        for data in quotes.values():
            await _async_publish(PUBSUB_CHANNEL, data)

def _ensure_flush_task() -> None:
    global _flush_task
    if _main_loop is None or _main_loop.is_closed():
        return
    if _flush_task is None or _flush_task.done():
        _flush_task = asyncio.run_coroutine_threadsafe(
            _flush_pending(), _main_loop
        )

def _enqueue_trade(channel: str, data: dict) -> None:
    _pending_trades[data["ticker"]] = data
    _ensure_flush_task()

def _enqueue_quote(channel: str, data: dict) -> None:
    _pending_quotes[data["ticker"]] = data
    _ensure_flush_task()

def _publish_immediate(channel: str, data: dict) -> None:
    if _main_loop is None or _main_loop.is_closed():
        return
    if time.monotonic() < _redis_cooldown_until:
        return
    asyncio.run_coroutine_threadsafe(_async_publish(channel, data), _main_loop)

async def _async_publish(channel: str, data: dict) -> None:
    global _redis_pool, _redis_cooldown_until, _redis_reconnecting

    if time.monotonic() < _redis_cooldown_until:
        return

    if _redis_reconnecting:
        return

    try:
        if _redis_pool is None:
            _redis_reconnecting = True
            _redis_pool = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                retry_on_timeout=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                health_check_interval=30,
                single_connection_client=True,
            )
            _redis_reconnecting = False
        await _redis_pool.publish(channel, json.dumps(data))
    except Exception as e:
        _redis_reconnecting = False
        _redis_cooldown_until = time.monotonic() + REDIS_COOLDOWN_SECS
        logger.warning("Redis publish failed, cooling down %ds: %s", REDIS_COOLDOWN_SECS, e)
        try:
            if _redis_pool:
                await _redis_pool.aclose()
        except Exception:
            pass
        _redis_pool = None

async def _on_trade(trade) -> None:
    _enqueue_trade(PUBSUB_CHANNEL, {
        "type": "trade",
        "ticker": trade.symbol,
        "price": float(trade.price),
        "size": trade.size,
        "timestamp": trade.timestamp.isoformat(),
    })

async def _on_quote(quote) -> None:
    _enqueue_quote(PUBSUB_CHANNEL, {
        "type": "quote",
        "ticker": quote.symbol,
        "bidPrice": float(quote.bid_price),
        "askPrice": float(quote.ask_price),
        "bidSize": quote.bid_size,
        "askSize": quote.ask_size,
        "timestamp": quote.timestamp.isoformat(),
    })

async def _on_bar(bar) -> None:
    _publish_immediate(PUBSUB_CHANNEL, {
        "type": "bar",
        "ticker": bar.symbol,
        "open": float(bar.open),
        "high": float(bar.high),
        "low": float(bar.low),
        "close": float(bar.close),
        "volume": bar.volume,
        "timestamp": bar.timestamp.isoformat(),
    })

def _run_stream_thread() -> None:
    import time

    global _stream
    backoff = 1
    max_backoff = 60

    while True:
        try:
            _stream = StockDataStream(
                api_key=settings.ALPACA_API_KEY,
                secret_key=settings.ALPACA_API_SECRET,
                feed=_get_feed(),
                raw_data=False,
            )
            _stream.subscribe_trades(_on_trade, *_initial_symbols)
            _stream.subscribe_quotes(_on_quote, *_initial_symbols)
            _stream.subscribe_bars(_on_bar, *_initial_symbols)
            logger.info("Stream thread: subscribing to %d symbols", len(_initial_symbols))
            backoff = 1
            _stream.run()
        except Exception:
            logger.exception("Stream thread crashed, reconnecting in %ds", backoff)
            try:
                if _stream:
                    _stream.close()
            except Exception:
                pass
            _stream = None
            time.sleep(backoff)
            backoff = min(backoff * 2, max_backoff)

_initial_symbols: list[str] = []

def start(symbols: list[str] | None = None) -> None:
    global _thread, _main_loop, _initial_symbols
    if _thread is not None and _thread.is_alive():
        return

    _main_loop = asyncio.get_event_loop()
    _initial_symbols = symbols or []

    _thread = threading.Thread(target=_run_stream_thread, daemon=True)
    _thread.start()
    logger.info("Alpaca SIP stream started in thread (feed=%s, %d symbols)", settings.ALPACA_FEED, len(_initial_symbols))

async def stop() -> None:
    global _stream, _thread, _redis_pool, _flush_task
    if _flush_task and not _flush_task.done():
        _flush_task.cancel()
    _flush_task = None
    if _stream:
        try:
            _stream.stop()
        except Exception:
            pass
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None
    _stream = None
    _thread = None
    logger.info("Alpaca stream stopped")

def subscribe(symbols: list[str]) -> None:
    if not _stream or not _thread or not _thread.is_alive():
        return
    _stream.subscribe_trades(_on_trade, *symbols)
    _stream.subscribe_quotes(_on_quote, *symbols)
    _stream.subscribe_bars(_on_bar, *symbols)
    logger.info("Stream: subscribed to %s", symbols)

def unsubscribe(symbols: list[str]) -> None:
    if not _stream or not _thread or not _thread.is_alive():
        return
    _stream.unsubscribe_trades(*symbols)
    _stream.unsubscribe_quotes(*symbols)
    _stream.unsubscribe_bars(*symbols)
    logger.info("Stream: unsubscribed from %s", symbols)

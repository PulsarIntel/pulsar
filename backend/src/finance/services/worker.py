import asyncio
import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import redis.asyncio as redis

from finance.core.config import settings
from finance.database.connections import get_db
from finance.services import alpaca
from finance.api.market import (
    ALL_SYMBOLS,
    COMPANY_NAMES,
    INDUSTRY_MAP,
    SECTOR_SYMBOLS,
    _safe_change_pct,
)

logger = logging.getLogger("finance.worker")

ET = ZoneInfo("America/New_York")

INTERVAL_MARKET_OPEN = 30
INTERVAL_MARKET_CLOSED = 300
NEWS_INTERVAL = 120

PREFIX = "worker"

_task: asyncio.Task | None = None
_stop_event = asyncio.Event()

def _is_market_hours() -> bool:
    now_et = datetime.now(ET)
    if now_et.weekday() >= 5:
        return False
    t = now_et.hour * 60 + now_et.minute
    return 9 * 60 + 30 <= t < 16 * 60

def _get_redis() -> redis.Redis:
    return redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        retry_on_timeout=True,
        socket_timeout=5,
        socket_connect_timeout=5,
        health_check_interval=30,
    )

def _build_quotes(snapshots: dict) -> dict:
    result = {}
    for sym, snap in snapshots.items():
        daily = snap.get("dailyBar") or {}
        prev = snap.get("prevDailyBar") or {}
        latest_trade = snap.get("latestTrade") or {}
        price = latest_trade.get("p", daily.get("c", 0))
        prev_close = prev.get("c", 0)
        change = round(price - prev_close, 2) if prev_close else 0
        change_pct = _safe_change_pct(snap)

        result[sym] = {
            "ticker": sym,
            "name": COMPANY_NAMES.get(sym, sym),
            "price": price,
            "change": change,
            "changePercent": change_pct,
            "open": daily.get("o", 0),
            "high": daily.get("h", 0),
            "low": daily.get("l", 0),
            "previousClose": prev_close,
            "volume": str(daily.get("v", 0)),
            "sector": next(
                (sec for sec, syms in SECTOR_SYMBOLS.items() if sym in syms), ""
            ),
            "industry": INDUSTRY_MAP.get(sym, ""),
        }
    return result

def _build_heatmap(snapshots: dict) -> list[dict]:
    sectors = []
    for sector_name, symbols in SECTOR_SYMBOLS.items():
        stocks = []
        total_change = 0.0
        count = 0

        for sym in symbols:
            snap = snapshots.get(sym)
            if not snap:
                continue
            daily = snap.get("dailyBar") or {}
            latest_trade = snap.get("latestTrade") or {}
            price = latest_trade.get("p", daily.get("c", 0))
            change_pct = _safe_change_pct(snap)
            total_change += change_pct
            count += 1

            stocks.append({
                "ticker": sym,
                "name": COMPANY_NAMES.get(sym, sym),
                "changePercent": change_pct,
                "marketCap": 0,
                "price": price,
                "industry": INDUSTRY_MAP.get(sym, ""),
                "afterHoursPrice": price,
                "afterHoursChangePercent": 0,
                "summary": "",
            })

        stocks.sort(key=lambda s: abs(s["changePercent"]), reverse=True)
        sectors.append({
            "name": sector_name,
            "changePercent": round(total_change / count, 2) if count else 0,
            "stocks": stocks,
        })

    sectors.sort(key=lambda s: abs(s["changePercent"]), reverse=True)
    return sectors

async def _collect_user_symbols() -> set[str]:
    from finance.services.providers.doviz_provider import DOVIZ_SYMBOLS

    try:
        db = get_db()
        symbols: set[str] = set()
        doviz_keys = {k.lower() for k in DOVIZ_SYMBOLS}
        async for doc in db.holdings.find({}, {"ticker": 1}):
            if ticker := doc.get("ticker"):
                if ticker.lower() not in doviz_keys and "/" not in ticker:
                    symbols.add(ticker.upper())
        async for doc in db.watchlists.find({}, {"tickers": 1}):
            for ticker in doc.get("tickers", []):
                if ticker.lower() not in doviz_keys and "/" not in ticker:
                    symbols.add(ticker.upper())
        return symbols
    except Exception:
        logger.exception("Failed to collect user symbols")
        return set()

async def _fetch_snapshots(r: redis.Redis) -> None:
    try:
        user_symbols = await _collect_user_symbols()
        user_symbols = {s for s in user_symbols if not s.startswith("^")}
        all_symbols = sorted(set(ALL_SYMBOLS) | user_symbols)

        data = await alpaca.get_snapshots(all_symbols)
        quotes = _build_quotes(data)
        heatmap = _build_heatmap(data)

        pipe = r.pipeline()
        pipe.set(f"{PREFIX}:snapshots", json.dumps(data), ex=900)
        pipe.set(f"{PREFIX}:quotes", json.dumps(quotes), ex=900)
        pipe.set(f"{PREFIX}:heatmap", json.dumps(heatmap), ex=900)
        for sym, quote in quotes.items():
            pipe.set(f"{PREFIX}:quote:{sym}", json.dumps(quote), ex=900)
        await pipe.execute()
        logger.info("Snapshots updated: %d symbols (%d from users)", len(data), len(user_symbols))
    except Exception:
        logger.exception("Failed to fetch snapshots")

async def _fetch_movers(r: redis.Redis) -> None:
    try:
        data = await alpaca.get_movers(top=20)
        await r.set(f"{PREFIX}:movers", json.dumps(data), ex=900)
        logger.info("Movers updated")
    except Exception:
        logger.exception("Failed to fetch movers")

async def _fetch_news(r: redis.Redis) -> None:
    try:
        data = await alpaca.get_news(limit=30)
        await r.set(f"{PREFIX}:news", json.dumps(data), ex=900)
        logger.info("News updated: %d articles", len(data))
    except Exception:
        logger.exception("Failed to fetch news")

async def _run() -> None:
    logger.info("Worker started")
    r = _get_redis()
    last_news_fetch = 0.0

    try:
        while not _stop_event.is_set():
            now = asyncio.get_event_loop().time()
            market_open = _is_market_hours()
            interval = INTERVAL_MARKET_OPEN if market_open else INTERVAL_MARKET_CLOSED

            await _fetch_snapshots(r)
            await _fetch_movers(r)

            if now - last_news_fetch >= NEWS_INTERVAL:
                await _fetch_news(r)
                last_news_fetch = now

            status = {
                "last_update": datetime.now(timezone.utc).isoformat(),
                "market_open": market_open,
                "interval": interval,
                "symbols_count": len(ALL_SYMBOLS),
            }
            await r.set(f"{PREFIX}:status", json.dumps(status), ex=900)

            try:
                await asyncio.wait_for(_stop_event.wait(), timeout=interval)
                break
            except asyncio.TimeoutError:
                pass
    finally:
        await r.aclose()
        logger.info("Worker stopped")

def start() -> None:
    global _task
    if _task is not None and not _task.done():
        return
    _stop_event.clear()
    _task = asyncio.create_task(_run())

async def stop() -> None:
    global _task
    if _task is None or _task.done():
        return
    _stop_event.set()
    try:
        await asyncio.wait_for(_task, timeout=10)
    except asyncio.TimeoutError:
        _task.cancel()
    _task = None

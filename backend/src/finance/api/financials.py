import asyncio
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from finance.api.ratelimit import financials_limiter
from finance.services import finnhub_service
from finance.services.cache import get_cached, set_cached

logger = logging.getLogger("finance.api.financials")

router = APIRouter(prefix="/financials", tags=["financials"], dependencies=[Depends(financials_limiter)])

HOUR_MAP = {"bmo": "before-market", "amc": "after-market", "dmh": "during-market"}

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _future(days: int = 30) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")

@router.get("/earnings-calendar")
async def earnings_calendar(
    from_date: str = Query(default=None),
    to_date: str = Query(default=None),
    symbol: str | None = Query(default=None),
):
    fd = from_date or _today()
    td = to_date or _future(30)
    key = f"finnhub:earnings_calendar:{fd}:{td}:{symbol or 'all'}"

    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        raw = await finnhub_service.get_earnings_calendar(fd, td, symbol)
        events = [
            {
                "symbol": e.get("symbol", ""),
                "date": e.get("date", ""),
                "hour": HOUR_MAP.get(e.get("hour", ""), e.get("hour", "")),
                "quarter": e.get("quarter"),
                "year": e.get("year"),
                "epsEstimate": e.get("epsEstimate"),
                "epsActual": e.get("epsActual"),
                "revenueEstimate": e.get("revenueEstimate"),
                "revenueActual": e.get("revenueActual"),
            }
            for e in raw
        ]
        await set_cached(key, events, ttl=3600)
        return events
    except Exception:
        logger.exception("Failed to fetch earnings calendar")
        return []

@router.get("/company/{symbol}/metrics")
async def company_metrics(symbol: str):
    key = f"finnhub:metrics:{symbol}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_basic_financials(symbol)
        result = {
            "symbol": symbol,
            "metric": data.get("metric", {}),
        }
        await set_cached(key, result, ttl=21600)
        return result
    except Exception:
        logger.exception("Failed to fetch metrics for %s", symbol)
        return {"symbol": symbol, "metric": {}}

@router.get("/company/{symbol}/earnings")
async def company_earnings(symbol: str, limit: int = Query(default=8)):
    key = f"finnhub:earnings:{symbol}:{limit}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_company_earnings(symbol, limit)
        await set_cached(key, data, ttl=21600)
        return data
    except Exception:
        logger.exception("Failed to fetch earnings for %s", symbol)
        return []

@router.get("/company/{symbol}/recommendations")
async def company_recommendations(symbol: str):
    key = f"finnhub:recommendations:{symbol}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_recommendation_trends(symbol)
        await set_cached(key, data, ttl=43200)
        return data
    except Exception:
        logger.exception("Failed to fetch recommendations for %s", symbol)
        return []

@router.get("/company/{symbol}/revenue-estimates")
async def company_revenue_estimates(
    symbol: str, freq: str = Query(default="quarterly")
):
    key = f"finnhub:revenue_estimates:{symbol}:{freq}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_revenue_estimates(symbol, freq)
        await set_cached(key, data, ttl=21600)
        return data
    except Exception:
        logger.exception("Failed to fetch revenue estimates for %s", symbol)
        return {"symbol": symbol, "freq": freq, "data": []}

@router.get("/company/{symbol}/eps-estimates")
async def company_eps_estimates(
    symbol: str, freq: str = Query(default="quarterly")
):
    key = f"finnhub:eps_estimates:{symbol}:{freq}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_eps_estimates(symbol, freq)
        await set_cached(key, data, ttl=21600)
        return data
    except Exception:
        logger.exception("Failed to fetch EPS estimates for %s", symbol)
        return {"symbol": symbol, "freq": freq, "data": []}

@router.get("/company/{symbol}/earnings-quality")
async def company_earnings_quality(
    symbol: str, freq: str = Query(default="quarterly")
):
    key = f"finnhub:earnings_quality:{symbol}:{freq}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        data = await finnhub_service.get_earnings_quality(symbol, freq)
        await set_cached(key, data, ttl=86400)
        return data
    except Exception:
        logger.exception("Failed to fetch earnings quality for %s", symbol)
        return {"symbol": symbol, "freq": freq, "data": []}

@router.get("/company/{symbol}/overview")
async def company_overview(symbol: str):
    key = f"finnhub:overview:{symbol}"
    cached = await get_cached(key)
    if cached is not None:
        return cached

    try:
        metrics_raw, earnings, recommendations, quality = await asyncio.gather(
            finnhub_service.get_basic_financials(symbol),
            finnhub_service.get_company_earnings(symbol, 8),
            finnhub_service.get_recommendation_trends(symbol),
            finnhub_service.get_earnings_quality(symbol),
            return_exceptions=True,
        )

        result = {
            "symbol": symbol,
            "metrics": (
                {"symbol": symbol, "metric": metrics_raw.get("metric", {})}
                if isinstance(metrics_raw, dict) else {"symbol": symbol, "metric": {}}
            ),
            "earnings": earnings if isinstance(earnings, list) else [],
            "recommendations": recommendations if isinstance(recommendations, list) else [],
            "earningsQuality": quality if isinstance(quality, dict) else None,
        }
        await set_cached(key, result, ttl=3600)
        return result
    except Exception:
        logger.exception("Failed to fetch overview for %s", symbol)
        return {
            "symbol": symbol,
            "metrics": {"symbol": symbol, "metric": {}},
            "earnings": [],
            "recommendations": [],
            "earningsQuality": None,
        }

import logging
from typing import Any

import httpx

from finance.core.config import settings

logger = logging.getLogger("finance.finnhub")

BASE_URL = "https://finnhub.io/api/v1"

_client: httpx.AsyncClient | None = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=15.0,
            params={"token": settings.FINNHUB_API_KEY},
        )
    return _client

async def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
    _client = None

async def _get(path: str, params: dict | None = None) -> Any:
    client = get_client()
    resp = await client.get(path, params=params or {})
    resp.raise_for_status()
    return resp.json()

async def get_earnings_calendar(
    from_date: str, to_date: str, symbol: str | None = None
) -> list[dict]:
    params: dict[str, str] = {"from": from_date, "to": to_date}
    if symbol:
        params["symbol"] = symbol
    data = await _get("/calendar/earnings", params)
    return data.get("earningsCalendar", [])

async def get_basic_financials(symbol: str, metric: str = "all") -> dict:
    return await _get("/stock/metric", {"symbol": symbol, "metric": metric})

async def get_company_earnings(symbol: str, limit: int = 8) -> list[dict]:
    return await _get("/stock/earnings", {"symbol": symbol, "limit": str(limit)})

async def get_recommendation_trends(symbol: str) -> list[dict]:
    return await _get("/stock/recommendation", {"symbol": symbol})

async def get_revenue_estimates(
    symbol: str, freq: str = "quarterly"
) -> dict:
    return await _get("/stock/revenue-estimate", {"symbol": symbol, "freq": freq})

async def get_eps_estimates(symbol: str, freq: str = "quarterly") -> dict:
    return await _get("/stock/eps-estimate", {"symbol": symbol, "freq": freq})

async def get_earnings_quality(symbol: str, freq: str = "quarterly") -> dict:
    return await _get(
        "/stock/earnings-quality-score", {"symbol": symbol, "freq": freq}
    )

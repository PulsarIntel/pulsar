import logging
from datetime import datetime, timedelta, timezone

import httpx

from finance.core.config import settings

logger = logging.getLogger("finance.alpaca")

_client: httpx.AsyncClient | None = None

def _auth_headers() -> dict[str, str]:
    return {
        "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": settings.ALPACA_API_SECRET,
    }

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.ALPACA_BASE_URL,
            headers=_auth_headers(),
            timeout=15.0,
        )
    return _client

async def get_snapshots(symbols: list[str]) -> dict:
    client = get_client()
    feed = settings.ALPACA_FEED

    if len(symbols) <= 200:
        resp = await client.get(
            "/v2/stocks/snapshots",
            params={"symbols": ",".join(symbols), "feed": feed},
        )
        resp.raise_for_status()
        return resp.json()

    result = {}
    for i in range(0, len(symbols), 200):
        batch = symbols[i : i + 200]
        resp = await client.get(
            "/v2/stocks/snapshots",
            params={"symbols": ",".join(batch), "feed": feed},
        )
        resp.raise_for_status()
        result.update(resp.json())
    return result

async def get_bars(
    symbol: str,
    timeframe: str = "1Day",
    start: str | None = None,
    end: str | None = None,
    limit: int = 500,
) -> list[dict]:
    client = get_client()
    page_size = min(limit, 1000)
    params: dict = {
        "timeframe": timeframe,
        "limit": page_size,
        "feed": settings.ALPACA_FEED,
        "adjustment": "split",
    }
    if start:
        params["start"] = start
    if end:
        params["end"] = end

    bars: list[dict] = []
    next_page_token = None

    while True:
        if next_page_token:
            params["page_token"] = next_page_token
        resp = await client.get(f"/v2/stocks/{symbol}/bars", params=params)
        resp.raise_for_status()
        data = resp.json()
        bars.extend(data.get("bars") or [])
        next_page_token = data.get("next_page_token")
        if not next_page_token or len(bars) >= limit:
            break

    return bars[:limit]

async def get_latest_trades(symbols: list[str]) -> dict:
    client = get_client()
    resp = await client.get(
        "/v2/stocks/trades/latest",
        params={"symbols": ",".join(symbols), "feed": settings.ALPACA_FEED},
    )
    resp.raise_for_status()
    return resp.json().get("trades", {})

async def get_latest_quotes(symbols: list[str]) -> dict:
    client = get_client()
    resp = await client.get(
        "/v2/stocks/quotes/latest",
        params={"symbols": ",".join(symbols), "feed": settings.ALPACA_FEED},
    )
    resp.raise_for_status()
    return resp.json().get("quotes", {})

async def get_movers(market_type: str = "stocks", top: int = 20) -> dict:
    client = get_client()
    resp = await client.get(
        f"/v1beta1/screener/{market_type}/movers",
        params={"top": top},
    )
    resp.raise_for_status()
    return resp.json()

async def get_news(
    symbols: list[str] | None = None,
    limit: int = 20,
) -> list[dict]:
    client = get_client()
    params: dict = {"limit": limit, "sort": "desc"}
    if symbols:
        params["symbols"] = ",".join(symbols)
    resp = await client.get("/v1beta1/news", params=params)
    resp.raise_for_status()
    return resp.json().get("news", [])

async def get_assets(
    status: str = "active",
    asset_class: str = "us_equity",
) -> list[dict]:
    async with httpx.AsyncClient(
        base_url="https://api.alpaca.markets",
        headers=_auth_headers(),
        timeout=15.0,
    ) as client:
        resp = await client.get(
            "/v2/assets",
            params={"status": status, "asset_class": asset_class},
        )
        resp.raise_for_status()
        return resp.json()

RANGE_CONFIG: dict[str, dict] = {
    "1D": {"timeframe": "5Min", "days": 3},
    "5D": {"timeframe": "15Min", "days": 7},
    "1W": {"timeframe": "1Hour", "days": 7},
    "1M": {"timeframe": "1Hour", "days": 30},
    "3M": {"timeframe": "1Day", "days": 90},
    "6M": {"timeframe": "1Day", "days": 180},
    "YTD": {"timeframe": "1Day", "days": 0},
    "1Y": {"timeframe": "1Day", "days": 365},
    "5Y": {"timeframe": "1Week", "days": 1825},
}

INTERVAL_MAP: dict[str, str] = {
    "1m": "1Min",
    "5m": "5Min",
    "15m": "15Min",
    "1h": "1Hour",
    "4h": "4Hour",
    "D": "1Day",
    "W": "1Week",
    "M": "1Month",
}

def get_bar_params(range_key: str, interval: str | None = None) -> tuple[str, str]:
    config = RANGE_CONFIG.get(range_key, RANGE_CONFIG["1M"])
    now = datetime.now(timezone.utc)
    if range_key == "YTD":
        start = datetime(now.year, 1, 1)
    else:
        start = now - timedelta(days=config["days"])
    timeframe = INTERVAL_MAP.get(interval, config["timeframe"]) if interval else config["timeframe"]
    return timeframe, start.strftime("%Y-%m-%dT%H:%M:%SZ")

async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None

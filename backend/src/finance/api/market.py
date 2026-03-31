import json

from fastapi import APIRouter, Depends, HTTPException, Query

from finance.api.ratelimit import market_limiter
from finance.services import alpaca
from finance.services.cache import get_cached, set_cached, get_redis

router = APIRouter(prefix="/market", tags=["market"], dependencies=[Depends(market_limiter)])

SECTOR_SYMBOLS: dict[str, list[str]] = {
    "Technology": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "ORCL", "CRM", "AMD", "INTC"],
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "NKE", "MCD", "SBUX", "LOW", "TJX"],
    "Financials": ["JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "SCHW"],
    "Healthcare": ["LLY", "UNH", "JNJ", "PFE", "ABBV", "MRK", "TMO", "ABT"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO"],
    "Communication Services": ["NFLX", "DIS", "TMUS", "CMCSA", "T", "VZ", "CHTR"],
    "Industrials": ["CAT", "GE", "UNP", "HON", "RTX", "BA", "DE", "LMT"],
    "Consumer Staples": ["WMT", "PG", "COST", "KO", "PEP", "PM", "MO", "CL"],
    "Real Estate": ["AMT", "PLD", "CCI", "EQIX", "SPG", "PSA", "O", "WELL"],
    "Utilities": ["NEE", "SO", "DUK", "SRE", "AEP", "D", "EXC", "XEL"],
    "Materials": ["LIN", "APD", "SHW", "ECL", "FCX", "NEM", "NUE", "DOW"],
}

INDUSTRY_MAP: dict[str, str] = {
    "AAPL": "Consumer Electronics", "MSFT": "Software - Infrastructure",
    "NVDA": "Semiconductors", "GOOGL": "Internet Content & Information",
    "META": "Internet Content & Information", "AVGO": "Semiconductors",
    "ORCL": "Software - Infrastructure", "CRM": "Software - Application",
    "AMD": "Semiconductors", "INTC": "Semiconductors",
    "AMZN": "Internet Retail", "TSLA": "Auto Manufacturers",
    "HD": "Home Improvement Retail", "NKE": "Footwear & Accessories",
    "MCD": "Restaurants", "SBUX": "Restaurants",
    "LOW": "Home Improvement Retail", "TJX": "Apparel Retail",
    "JPM": "Banks - Diversified", "V": "Credit Services",
    "MA": "Credit Services", "BAC": "Banks - Diversified",
    "WFC": "Banks - Diversified", "GS": "Capital Markets",
    "MS": "Capital Markets", "SCHW": "Capital Markets",
    "LLY": "Drug Manufacturers", "UNH": "Healthcare Plans",
    "JNJ": "Drug Manufacturers", "PFE": "Drug Manufacturers",
    "ABBV": "Drug Manufacturers", "MRK": "Drug Manufacturers",
    "TMO": "Diagnostics & Research", "ABT": "Medical Devices",
    "XOM": "Oil & Gas Integrated", "CVX": "Oil & Gas Integrated",
    "COP": "Oil & Gas E&P", "SLB": "Oil & Gas Equipment",
    "EOG": "Oil & Gas E&P", "MPC": "Oil & Gas Refining",
    "PSX": "Oil & Gas Refining", "VLO": "Oil & Gas Refining",
    "NFLX": "Entertainment", "DIS": "Entertainment",
    "TMUS": "Telecom Services", "CMCSA": "Telecom Services",
    "T": "Telecom Services", "VZ": "Telecom Services", "CHTR": "Telecom Services",
    "CAT": "Farm & Heavy Machinery", "GE": "Aerospace & Defense",
    "UNP": "Railroads", "HON": "Conglomerates",
    "RTX": "Aerospace & Defense", "BA": "Aerospace & Defense",
    "DE": "Farm & Heavy Machinery", "LMT": "Aerospace & Defense",
    "WMT": "Discount Stores", "PG": "Household Products",
    "COST": "Discount Stores", "KO": "Beverages",
    "PEP": "Beverages", "PM": "Tobacco", "MO": "Tobacco", "CL": "Household Products",
    "AMT": "REIT - Specialty", "PLD": "REIT - Industrial",
    "CCI": "REIT - Specialty", "EQIX": "REIT - Specialty",
    "SPG": "REIT - Retail", "PSA": "REIT - Specialty",
    "O": "REIT - Retail", "WELL": "REIT - Healthcare",
    "NEE": "Utilities - Regulated", "SO": "Utilities - Regulated",
    "DUK": "Utilities - Regulated", "SRE": "Utilities - Regulated",
    "AEP": "Utilities - Regulated", "D": "Utilities - Regulated",
    "EXC": "Utilities - Regulated", "XEL": "Utilities - Regulated",
    "LIN": "Specialty Chemicals", "APD": "Specialty Chemicals",
    "SHW": "Specialty Chemicals", "ECL": "Specialty Chemicals",
    "FCX": "Copper", "NEM": "Gold", "NUE": "Steel", "DOW": "Chemicals",
}

COMPANY_NAMES: dict[str, str] = {
    "AAPL": "Apple Inc.", "MSFT": "Microsoft Corporation",
    "NVDA": "NVIDIA Corporation", "GOOGL": "Alphabet Inc.",
    "META": "Meta Platforms Inc.", "AVGO": "Broadcom Inc.",
    "ORCL": "Oracle Corporation", "CRM": "Salesforce Inc.",
    "AMD": "Advanced Micro Devices", "INTC": "Intel Corporation",
    "AMZN": "Amazon.com Inc.", "TSLA": "Tesla Inc.",
    "HD": "The Home Depot Inc.", "NKE": "Nike Inc.",
    "MCD": "McDonald's Corporation", "SBUX": "Starbucks Corporation",
    "LOW": "Lowe's Companies Inc.", "TJX": "TJX Companies Inc.",
    "JPM": "JPMorgan Chase & Co.", "V": "Visa Inc.",
    "MA": "Mastercard Inc.", "BAC": "Bank of America Corp.",
    "WFC": "Wells Fargo & Co.", "GS": "Goldman Sachs Group",
    "MS": "Morgan Stanley", "SCHW": "Charles Schwab Corp.",
    "LLY": "Eli Lilly and Co.", "UNH": "UnitedHealth Group Inc.",
    "JNJ": "Johnson & Johnson", "PFE": "Pfizer Inc.",
    "ABBV": "AbbVie Inc.", "MRK": "Merck & Co. Inc.",
    "TMO": "Thermo Fisher Scientific", "ABT": "Abbott Laboratories",
    "XOM": "Exxon Mobil Corporation", "CVX": "Chevron Corporation",
    "COP": "ConocoPhillips", "SLB": "Schlumberger Limited",
    "EOG": "EOG Resources Inc.", "MPC": "Marathon Petroleum Corp.",
    "PSX": "Phillips 66", "VLO": "Valero Energy Corp.",
    "NFLX": "Netflix Inc.", "DIS": "The Walt Disney Company",
    "TMUS": "T-Mobile US Inc.", "CMCSA": "Comcast Corporation",
    "T": "AT&T Inc.", "VZ": "Verizon Communications",
    "CHTR": "Charter Communications",
    "CAT": "Caterpillar Inc.", "GE": "GE Aerospace",
    "UNP": "Union Pacific Corp.", "HON": "Honeywell International",
    "RTX": "RTX Corporation", "BA": "The Boeing Company",
    "DE": "Deere & Company", "LMT": "Lockheed Martin Corp.",
    "WMT": "Walmart Inc.", "PG": "Procter & Gamble Co.",
    "COST": "Costco Wholesale Corp.", "KO": "The Coca-Cola Company",
    "PEP": "PepsiCo Inc.", "PM": "Philip Morris International",
    "MO": "Altria Group Inc.", "CL": "Colgate-Palmolive Co.",
    "AMT": "American Tower Corp.", "PLD": "Prologis Inc.",
    "CCI": "Crown Castle Inc.", "EQIX": "Equinix Inc.",
    "SPG": "Simon Property Group", "PSA": "Public Storage",
    "O": "Realty Income Corp.", "WELL": "Welltower Inc.",
    "NEE": "NextEra Energy Inc.", "SO": "Southern Company",
    "DUK": "Duke Energy Corp.", "SRE": "Sempra",
    "AEP": "American Electric Power", "D": "Dominion Energy Inc.",
    "EXC": "Exelon Corporation", "XEL": "Xcel Energy Inc.",
    "LIN": "Linde plc", "APD": "Air Products & Chemicals",
    "SHW": "Sherwin-Williams Co.", "ECL": "Ecolab Inc.",
    "FCX": "Freeport-McMoRan Inc.", "NEM": "Newmont Corporation",
    "NUE": "Nucor Corporation", "DOW": "Dow Inc.",
}

ALL_SYMBOLS: list[str] = sorted(
    {s for syms in SECTOR_SYMBOLS.values() for s in syms}
)

def _safe_change_pct(snapshot: dict) -> float:
    daily = snapshot.get("dailyBar") or {}
    prev = snapshot.get("prevDailyBar") or {}
    close = daily.get("c", 0)
    prev_close = prev.get("c", 0)
    if not prev_close:
        return 0.0
    return round((close - prev_close) / prev_close * 100, 2)

def _build_quote_from_snapshot(sym: str, snap: dict) -> dict:
    daily = snap.get("dailyBar") or {}
    prev = snap.get("prevDailyBar") or {}
    latest_trade = snap.get("latestTrade") or {}
    price = latest_trade.get("p", daily.get("c", 0))
    prev_close = prev.get("c", 0)
    change = round(price - prev_close, 2) if prev_close else 0
    return {
        "ticker": sym,
        "name": COMPANY_NAMES.get(sym, sym),
        "price": price,
        "change": change,
        "changePercent": _safe_change_pct(snap),
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

async def _read_worker(key: str) -> dict | list | None:
    r = get_redis()
    val = await r.get(f"worker:{key}")
    if val is None:
        return None
    return json.loads(val)

@router.get("/snapshots")
async def snapshots(
    symbols: str = Query(..., description="Comma-separated symbols"),
):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(400, "No symbols provided")
    if len(symbol_list) > 200:
        raise HTTPException(400, "Max 200 symbols per request")

    all_snapshots = await _read_worker("snapshots")
    if all_snapshots:
        return {s: all_snapshots[s] for s in symbol_list if s in all_snapshots}

    data = await alpaca.get_snapshots(symbol_list)
    return data

@router.get("/quotes")
async def quotes(
    symbols: str = Query(..., description="Comma-separated symbols or 'all'"),
):
    all_quotes = await _read_worker("quotes")

    if symbols.strip().lower() == "all":
        if all_quotes:
            return all_quotes
        try:
            data = await alpaca.get_snapshots(ALL_SYMBOLS)
            return {sym: _build_quote_from_snapshot(sym, snap) for sym, snap in data.items()}
        except Exception:
            return {}

    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(400, "No symbols provided")

    result = {}
    missing = []
    for s in symbol_list:
        if all_quotes and s in all_quotes:
            result[s] = all_quotes[s]
        else:
            missing.append(s)

    if missing:
        try:
            data = await alpaca.get_snapshots(missing)
            for sym, snap in data.items():
                result[sym] = _build_quote_from_snapshot(sym, snap)
        except Exception:
            pass

    return result

@router.get("/bars/{symbol}")
async def bars(
    symbol: str,
    range: str = Query("1M", description="Time range: 1D,5D,1W,1M,3M,6M,YTD,1Y,5Y"),
    interval: str | None = Query(None, description="Bar interval: 1m,5m,15m,1h,4h,D,W,M"),
):
    symbol = symbol.upper()
    cache_key = f"bars:{symbol}:{range}:{interval or 'auto'}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    timeframe, start = alpaca.get_bar_params(range, interval)
    bar_limits = {
        "1m": 1000, "5m": 1000, "15m": 1000, "1h": 1000,
        "4h": 1000, "D": 2000, "W": 500, "M": 500,
    }
    limit = bar_limits.get(interval, 1000) if interval else 1000
    data = await alpaca.get_bars(symbol, timeframe=timeframe, start=start, limit=limit)

    points = [
        {
            "time": bar["t"],
            "open": bar.get("o", bar["c"]),
            "high": bar.get("h", bar["c"]),
            "low": bar.get("l", bar["c"]),
            "close": bar["c"],
            "volume": bar.get("v", 0),
        }
        for bar in data
    ]

    ttl = 30 if interval in ("1m", "5m") else 60 if range == "1D" else 300
    await set_cached(cache_key, points, ttl=ttl)
    return points

@router.get("/heatmap")
async def heatmap():
    data = await _read_worker("heatmap")
    if data:
        return data

    snapshots_data = await alpaca.get_snapshots(ALL_SYMBOLS)
    sectors = []
    for sector_name, symbols in SECTOR_SYMBOLS.items():
        stocks = []
        total_change = 0.0
        count = 0
        for sym in symbols:
            snap = snapshots_data.get(sym)
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

@router.get("/movers")
async def movers():
    data = await _read_worker("movers")
    if data:
        return data

    data = await alpaca.get_movers(top=20)
    return data

@router.get("/news")
async def news(
    symbols: str | None = Query(None),
    limit: int = Query(20, le=50),
):
    all_news = await _read_worker("news")
    if all_news:
        if symbols:
            symbol_set = {s.strip().upper() for s in symbols.split(",") if s.strip()}
            filtered = [
                n for n in all_news
                if any(s in symbol_set for s in (n.get("symbols") or []))
            ]
            return filtered[:limit]
        return all_news[:limit]

    symbol_list = (
        [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if symbols
        else None
    )
    data = await alpaca.get_news(symbols=symbol_list, limit=limit)
    return data

@router.get("/assets")
async def assets(
    q: str = Query("", description="Search query"),
):
    cache_key = "assets:all"
    cached = await get_cached(cache_key)
    if not cached:
        raw = await alpaca.get_assets()
        cached = [
            {
                "ticker": a["symbol"],
                "name": a.get("name", ""),
                "exchange": a.get("exchange", ""),
                "tradable": a.get("tradable", False),
            }
            for a in raw
            if a.get("tradable") and a.get("status") == "active"
        ]
        await set_cached(cache_key, cached, ttl=3600)

    if q:
        q_lower = q.lower()
        return [
            a for a in cached
            if q_lower in a["ticker"].lower() or q_lower in a["name"].lower()
        ][:50]

    return cached

@router.get("/status")
async def worker_status():
    data = await _read_worker("status")
    if not data:
        return {"status": "worker not running"}
    return data

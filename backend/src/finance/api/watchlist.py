from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException

from finance.api.deps import _get_user_id
from finance.api.ratelimit import user_limiter
from finance.database.connections import get_db
from finance.models.schemas import WatchlistAdd
from finance.services.providers.doviz_provider import DOVIZ_SYMBOLS

router = APIRouter(prefix="/watchlist", tags=["watchlist"], dependencies=[Depends(user_limiter)])

def _normalize_ticker(raw: str) -> str:
    ticker = raw.strip()
    for key in DOVIZ_SYMBOLS:
        if key.lower() == ticker.lower():
            return key
    return ticker.upper()

@router.get("/items")
async def list_items(
    authorization: str | None = FastAPIHeader(None),
) -> list[str]:
    user_id = _get_user_id(authorization)
    db = get_db()
    doc = await db.watchlists.find_one({"user_id": user_id})
    if not doc:
        return []
    return doc.get("tickers", [])

@router.post("/items", status_code=201)
async def add_item(
    body: WatchlistAdd,
    authorization: str | None = FastAPIHeader(None),
) -> list[str]:
    user_id = _get_user_id(authorization)
    ticker = _normalize_ticker(body.ticker)
    db = get_db()
    await db.watchlists.update_one(
        {"user_id": user_id},
        {
            "$addToSet": {"tickers": ticker},
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )
    doc = await db.watchlists.find_one({"user_id": user_id})
    return doc.get("tickers", [])

@router.delete("/items/{ticker:path}", status_code=200)
async def remove_item(
    ticker: str,
    authorization: str | None = FastAPIHeader(None),
) -> list[str]:
    user_id = _get_user_id(authorization)
    db = get_db()
    normalized = _normalize_ticker(ticker)
    await db.watchlists.update_one(
        {"user_id": user_id},
        {"$pull": {"tickers": {"$in": [ticker, normalized, ticker.upper()]}}},
    )
    doc = await db.watchlists.find_one({"user_id": user_id})
    return doc.get("tickers", []) if doc else []

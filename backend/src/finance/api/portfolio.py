from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException

from finance.api.deps import _get_user_id
from finance.api.ratelimit import user_limiter
from finance.database.connections import get_db
from finance.models.schemas import HoldingIn, HoldingOut
from finance.services.providers.doviz_provider import DOVIZ_SYMBOLS

router = APIRouter(prefix="/portfolio", tags=["portfolio"], dependencies=[Depends(user_limiter)])

@router.get("/holdings")
async def list_holdings(
    authorization: str | None = FastAPIHeader(None),
) -> list[HoldingOut]:
    user_id = _get_user_id(authorization)
    db = get_db()
    cursor = db.holdings.find({"user_id": user_id}).sort("created_at", -1)
    holdings = []
    async for doc in cursor:
        holdings.append(
            HoldingOut(
                id=str(doc["_id"]),
                ticker=doc["ticker"],
                shares=doc["shares"],
                avg_cost=doc["avg_cost"],
                bought_at=doc["bought_at"],
                currency=doc.get("currency", "USD"),
            )
        )
    return holdings

@router.post("/holdings", status_code=201)
async def add_holding(
    body: HoldingIn,
    authorization: str | None = FastAPIHeader(None),
) -> HoldingOut:
    user_id = _get_user_id(authorization)
    db = get_db()

    ticker = body.ticker.strip()
    is_doviz = ticker in DOVIZ_SYMBOLS or ticker.lower() in DOVIZ_SYMBOLS
    if is_doviz:
        for key in DOVIZ_SYMBOLS:
            if key.lower() == ticker.lower():
                ticker = key
                break
    else:
        ticker = ticker.upper()

    doc = {
        "user_id": user_id,
        "ticker": ticker,
        "shares": body.shares,
        "avg_cost": body.avg_cost,
        "bought_at": body.bought_at,
        "currency": body.currency if is_doviz else "USD",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.holdings.insert_one(doc)
    return HoldingOut(
        id=str(result.inserted_id),
        ticker=doc["ticker"],
        shares=doc["shares"],
        avg_cost=doc["avg_cost"],
        bought_at=doc["bought_at"],
        currency=doc["currency"],
    )

@router.delete("/holdings/{holding_id}", status_code=204)
async def delete_holding(
    holding_id: str,
    authorization: str | None = FastAPIHeader(None),
) -> None:
    user_id = _get_user_id(authorization)
    db = get_db()
    result = await db.holdings.delete_one(
        {"_id": ObjectId(holding_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Holding not found")

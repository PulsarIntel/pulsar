from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException
from pymongo import ReturnDocument

from finance.api.deps import _get_user_id
from finance.api.ratelimit import user_limiter
from finance.database.connections import get_db
from finance.models.schemas import (
    HoldingIn,
    HoldingOut,
    PositionOut,
    TransactionIn,
    TransactionOut,
    TransactionUpdate,
)
from finance.services.providers.doviz_provider import DOVIZ_SYMBOLS

router = APIRouter(prefix="/portfolio", tags=["portfolio"], dependencies=[Depends(user_limiter)])


def _normalize_ticker(raw: str) -> str:
    ticker = raw.strip()
    is_doviz = ticker in DOVIZ_SYMBOLS or ticker.lower() in DOVIZ_SYMBOLS
    if is_doviz:
        for key in DOVIZ_SYMBOLS:
            if key.lower() == ticker.lower():
                return key
    return ticker.upper() if not is_doviz else ticker


def _is_doviz(ticker: str) -> bool:
    return ticker in DOVIZ_SYMBOLS or ticker.lower() in DOVIZ_SYMBOLS


def _recalculate_position(transactions: list[dict]) -> dict:
    lots: list[list[float]] = []
    realized_pnl = 0.0

    for txn in sorted(transactions, key=lambda t: t["date"]):
        if txn["type"] == "buy":
            lots.append([txn["shares"], txn["price_per_share"]])
        elif txn["type"] == "sell":
            shares_to_sell = txn["shares"]
            sell_price = txn["price_per_share"]
            while shares_to_sell > 0 and lots:
                lot_shares, lot_cost = lots[0]
                sold = min(shares_to_sell, lot_shares)
                realized_pnl += sold * (sell_price - lot_cost)
                lots[0][0] -= sold
                shares_to_sell -= sold
                if lots[0][0] <= 1e-12:
                    lots.pop(0)
        realized_pnl -= txn.get("fee", 0.0)

    total_shares = sum(lot[0] for lot in lots)
    total_invested = sum(lot[0] * lot[1] for lot in lots)
    avg_cost = (total_invested / total_shares) if total_shares > 1e-12 else 0.0
    first_date = min(t["date"] for t in transactions) if transactions else ""

    return {
        "total_shares": round(total_shares, 8),
        "avg_cost": round(avg_cost, 6),
        "total_invested": round(total_invested, 2),
        "realized_pnl": round(realized_pnl, 2),
        "first_transaction_date": first_date,
        "transaction_count": len(transactions),
    }


async def _sync_position(db, user_id: str, ticker: str, currency: str) -> None:
    txns = await db.transactions.find({"user_id": user_id, "ticker": ticker}).to_list(None)

    if not txns:
        await db.positions.delete_one({"user_id": user_id, "ticker": ticker})
        return

    summary = _recalculate_position(txns)
    now = datetime.now(timezone.utc)

    await db.positions.update_one(
        {"user_id": user_id, "ticker": ticker},
        {
            "$set": {
                **summary,
                "currency": currency,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": user_id,
                "ticker": ticker,
                "created_at": now,
            },
        },
        upsert=True,
    )


def _txn_doc_to_out(doc: dict) -> TransactionOut:
    created = doc.get("created_at", "")
    if isinstance(created, datetime):
        created = created.isoformat()
    return TransactionOut(
        id=str(doc["_id"]),
        ticker=doc["ticker"],
        type=doc["type"],
        shares=doc["shares"],
        price_per_share=doc["price_per_share"],
        total_cost=round(doc["shares"] * doc["price_per_share"], 2),
        date=doc["date"],
        currency=doc.get("currency", "USD"),
        fee=doc.get("fee", 0.0),
        notes=doc.get("notes", ""),
        created_at=str(created),
    )


@router.get("/holdings")
async def list_holdings(
    authorization: str | None = FastAPIHeader(None),
) -> list[HoldingOut]:
    user_id = _get_user_id(authorization)
    db = get_db()
    docs = await db.holdings.find({"user_id": user_id}).sort("created_at", -1).to_list(None)
    return [
        HoldingOut(
            id=str(doc["_id"]),
            ticker=doc["ticker"],
            shares=doc["shares"],
            avg_cost=doc["avg_cost"],
            bought_at=doc["bought_at"],
            currency=doc.get("currency", "USD"),
        )
        for doc in docs
    ]


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


@router.get("/positions")
async def list_positions(
    authorization: str | None = FastAPIHeader(None),
) -> list[PositionOut]:
    user_id = _get_user_id(authorization)
    db = get_db()
    docs = await db.positions.find({"user_id": user_id}).sort("updated_at", -1).to_list(None)
    return [
        PositionOut(
            id=str(doc["_id"]),
            ticker=doc["ticker"],
            currency=doc.get("currency", "USD"),
            total_shares=doc["total_shares"],
            avg_cost=doc["avg_cost"],
            total_invested=doc["total_invested"],
            realized_pnl=doc.get("realized_pnl", 0.0),
            first_transaction_date=doc.get("first_transaction_date", ""),
            transaction_count=doc.get("transaction_count", 0),
        )
        for doc in docs
    ]


@router.get("/positions/{ticker:path}/transactions")
async def list_transactions(
    ticker: str,
    authorization: str | None = FastAPIHeader(None),
) -> list[TransactionOut]:
    user_id = _get_user_id(authorization)
    db = get_db()
    docs = await db.transactions.find(
        {"user_id": user_id, "ticker": ticker}
    ).sort("date", -1).to_list(None)
    return [_txn_doc_to_out(doc) for doc in docs]


@router.post("/transactions", status_code=201)
async def add_transaction(
    body: TransactionIn,
    authorization: str | None = FastAPIHeader(None),
) -> TransactionOut:
    user_id = _get_user_id(authorization)
    db = get_db()
    ticker = _normalize_ticker(body.ticker)
    is_doviz = _is_doviz(ticker)

    if body.type == "sell":
        pos = await db.positions.find_one({"user_id": user_id, "ticker": ticker})
        current_shares = pos["total_shares"] if pos else 0
        if body.shares > current_shares + 1e-8:
            raise HTTPException(
                400,
                f"Cannot sell {body.shares} shares; only {current_shares} held",
            )

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "ticker": ticker,
        "type": body.type,
        "shares": body.shares,
        "price_per_share": body.price_per_share,
        "fee": body.fee,
        "notes": body.notes,
        "currency": body.currency if is_doviz else "USD",
        "date": body.date,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id

    await _sync_position(db, user_id, ticker, doc["currency"])
    return _txn_doc_to_out(doc)


@router.put("/transactions/{txn_id}")
async def update_transaction(
    txn_id: str,
    body: TransactionUpdate,
    authorization: str | None = FastAPIHeader(None),
) -> TransactionOut:
    user_id = _get_user_id(authorization)
    db = get_db()
    existing = await db.transactions.find_one(
        {"_id": ObjectId(txn_id), "user_id": user_id}
    )
    if not existing:
        raise HTTPException(404, "Transaction not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)

    updated = await db.transactions.find_one_and_update(
        {"_id": ObjectId(txn_id)},
        {"$set": updates} if updates else {"$set": {}},
        return_document=ReturnDocument.AFTER,
    )
    await _sync_position(
        db, user_id, existing["ticker"], existing.get("currency", "USD")
    )
    return _txn_doc_to_out(updated)


@router.delete("/transactions/{txn_id}", status_code=204)
async def delete_transaction(
    txn_id: str,
    authorization: str | None = FastAPIHeader(None),
) -> None:
    user_id = _get_user_id(authorization)
    db = get_db()
    txn = await db.transactions.find_one(
        {"_id": ObjectId(txn_id), "user_id": user_id}
    )
    if not txn:
        raise HTTPException(404, "Transaction not found")

    await db.transactions.delete_one({"_id": ObjectId(txn_id)})
    await _sync_position(db, user_id, txn["ticker"], txn.get("currency", "USD"))


@router.post("/migrate")
async def migrate_holdings(
    authorization: str | None = FastAPIHeader(None),
) -> dict:
    user_id = _get_user_id(authorization)
    db = get_db()

    existing_positions = await db.positions.count_documents({"user_id": user_id})
    if existing_positions > 0:
        return {"migrated": 0, "message": "Already migrated"}

    cursor = db.holdings.find({"user_id": user_id})
    count = 0
    now = datetime.now(timezone.utc)

    async for h in cursor:
        txn_doc = {
            "user_id": user_id,
            "ticker": h["ticker"],
            "type": "buy",
            "shares": h["shares"],
            "price_per_share": h["avg_cost"],
            "fee": 0.0,
            "notes": "Migrated from legacy holding",
            "currency": h.get("currency", "USD"),
            "date": h.get("bought_at", now.strftime("%Y-%m-%d")),
            "created_at": h.get("created_at", now),
            "updated_at": now,
        }
        await db.transactions.insert_one(txn_doc)
        await _sync_position(
            db, user_id, h["ticker"], h.get("currency", "USD")
        )
        count += 1

    return {"migrated": count}

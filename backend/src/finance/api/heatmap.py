from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException

from finance.api.deps import _get_user_id
from finance.api.ratelimit import user_limiter
from finance.database.connections import get_db
from finance.models.schemas import HeatmapIn, HeatmapOut

router = APIRouter(prefix="/heatmaps", tags=["heatmaps"], dependencies=[Depends(user_limiter)])

@router.get("/custom")
async def list_custom(
    authorization: str | None = FastAPIHeader(None),
) -> list[HeatmapOut]:
    user_id = _get_user_id(authorization)
    db = get_db()
    result = []
    async for doc in db.custom_heatmaps.find({"user_id": user_id}).sort("created_at", -1):
        result.append(
            HeatmapOut(
                id=str(doc["_id"]),
                name=doc["name"],
                tickers=doc["tickers"],
            )
        )
    return result

@router.post("/custom", status_code=201)
async def create_custom(
    body: HeatmapIn,
    authorization: str | None = FastAPIHeader(None),
) -> HeatmapOut:
    user_id = _get_user_id(authorization)
    if not body.name.strip():
        raise HTTPException(400, "Name is required")
    if len(body.tickers) < 1 or len(body.tickers) > 10:
        raise HTTPException(400, "1-10 tickers required")

    db = get_db()
    doc = {
        "user_id": user_id,
        "name": body.name.strip(),
        "tickers": body.tickers[:10],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.custom_heatmaps.insert_one(doc)
    return HeatmapOut(
        id=str(result.inserted_id),
        name=doc["name"],
        tickers=doc["tickers"],
    )

@router.put("/custom/{heatmap_id}")
async def update_custom(
    heatmap_id: str,
    body: HeatmapIn,
    authorization: str | None = FastAPIHeader(None),
) -> HeatmapOut:
    user_id = _get_user_id(authorization)
    if not body.name.strip():
        raise HTTPException(400, "Name is required")
    if len(body.tickers) < 1 or len(body.tickers) > 10:
        raise HTTPException(400, "1-10 tickers required")

    db = get_db()
    result = await db.custom_heatmaps.find_one_and_update(
        {"_id": ObjectId(heatmap_id), "user_id": user_id},
        {"$set": {"name": body.name.strip(), "tickers": body.tickers[:10]}},
        return_document=True,
    )
    if not result:
        raise HTTPException(404, "Heatmap not found")
    return HeatmapOut(
        id=str(result["_id"]),
        name=result["name"],
        tickers=result["tickers"],
    )

@router.get("/custom/{heatmap_id}")
async def get_custom(
    heatmap_id: str,
    authorization: str | None = FastAPIHeader(None),
) -> HeatmapOut:
    user_id = _get_user_id(authorization)
    db = get_db()
    doc = await db.custom_heatmaps.find_one(
        {"_id": ObjectId(heatmap_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(404, "Heatmap not found")
    return HeatmapOut(
        id=str(doc["_id"]),
        name=doc["name"],
        tickers=doc["tickers"],
    )

@router.delete("/custom/{heatmap_id}", status_code=204)
async def delete_custom(
    heatmap_id: str,
    authorization: str | None = FastAPIHeader(None),
) -> None:
    user_id = _get_user_id(authorization)
    db = get_db()
    result = await db.custom_heatmaps.delete_one(
        {"_id": ObjectId(heatmap_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Heatmap not found")

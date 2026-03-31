from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException

from finance.api.deps import _get_user_id
from finance.api.ratelimit import user_limiter
from finance.database.connections import get_db
from finance.models.schemas import SaveWidgetsRequest, WidgetSchema

router = APIRouter(prefix="/terminal", tags=["terminal"], dependencies=[Depends(user_limiter)])

@router.get("/widgets")
async def get_widgets(
    authorization: str | None = FastAPIHeader(None),
) -> list[dict]:
    user_id = _get_user_id(authorization)
    db = get_db()
    doc = await db.terminal_layouts.find_one({"user_id": user_id})
    if not doc:
        return []
    return doc.get("widgets", [])

@router.put("/widgets")
async def save_widgets(
    body: SaveWidgetsRequest,
    authorization: str | None = FastAPIHeader(None),
) -> list[dict]:
    user_id = _get_user_id(authorization)
    db = get_db()
    widgets_data = [w.model_dump() for w in body.widgets]
    await db.terminal_layouts.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "widgets": widgets_data,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )
    return widgets_data

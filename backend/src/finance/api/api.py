from fastapi import APIRouter, Depends

from finance.api.ratelimit import health_limiter
from finance.api.auth import router as auth_router
from finance.api.crypto import router as crypto_router
from finance.api.doviz import router as doviz_router
from finance.api.financials import router as financials_router
from finance.api.heatmap import router as heatmap_router
from finance.api.market import router as market_router
from finance.api.portfolio import router as portfolio_router
from finance.api.terminal import router as terminal_router
from finance.api.watchlist import router as watchlist_router
from finance.api.ws import router as ws_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(crypto_router)
router.include_router(doviz_router)
router.include_router(financials_router)
router.include_router(heatmap_router)
router.include_router(market_router)
router.include_router(portfolio_router)
router.include_router(terminal_router)
router.include_router(watchlist_router)
router.include_router(ws_router)

@router.get("/health", dependencies=[Depends(health_limiter)])
async def health_check():
    return {"status": "ok"}

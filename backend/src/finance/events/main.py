import asyncio

from finance.database.connections import close_client, get_client
from finance.services import alpaca, finnhub_service, worker
from finance.services.cache import close_redis
from finance.services.providers import registry
from finance.services.providers.alpaca_provider import AlpacaProvider
from finance.services.providers.doviz_provider import DovizProvider
from finance.api.market import ALL_SYMBOLS
from finance.core.config import settings

async def on_startup() -> None:
    get_client()
    worker.start()

    if settings.ALPACA_STREAM_ENABLED:
        registry.register(AlpacaProvider(ALL_SYMBOLS))
    if settings.DOVIZ_ENABLED:
        registry.register(DovizProvider())
    if settings.CRYPTO_ENABLED:
        from finance.services.providers.crypto_provider import CryptoProvider
        registry.register(CryptoProvider())

    loop = asyncio.get_event_loop()
    registry.start_all(loop)

async def on_shutdown() -> None:
    await registry.stop_all()
    await worker.stop()
    await alpaca.close_client()
    await finnhub_service.close_client()
    await close_redis()
    await close_client()

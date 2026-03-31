import asyncio
import logging

from finance.services.providers.base import MarketDataProvider

logger = logging.getLogger("finance.providers")

class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, MarketDataProvider] = {}

    def register(self, provider: MarketDataProvider) -> None:
        self._providers[provider.name] = provider
        logger.info("Registered provider: %s", provider.name)

    def get(self, name: str) -> MarketDataProvider | None:
        return self._providers.get(name)

    @property
    def all(self) -> list[MarketDataProvider]:
        return list(self._providers.values())

    @property
    def channels(self) -> list[str]:
        return [p.pubsub_channel for p in self._providers.values()]

    def start_all(self, loop: asyncio.AbstractEventLoop) -> None:
        for p in self._providers.values():
            p.start(loop)
            logger.info("Started provider: %s", p.name)

    async def stop_all(self) -> None:
        for p in self._providers.values():
            await p.stop()
            logger.info("Stopped provider: %s", p.name)

registry = ProviderRegistry()

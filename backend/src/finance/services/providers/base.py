import abc
import asyncio

class MarketDataProvider(abc.ABC):
    @property
    @abc.abstractmethod
    def name(self) -> str:
        ...

    @property
    @abc.abstractmethod
    def pubsub_channel(self) -> str:
        ...

    @abc.abstractmethod
    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        ...

    @abc.abstractmethod
    async def stop(self) -> None:
        ...

    @property
    def symbols(self) -> list[str]:
        return []

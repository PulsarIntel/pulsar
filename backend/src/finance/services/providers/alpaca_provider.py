from finance.services import stream
from finance.services.providers.base import MarketDataProvider

class AlpacaProvider(MarketDataProvider):
    def __init__(self, symbols: list[str]) -> None:
        self._symbols = symbols

    @property
    def name(self) -> str:
        return "alpaca"

    @property
    def pubsub_channel(self) -> str:
        return stream.PUBSUB_CHANNEL

    def start(self, loop) -> None:
        stream.start(self._symbols)

    async def stop(self) -> None:
        await stream.stop()

    @property
    def symbols(self) -> list[str]:
        return self._symbols

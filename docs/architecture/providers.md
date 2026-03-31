# Provider System

Pulsar uses an extensible provider architecture for data sources. Each provider implements the `MarketDataProvider` abstract base class and is registered at startup.

## Base Class

```python
class MarketDataProvider(abc.ABC):
    @property
    @abc.abstractmethod
    def name(self) -> str: ...

    @property
    @abc.abstractmethod
    def pubsub_channel(self) -> str: ...

    @abc.abstractmethod
    def start(self, loop: asyncio.AbstractEventLoop) -> None: ...

    @abc.abstractmethod
    async def stop(self) -> None: ...

    @property
    def symbols(self) -> list[str]:
        return []
```

## Provider Registry

```python
registry = ProviderRegistry()
registry.register(AlpacaProvider(symbols))
registry.register(DovizProvider())
registry.register(CryptoProvider())
registry.start_all(loop)
```

## Implemented Providers

### AlpacaProvider
- **Source**: Alpaca SIP WebSocket feed
- **Channel**: `quotes:stock`
- **Data**: Trades, quotes, bars for 80+ US stocks
- **Auth**: API key/secret

### DovizProvider
- **Source**: doviz.com WebSocket
- **Channel**: `quotes:doviz`
- **Data**: Turkish gold (17 variants), silver, USD/EUR/GBP from 38 banks
- **Protocol**: Custom JSON with room subscription

### CryptoProvider
- **Source**: Binance REST API
- **Channel**: `quotes:crypto`
- **Data**: 30+ cryptocurrency pairs with 24h change data
- **Polling**: Every 10 seconds

## Adding a New Provider

1. Create a new file in `services/providers/`
2. Extend `MarketDataProvider`
3. Implement `start()` with WebSocket/polling logic
4. Publish normalized data to Redis via `_publish()`
5. Register in `events/main.py`
6. Add a `BroadcastManager` instance in `ws.py`
7. Create REST endpoints in a new `api/` router

The normalized data format:
```json
{
  "type": "crypto_quote",
  "provider": "binance",
  "exchange": "binance",
  "ticker": "BTC/USD",
  "name": "Bitcoin",
  "price": 66354.96,
  "bid": 66350.0,
  "ask": 66360.0,
  "change": -520.15,
  "changePercent": -0.78,
  "volume": 7500,
  "timestamp": "2026-03-31T10:00:00Z"
}
```

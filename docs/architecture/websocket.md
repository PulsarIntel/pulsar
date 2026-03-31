# WebSocket Streaming

Pulsar uses three independent WebSocket connections for real-time data.

## Endpoints

| Endpoint | Data | Protocol |
|----------|------|----------|
| `/ws/quotes` | Stock trades & quotes | Subscribe per ticker |
| `/ws/doviz` | Turkish currency/gold | Broadcasts all data |
| `/ws/crypto` | Cryptocurrency prices | Broadcasts all data |

## Stock WebSocket Protocol

### Subscribe
```json
{"action": "subscribe", "symbols": ["AAPL", "MSFT", "TSLA"]}
```

### Unsubscribe
```json
{"action": "unsubscribe", "symbols": ["TSLA"]}
```

### Receive (batched every 300ms)
```json
[
  {"type": "trade", "ticker": "AAPL", "price": 247.25, "timestamp": "..."},
  {"type": "quote", "ticker": "MSFT", "bidPrice": 356.10, "askPrice": 356.20, "timestamp": "..."}
]
```

## Doviz & Crypto WebSocket

These are broadcast-only -- no subscription protocol. All connected clients receive all data.

### Receive
```json
[
  {"type": "doviz_quote", "ticker": "gram-altin", "name": "Gram Gold", "price": 6418.21},
  {"type": "crypto_quote", "ticker": "BTC/USD", "name": "Bitcoin", "price": 66354.96}
]
```

## Connection Management

The `BroadcastManager` base class handles:
- Client connection/disconnection tracking
- Per-client message batching (300ms flush interval)
- Redis Pub/Sub subscription
- Automatic dead client cleanup

The `ConnectionManager` (stocks) extends this with per-client symbol filtering -- only sending data for tickers the client subscribed to.

## Frontend Reconnection

All three WebSocket managers use exponential backoff:
- Initial delay: 1 second
- Doubles on each failure
- Maximum: 30 seconds
- Resets on successful connection

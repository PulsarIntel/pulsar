# WebSocket API

## Stock Quotes

```
ws://localhost:8000/api/ws/quotes
```

### Subscribe
```json
{"action": "subscribe", "symbols": ["AAPL", "MSFT"]}
```

### Unsubscribe
```json
{"action": "unsubscribe", "symbols": ["AAPL"]}
```

### Messages (batched every 300ms)
```json
[
  {"type": "trade", "ticker": "AAPL", "price": 247.25, "size": 100, "timestamp": "2026-03-31T14:30:00Z"},
  {"type": "quote", "ticker": "MSFT", "bidPrice": 356.10, "askPrice": 356.20, "bidSize": 200, "askSize": 150}
]
```

## Turkish Currencies

```
ws://localhost:8000/api/ws/doviz
```

Broadcast-only. No subscription protocol. Receives all currency/gold updates.

## Cryptocurrency

```
ws://localhost:8000/api/ws/crypto
```

Broadcast-only. Receives all crypto price updates.

# Data Flow

## Stock Data Pipeline

```
Alpaca SIP WebSocket
    │
    ▼
AlpacaProvider.start()
    │ Receives trades, quotes, bars
    ▼
Throttle (300ms batching)
    │
    ▼
Redis Pub/Sub (quotes:stock)
    │
    ├──► ConnectionManager._listen_redis()
    │        │ Filters by client subscriptions
    │        ▼
    │    WebSocket /ws/quotes
    │        │
    │        ▼
    │    Frontend RealtimeManager
    │        │
    │        ▼
    │    Zustand market-store
    │
    └──► Worker._fetch_snapshots() [every 30s/5min]
             │ Caches in Redis
             ▼
         REST /market/quotes
             │
             ▼
         Frontend useAllQuotes() hook
```

## Currency Data Pipeline

```
doviz.com WebSocket
    │ Custom protocol (joinTo rooms, compact JSON)
    ▼
DovizProvider._run()
    │ Normalizes price data
    ▼
Throttle (300ms)
    │
    ▼
Redis Pub/Sub (quotes:doviz) + Hash (doviz:quotes)
    │
    ├──► BroadcastManager (broadcasts to all clients)
    │        │
    │        ▼
    │    WebSocket /ws/doviz
    │        │
    │        ▼
    │    Frontend DovizRealtimeManager
    │        │
    │        ▼
    │    Zustand doviz-store
    │
    └──► REST /doviz/quotes (reads from Redis hash)
```

## Crypto Data Pipeline

```
Binance REST API (24hr ticker)
    │
    ▼
CryptoProvider._run()
    │ Polls every 10 seconds
    │ Normalizes to standard format
    ▼
Redis Pub/Sub (quotes:crypto) + Hash (crypto:quotes)
    │
    ├──► BroadcastManager
    │        │
    │        ▼
    │    WebSocket /ws/crypto
    │
    └──► REST /crypto/quotes
```

## Financials Data Pipeline

```
Finnhub REST API
    │
    ▼
finnhub_service.py
    │ 7 endpoint types
    ▼
Redis Cache (1h-24h TTL)
    │
    ▼
REST /financials/company/{symbol}/overview
    │
    ▼
Frontend financials-store (on-demand fetch)
```

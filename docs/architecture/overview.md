# Architecture Overview

Pulsar follows a client-server architecture with real-time data streaming via WebSockets and REST APIs for historical data.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Data Sources                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Alpaca   │  │ Binance  │  │ doviz.com│  │ Finnhub  │    │
│  │  (SIP)   │  │  (REST)  │  │   (WS)   │  │  (REST)  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │              │              │          │
└───────┼──────────────┼──────────────┼──────────────┼─────────┘
        │              │              │              │
┌───────▼──────────────▼──────────────▼──────────────▼─────────┐
│                    Backend (FastAPI)                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Provider Registry                       │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │     │
│  │  │ Alpaca   │  │  Crypto  │  │  Doviz   │          │     │
│  │  │ Provider │  │ Provider │  │ Provider │          │     │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │     │
│  └───────┼──────────────┼──────────────┼────────────────┘     │
│          │              │              │                       │
│  ┌───────▼──────────────▼──────────────▼────────────────┐     │
│  │                Redis Pub/Sub                          │     │
│  │  quotes:stock    quotes:crypto    quotes:doviz        │     │
│  └───────┬──────────────┬──────────────┬────────────────┘     │
│          │              │              │                       │
│  ┌───────▼──────────────▼──────────────▼────────────────┐     │
│  │           WebSocket Connection Managers                │     │
│  │  /ws/quotes      /ws/crypto      /ws/doviz            │     │
│  └───────┬──────────────┬──────────────┬────────────────┘     │
│          │              │              │                       │
│  ┌───────┴──────────────┴──────────────┴────────────────┐     │
│  │              REST API Endpoints                        │     │
│  │  /market  /crypto  /doviz  /financials  /portfolio     │     │
│  └──────────────────────┬───────────────────────────────┘     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Frontend (Next.js)   │
              │                        │
              │  ┌──────────────────┐  │
              │  │  Zustand Stores  │  │
              │  │  market / doviz  │  │
              │  │  crypto / fin    │  │
              │  └────────┬─────────┘  │
              │           │            │
              │  ┌────────▼─────────┐  │
              │  │    React Pages   │  │
              │  │  Dashboard       │  │
              │  │  Stocks          │  │
              │  │  Currencies      │  │
              │  │  Crypto          │  │
              │  │  Terminal        │  │
              │  │  Portfolio       │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

## Key Design Decisions

### Provider Abstraction
All data sources implement the `MarketDataProvider` abstract base class with `start()`, `stop()`, `name`, and `pubsub_channel`. This allows adding new data sources (exchanges, brokers) without modifying existing code.

### Redis as Message Bus
Providers publish normalized data to Redis Pub/Sub channels. WebSocket managers subscribe to these channels and forward to connected clients. This decouples data ingestion from delivery and allows horizontal scaling.

### Throttled Delivery
Both providers and WebSocket managers batch updates at 300ms intervals. This prevents client saturation during high-frequency trading periods while maintaining near-real-time feel.

### Worker Cache Pattern
A background worker periodically fetches and caches snapshot data in Redis (TTL: 15 minutes). REST endpoints read from this cache first, falling back to direct API calls when cache is empty. This ensures data availability during provider reconnections.

### Frontend State Architecture
Zustand stores hold all market data globally. Pages subscribe to relevant slices. WebSocket managers update stores directly, triggering React re-renders only for changed data.

# Backend Architecture

The backend is a Python FastAPI application that aggregates data from multiple financial APIs and serves it to the frontend via REST and WebSocket endpoints.

## Entry Point

`main.py` creates the FastAPI app with:
- CORS middleware (configurable origins)
- JWT secret validation on startup
- Lifespan management (startup/shutdown)
- API router mounted at `/api`

## Startup Sequence

```
1. Validate JWT_SECRET is set
2. Initialize MongoDB connection
3. Start background worker (snapshot polling)
4. Register providers:
   - AlpacaProvider (if ALPACA_STREAM_ENABLED)
   - DovizProvider (if DOVIZ_ENABLED)
   - CryptoProvider (if CRYPTO_ENABLED)
5. Start all providers (WebSocket connections)
```

## API Layer

All endpoints are organized by domain:

| Router | Prefix | Auth | Rate Limit |
|--------|--------|------|------------|
| auth | /auth | Mixed | 10/min |
| market | /market | No | 120/min |
| crypto | /crypto | No | 120/min |
| doviz | /doviz | No | 120/min |
| financials | /financials | No | 30/min |
| portfolio | /portfolio | Yes | 60/min |
| watchlist | /watchlist | Yes | 60/min |
| terminal | /terminal | Yes | 60/min |
| heatmap | /heatmaps | Yes | 60/min |

## Authentication

JWT-based authentication using `PyJWT` and `bcrypt`:
- Tokens expire after 24 hours (configurable)
- Shared `_get_user_id()` dependency in `deps.py`
- Rate limiter identifies users by JWT `sub` claim when authenticated, IP when anonymous

## Database

MongoDB via Motor (async driver):
- `users` collection: accounts
- `holdings` collection: portfolio positions
- `watchlists` collection: per-user ticker lists
- `terminal_layouts` collection: widget configurations
- `custom_heatmaps` collection: user-created heatmaps

## Caching

Redis serves dual purpose:
1. **Pub/Sub**: Real-time data distribution between providers and WebSocket managers
2. **Key-Value Cache**: Worker snapshots, API response caching with configurable TTLs

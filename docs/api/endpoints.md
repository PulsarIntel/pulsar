# API Endpoints

Base URL: `http://localhost:8000/api` (development) or your production URL.

## Overview

| Group | Endpoints | Auth | Rate Limit |
|-------|-----------|------|------------|
| [Authentication](/api/authentication) | 4 | Mixed | 10/min |
| [Market Data](/api/market) | 8 | No | 120/min |
| [Crypto](/api/crypto) | 4 | No | 120/min |
| [Currencies](/api/doviz) | 3 | No | 120/min |
| [Financials](/api/financials) | 8 | No | 30/min |
| [Portfolio](/api/portfolio) | 3 | Yes | 60/min |
| [Watchlist](/api/watchlist) | 3 | Yes | 60/min |
| [Terminal](/api/terminal) | 2 | Yes | 60/min |
| [WebSocket](/api/websocket) | 3 | No | N/A |

Total: 40 endpoints

## Rate Limiting

Rate limits are per IP+path for anonymous requests, per user+path for authenticated requests.

When exceeded, the server returns:
```json
HTTP 429 Too Many Requests
{"detail": "Too Many Requests"}
```

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Obtain a token via `POST /api/auth/login` or `POST /api/auth/register`.

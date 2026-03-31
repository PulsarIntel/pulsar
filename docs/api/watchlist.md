# Watchlist API

All endpoints require authentication.

## Get Watchlist
```
GET /api/watchlist/items
Authorization: Bearer <token>
```

Returns array of ticker strings.

## Add to Watchlist
```
POST /api/watchlist/items
Authorization: Bearer <token>
```

**Body:**
```json
{"ticker": "AAPL"}
```

## Remove from Watchlist
```
DELETE /api/watchlist/items/{ticker}
Authorization: Bearer <token>
```

Note: For crypto tickers with `/` (e.g., `BTC/USD`), URL-encode the slash: `BTC%2FUSD`.

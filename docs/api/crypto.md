# Crypto API

## Get All Quotes

```
GET /api/crypto/quotes
```

**Response:**
```json
{
  "BTC/USD": {
    "type": "crypto_quote",
    "provider": "binance",
    "exchange": "binance",
    "ticker": "BTC/USD",
    "name": "Bitcoin",
    "symbol": "BTC",
    "price": 66354.96,
    "bid": 66350.0,
    "ask": 66360.0,
    "change": -520.15,
    "changePercent": -0.78,
    "volume": 7500,
    "timestamp": "2026-03-31T10:00:00Z"
  }
}
```

## Get Single Quote

```
GET /api/crypto/quotes/BTC%2FUSD
```

Note: URL-encode the `/` in the symbol.

## Get Available Symbols

```
GET /api/crypto/symbols
```

## Get Historical Bars

```
GET /api/crypto/bars/BTC%2FUSD?timeframe=1Day&limit=30
```

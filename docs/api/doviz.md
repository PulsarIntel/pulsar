# Currencies (Doviz) API

## Get All Quotes
```
GET /api/doviz/quotes
GET /api/doviz/quotes?category=gold
```

Returns all Turkish currency, gold, and precious metal quotes. Optionally filter by category: `gold`, `silver`, `precious_metals`, `currency`, `index`.

## Get Single Quote
```
GET /api/doviz/quotes/{symbol}
```

## Get Available Symbols
```
GET /api/doviz/symbols
```

Returns all available symbols grouped by category, including bank-specific tickers.

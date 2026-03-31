# Market Data API

## Get Quotes

```
GET /api/market/quotes?symbols=AAPL,TSLA,META
GET /api/market/quotes?symbols=all
```

**Response:**
```json
{
  "AAPL": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "price": 247.25,
    "change": -4.07,
    "changePercent": -1.62,
    "open": 250.12,
    "high": 251.30,
    "low": 246.80,
    "previousClose": 251.32,
    "volume": "45230100",
    "sector": "Technology",
    "industry": "Consumer Electronics"
  }
}
```

## Get Historical Bars

```
GET /api/market/bars/{symbol}?range=5D&interval=15m
```

**Parameters:**
- `range`: 1D, 5D, 1M, 3M, 6M, YTD, 1Y, 5Y
- `interval`: 1m, 5m, 15m, 1h, 4h, D, W, M

**Response:**
```json
[
  {
    "time": "2026-03-28T13:30:00Z",
    "open": 247.10,
    "high": 247.50,
    "low": 246.80,
    "close": 247.25,
    "volume": 125000
  }
]
```

## Get Heatmap

```
GET /api/market/heatmap
```

Returns sector-grouped stock performance data.

## Get Movers

```
GET /api/market/movers
```

Returns top 20 gainers and losers.

## Get News

```
GET /api/market/news
```

Returns latest 30 market news articles from Alpaca.

## Get Assets

```
GET /api/market/assets
```

Returns searchable list of all tradeable stock symbols.

## Get Market Status

```
GET /api/market/status
```

Returns worker status including last update time and market open/closed state.

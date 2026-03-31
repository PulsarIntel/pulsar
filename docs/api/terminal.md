# Terminal API

All endpoints require authentication.

## Get Widget Layout
```
GET /api/terminal/widgets
Authorization: Bearer <token>
```

Returns array of widget objects with position, size, type, and page number.

## Save Widget Layout
```
PUT /api/terminal/widgets
Authorization: Bearer <token>
```

**Body:**
```json
{
  "widgets": [
    {
      "id": "w-1711900000000",
      "type": "chart",
      "ticker": "AAPL",
      "title": "Chart — AAPL",
      "x": 0,
      "y": 0,
      "w": 720,
      "h": 520,
      "page": 1
    }
  ]
}
```

## Widget Types

| Type | Description | Requires Ticker |
|------|-------------|-----------------|
| `chart` | Full candlestick chart | Yes |
| `mini-chart` | Compact area chart | Yes |
| `watchlist` | Live price list | No |
| `news` | Market news feed | No |
| `portfolio` | Holdings with P&L | No |
| `heatmap` | Custom heatmap | Yes (heatmap ID) |
| `currency` | Bank rate comparison | No (bank selected in widget) |

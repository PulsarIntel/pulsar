# Portfolio API

All endpoints require authentication.

## Get Holdings
```
GET /api/portfolio/holdings
Authorization: Bearer <token>
```

## Add Holding
```
POST /api/portfolio/holdings
Authorization: Bearer <token>
```

**Body:**
```json
{
  "ticker": "AAPL",
  "shares": 10,
  "avg_cost": 150.00,
  "bought_at": "2026-01-15",
  "currency": "USD"
}
```

## Delete Holding
```
DELETE /api/portfolio/holdings/{holding_id}
Authorization: Bearer <token>
```

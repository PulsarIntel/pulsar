# Financials API

All endpoints proxy Finnhub data with Redis caching (1-24 hour TTL).

## Earnings Calendar
```
GET /api/financials/earnings-calendar?from=2026-03-01&to=2026-03-31
```

## Company Overview (Combined)
```
GET /api/financials/company/{symbol}/overview
```

Returns metrics, earnings history, recommendations, revenue/EPS estimates, and earnings quality in a single response.

## Individual Endpoints
```
GET /api/financials/company/{symbol}/metrics
GET /api/financials/company/{symbol}/earnings
GET /api/financials/company/{symbol}/recommendations
GET /api/financials/company/{symbol}/revenue-estimates
GET /api/financials/company/{symbol}/eps-estimates
GET /api/financials/company/{symbol}/earnings-quality
```

# Rate Limiting

Pulsar uses per-route rate limiting with intelligent identification.

## Limits

| Router | Limit | Description |
|--------|-------|-------------|
| Auth | 10/min | Login, register, profile |
| Market | 120/min | Stock quotes, bars, heatmap, movers, news |
| Crypto | 120/min | Crypto quotes, bars, symbols |
| Doviz | 120/min | Currency quotes, symbols |
| Financials | 30/min | Company data (proxies Finnhub) |
| Portfolio | 60/min | Holdings CRUD |
| Watchlist | 60/min | Watchlist CRUD |
| Terminal | 60/min | Widget layout save/load |
| Heatmap | 60/min | Custom heatmap CRUD |
| Health | 300/min | Health check endpoint |

## Identification

The rate limiter identifies clients by:

| Scenario | Key Format |
|----------|------------|
| Authenticated | `user:{jwt_sub}:{path}` |
| Anonymous | `ip:{client_ip}:{path}` |

When a valid JWT is present in the Authorization header, the user's ID from the token `sub` claim is used. This ensures:
- Each user has independent rate limits regardless of IP
- Multiple users behind the same NAT don't share limits
- IP-hopping doesn't reset a user's rate limit

## Response

When rate limit is exceeded:

```
HTTP 429 Too Many Requests
```

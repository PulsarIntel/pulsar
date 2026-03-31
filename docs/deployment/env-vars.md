# Environment Variables

## Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | -- | JWT signing secret (app fails without it) |
| `MONGODB_URL` | Yes | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | No | `finance` | Database name |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string |
| `ALLOWED_ORIGINS` | No | `localhost:3000,3001` | CORS allowed origins (comma-separated) |
| `ALPACA_API_KEY` | Yes | -- | Alpaca API key |
| `ALPACA_API_SECRET` | Yes | -- | Alpaca API secret |
| `ALPACA_FEED` | No | `sip` | Alpaca data feed (sip or iex) |
| `ALPACA_STREAM_ENABLED` | No | `true` | Enable Alpaca WebSocket |
| `DOVIZ_ENABLED` | No | `true` | Enable Turkish currency provider |
| `CRYPTO_ENABLED` | No | `true` | Enable cryptocurrency provider |
| `FINNHUB_API_KEY` | No | -- | Finnhub API key |
| `CDN_BASE_URL` | No | -- | CDN base URL for bank icons |

## Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api` | Backend API URL |

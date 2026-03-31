# Quick Start

## Prerequisites

- Python 3.12+
- Node.js 18+ or Bun
- MongoDB
- Redis
- API keys: Alpaca, Finnhub (optional: Binance)

## Clone the Repository

```bash
git clone https://github.com/PulsarIntel/pulsar.git
cd pulsar
```

## Backend Setup

```bash
cd backend
cp .env.sample .env    # Edit with your API keys
pip install pdm
pdm install
pdm run uvicorn finance.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
bun install
bun dev
```

The frontend will be available at `http://localhost:3000`.

## Environment Variables

Create `backend/.env` with:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=finance
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:3000
ALPACA_API_KEY=your-alpaca-key
ALPACA_API_SECRET=your-alpaca-secret
ALPACA_FEED=sip
FINNHUB_API_KEY=your-finnhub-key
```

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Verify Setup

1. Open `http://localhost:3000` in your browser
2. Register a new account
3. The dashboard should show market data (when markets are open)
4. Navigate to Currencies to see Turkish gold/currency prices (always streaming)

# Project Structure

```
pulsar/
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.sample
│   └── src/finance/
│       ├── main.py                 # FastAPI app entry point
│       ├── api/                    # REST & WebSocket endpoints
│       │   ├── api.py              # Router registration
│       │   ├── auth.py             # Registration, login, profile
│       │   ├── crypto.py           # Cryptocurrency endpoints
│       │   ├── deps.py             # Shared dependencies (auth)
│       │   ├── doviz.py            # Turkish currency endpoints
│       │   ├── financials.py       # Company financials (Finnhub)
│       │   ├── heatmap.py          # Custom heatmap CRUD
│       │   ├── market.py           # Stock market data
│       │   ├── portfolio.py        # Portfolio management
│       │   ├── ratelimit.py        # Rate limiting configuration
│       │   ├── terminal.py         # Terminal widget layouts
│       │   ├── watchlist.py        # Watchlist management
│       │   └── ws.py               # WebSocket managers
│       ├── core/
│       │   ├── config.py           # Settings (env vars)
│       │   ├── exceptions.py       # Custom exceptions
│       │   └── handlers.py         # Error handlers
│       ├── database/
│       │   └── connections.py      # MongoDB connection
│       ├── events/
│       │   └── main.py             # Startup/shutdown lifecycle
│       ├── models/
│       │   └── schemas.py          # All Pydantic models
│       └── services/
│           ├── alpaca.py           # Alpaca REST client
│           ├── cache.py            # Redis helper
│           ├── finnhub_service.py  # Finnhub REST client
│           ├── stream.py           # Alpaca WebSocket stream
│           ├── worker.py           # Background data fetcher
│           └── providers/
│               ├── base.py         # Abstract provider class
│               ├── registry.py     # Provider registry
│               ├── alpaca_provider.py
│               ├── crypto_provider.py
│               └── doviz_provider.py
├── frontend/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── page.tsx                # Landing page
│   │   ├── globals.css             # Design tokens, animations
│   │   ├── (app)/                  # Authenticated app routes
│   │   │   ├── layout.tsx          # App layout (sidebar, toolbox)
│   │   │   ├── dashboard/
│   │   │   ├── stocks/
│   │   │   ├── currencies/
│   │   │   ├── crypto/
│   │   │   ├── portfolio/
│   │   │   ├── watchlist/
│   │   │   ├── heatmap/
│   │   │   ├── financials/
│   │   │   ├── terminal/
│   │   │   └── profile/
│   │   └── (auth)/                 # Auth routes (login, signup)
│   ├── components/
│   │   ├── ui/                     # Primitive UI components
│   │   ├── shared/                 # Shared components
│   │   ├── charts/                 # Chart wrapper
│   │   ├── dashboard/              # Dashboard widgets
│   │   ├── doviz/                  # Currency components
│   │   ├── crypto/                 # Crypto components
│   │   ├── financials/             # Financial analysis
│   │   ├── portfolio/              # Portfolio components
│   │   ├── stocks/                 # Stock detail components
│   │   └── terminal/               # Terminal widget system
│   └── lib/
│       ├── constants.ts            # API_BASE, ticker utils
│       ├── auth.ts                 # JWT helpers
│       ├── format.ts               # Number/date formatters
│       ├── types.ts                # Shared TypeScript types
│       ├── stores/                 # Zustand global stores
│       ├── hooks/                  # React hooks
│       ├── realtime-manager.ts     # Stock WebSocket
│       ├── doviz-realtime-manager.ts
│       └── crypto-realtime-manager.ts
└── docs/                           # This documentation
```

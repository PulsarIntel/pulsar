# Introduction

Pulsar is an open-source market intelligence platform that aggregates real-time financial data from multiple sources into a single, customizable interface.

## What is Pulsar?

Pulsar brings together:

- **US Stock Market** data from Alpaca (NYSE, NASDAQ, Cboe, IEX)
- **Turkish Currency & Gold** prices from 38+ banks via doviz.com
- **Cryptocurrency** prices from Binance
- **Company Financials** from Finnhub (earnings, analyst ratings, quality scores)

All data streams in real-time via WebSocket connections and is displayed through a modern, dark-themed interface built with Next.js.

## Key Features

| Feature | Description |
|---------|-------------|
| Dashboard | Market overview with sector indices, movers, trending stocks, and news |
| Stocks | Individual stock pages with candlestick charts and key statistics |
| Currencies | Turkish gold, silver, and forex prices with bank comparison |
| Crypto | Real-time cryptocurrency prices with 24h change data |
| Portfolio | Track holdings with live P&L across all asset types |
| Watchlist | Monitor favorite assets with real-time price updates |
| Heatmap | Sector performance visualization with custom heatmaps |
| Terminal | Drag-and-drop workspace with 8 widget types across 3 pages |
| Financials | Earnings calendar, analyst recommendations, and quality scores |

## Tech Stack

```
Backend       Python, FastAPI, MongoDB, Redis, WebSockets
Frontend      Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand
Charts        Lightweight Charts (TradingView)
Fonts         Space Grotesk (body) + Space Mono (headings, data)
Deployment    Vercel (frontend) + Coolify (backend) + Cloudflare (DNS, R2)
```

## Data Sources

| Provider | Data | Protocol |
|----------|------|----------|
| Alpaca | US stocks, ETFs (SIP feed) | REST + WebSocket |
| Binance | Cryptocurrency prices | REST + WebSocket |
| doviz.com | Turkish gold, silver, currencies, bank rates | WebSocket |
| Finnhub | Earnings, analyst ratings, financial metrics | REST |

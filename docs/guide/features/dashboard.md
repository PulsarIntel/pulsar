# Dashboard

The main landing page after login showing a market overview.

## Components

- **Market Overview**: Sector index cards (Technology, Financials, Healthcare, Energy) with daily change
- **Market Movers**: Top gainers and losers
- **Trending Stocks**: Most active stocks sorted by volume
- **Market News**: Latest financial news from Alpaca

## Data Sources

- Stock quotes: Alpaca REST + WebSocket
- News: Alpaca News API (polled every 2 minutes)

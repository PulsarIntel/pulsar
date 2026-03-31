# Frontend Architecture

The frontend is a Next.js 16 application using the App Router with React 19, TypeScript, and Tailwind CSS.

## Routing

```
(app)/                  Authenticated layout (sidebar + toolbox)
  dashboard/            Market overview
  stocks/               Stock list + [ticker] detail
  currencies/           Turkish gold/currency prices
  crypto/               Cryptocurrency prices + [symbol] detail
  portfolio/            Holdings management
  watchlist/            Tracked assets
  heatmap/              Sector performance + custom heatmaps
  terminal/             Custom workspace (3 pages)
  financials/           Company analysis
  profile/              User settings
(auth)/                 Auth layout (centered card)
  login/
  signup/
```

## State Management

Zustand stores with no persistence (data always fresh from API/WebSocket):

| Store | Data | Updated By |
|-------|------|------------|
| `market-store` | Stock quotes, heatmap, movers, news, assets | REST polling + WebSocket |
| `doviz-store` | Turkish currency/gold quotes, symbols | REST + WebSocket |
| `crypto-store` | Cryptocurrency quotes | REST + WebSocket |
| `financials-store` | Company overview, earnings, recommendations | REST on demand |

## Real-Time Data Flow

```
Server WebSocket ──► RealtimeManager ──► Zustand Store ──► React Component
                     (reconnects)        (merges)          (re-renders)
```

Three independent WebSocket managers:
- `realtime-manager.ts` -- Stock quotes (`/ws/quotes`)
- `doviz-realtime-manager.ts` -- Currencies (`/ws/doviz`)
- `crypto-realtime-manager.ts` -- Crypto (`/ws/crypto`)

All use exponential backoff (1s to 30s) on reconnection.

## Design System

- **Fonts**: Space Grotesk (body), Space Mono (headings, prices)
- **Colors**: Monochrome base with semantic green/red accents
- **Border radius**: 0 (fully square corners)
- **Depth**: Borders only, no shadows
- **Positive**: `oklch(0.72 0.13 152)` -- smooth green
- **Negative**: `oklch(0.68 0.13 25)` -- smooth red

## Component Architecture

```
UI Components (button, input, card, badge)
    ↓
Shared Components (asset-row, header, sidebar, search-bar)
    ↓
Feature Components (dashboard, stocks, doviz, crypto, terminal)
    ↓
Pages (app router)
```

# State Management

Pulsar uses Zustand for global state management with four independent stores.

## Stores

### market-store
Holds all stock market data:
- `quotes` -- per-symbol quotes (from REST fetch)
- `allQuotes` -- all quotes from worker cache
- `heatmap` -- sector performance data
- `movers` -- top gainers/losers
- `news` -- market news articles
- `assets` -- searchable stock list
- `realtimeQuotes` -- latest WebSocket updates

### doviz-store
Holds Turkish currency/gold data:
- `quotes` -- all doviz prices (keyed by ticker)
- `symbols` -- available symbols and categories
- `connected` -- WebSocket connection status

### crypto-store
Holds cryptocurrency data:
- `quotes` -- all crypto prices
- `connected` -- WebSocket connection status

### financials-store
Holds company analysis data (loaded on demand):
- `overview` -- combined company data per symbol
- Fetched when user visits the financials page or searches a symbol

## Data Merging Strategy

Pages that display multiple asset types merge data from all relevant stores:

```typescript
const quotes = useMemo(() => {
  const merged = {}

  // Stock quotes from allQuotes (worker cache) + specific fetches
  for (const t of stockTickers) {
    merged[t] = allQuotes?.[t] || specificQuotes?.[t]
  }

  // Doviz quotes from doviz store
  for (const t of dovizTickers) {
    merged[t] = dovizQuotes[t]
  }

  // Crypto quotes from crypto store
  for (const t of cryptoTickers) {
    merged[t] = cryptoQuotes[t]
  }

  return merged
}, [stockTickers, allQuotes, specificQuotes, dovizQuotes, cryptoQuotes])
```

## Resilience

- `fetchAllQuotes` and `fetchSymbolQuotes` never overwrite existing data with empty responses
- `useSymbolQuotes` caches the last valid result via `useRef` -- prevents UI flash during re-fetch cycles
- All WebSocket managers reconnect automatically with exponential backoff

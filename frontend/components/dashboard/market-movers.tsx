"use client"

import { useMovers, useQuotes } from "@/lib/hooks/use-market-data"
import { AssetRow } from "@/components/shared/asset-row"
import { AssetList } from "@/components/shared/asset-list"

function MarketMovers() {
  const { data: movers, loading: moversLoading } = useMovers()
  const { data: quotes } = useQuotes()

  if (moversLoading) {
    return (
      <section data-slot="market-movers" className="grid gap-4 sm:grid-cols-2">
        {["Top Gainers", "Top Losers"].map((label) => (
          <div key={label}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{label}</h2>
            <AssetList variant="card" loading skeletonCount={4} />
          </div>
        ))}
      </section>
    )
  }

  const gainers = (movers?.gainers || []).slice(0, 4)
  const losers = (movers?.losers || []).slice(0, 4)

  return (
    <section data-slot="market-movers" className="grid gap-4 sm:grid-cols-2">
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Top Gainers</h2>
        <AssetList variant="card">
          {gainers.map((m) => (
            <AssetRow
              key={m.symbol}
              variant="card"
              ticker={m.symbol}
              title={m.symbol}
              subtitle={quotes?.[m.symbol]?.name || m.symbol}
              price={m.price}
              changePercent={m.percent_change}
              href={`/stocks/${m.symbol}`}
            />
          ))}
        </AssetList>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Top Losers</h2>
        <AssetList variant="card">
          {losers.map((m) => (
            <AssetRow
              key={m.symbol}
              variant="card"
              ticker={m.symbol}
              title={m.symbol}
              subtitle={quotes?.[m.symbol]?.name || m.symbol}
              price={m.price}
              changePercent={m.percent_change}
              href={`/stocks/${m.symbol}`}
            />
          ))}
        </AssetList>
      </div>
    </section>
  )
}

export { MarketMovers }

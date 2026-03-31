"use client"

import type { DovizQuoteWithBank } from "@/lib/types"
import { DovizItem } from "@/components/doviz/doviz-price-card"

interface DovizCategoryGroupProps {
  title: string
  quotes: DovizQuoteWithBank[]
  grid?: boolean
}

function DovizCategoryGroup({ title, quotes, grid }: DovizCategoryGroupProps) {
  if (quotes.length === 0) return null

  const coreQuotes = quotes.filter((q) => !q.bankId)
  const bankQuotes = quotes.filter((q) => q.bankId)

  const banksByAsset: Record<string, DovizQuoteWithBank[]> = {}
  for (const q of bankQuotes) {
    const asset = q.assetLabel || "Other"
    if (!banksByAsset[asset]) banksByAsset[asset] = []
    banksByAsset[asset].push(q)
  }

  return (
    <div>
      <h2 className="mb-3 text-xs font-medium text-muted-foreground">
        {title}
      </h2>

      {coreQuotes.length > 0 && (
        <div className={grid
          ? "mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "mb-4 space-y-2"
        }>
          {coreQuotes.map((q) => (
            <DovizItem key={q.ticker} quote={q} />
          ))}
        </div>
      )}

      {Object.entries(banksByAsset).map(([assetLabel, bQuotes]) => (
        <div key={assetLabel} className="mb-4">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            {assetLabel}
          </h3>
          <div className="space-y-2">
            {bQuotes.map((q) => (
              <DovizItem key={q.ticker} quote={q} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export { DovizCategoryGroup }

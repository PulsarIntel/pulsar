"use client"

import { useEffect } from "react"
import { useFinancialsStore, type EarningsEvent } from "@/lib/stores/financials-store"
import { AssetRow } from "@/components/shared/asset-row"
import { AssetList } from "@/components/shared/asset-list"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function EarningsCalendar({ onCompanySelect }: { onCompanySelect?: (symbol: string) => void }) {
  const events = useFinancialsStore((s) => s.earningsCalendar)
  const loading = useFinancialsStore((s) => s.calendarLoading)
  const fetch = useFinancialsStore((s) => s.fetchEarningsCalendar)

  useEffect(() => {
    if (events.length === 0) fetch()
  }, [])

  const upcoming = events.filter((e) => e.epsActual === null)
  const reported = events.filter((e) => e.epsActual !== null)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Upcoming Earnings ({upcoming.length})
        </h2>
        <AssetList variant="card" loading={loading} skeletonCount={6}>
          {upcoming.slice(0, 50).map((e) => (
            <EarningsRow key={`${e.symbol}-${e.date}`} event={e} onSelect={onCompanySelect} />
          ))}
        </AssetList>
      </section>

      {reported.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Recent Reports ({reported.length})
          </h2>
          <AssetList variant="card">
            {reported.slice(0, 30).map((e) => (
              <EarningsRow key={`${e.symbol}-${e.date}`} event={e} onSelect={onCompanySelect} />
            ))}
          </AssetList>
        </section>
      )}
    </div>
  )
}

function EarningsRow({ event, onSelect }: { event: EarningsEvent; onSelect?: (symbol: string) => void }) {
  const isReported = event.epsActual !== null
  const isBeat = isReported && event.epsEstimate !== null && event.epsActual! > event.epsEstimate

  return (
    <AssetRow
      variant="card"
      ticker={event.symbol}
      title={event.symbol}
      metadata={
        <>
          <span>{formatDate(event.date)}</span>
          {event.hour && (
            <Badge variant="secondary" className="text-[10px]">
              {event.hour === "before-market" ? "Pre-Market" : event.hour === "after-market" ? "After Hours" : "During Market"}
            </Badge>
          )}
          {event.quarter && <span>Q{event.quarter} {event.year}</span>}
        </>
      }
      href={onSelect ? undefined : `/stocks/${event.symbol}`}
      onClick={onSelect ? () => onSelect(event.symbol) : undefined}
      rightContent={
        <div className="text-right">
          <div className="flex items-center gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">EPS Est.</div>
              <div className="font-mono font-medium tabular-nums">
                {event.epsEstimate !== null ? `$${event.epsEstimate.toFixed(2)}` : "N/A"}
              </div>
            </div>
            {isReported && (
              <div>
                <div className="text-muted-foreground">EPS Actual</div>
                <div className={cn("font-mono font-medium tabular-nums", isBeat ? "text-positive" : "text-negative")}>
                  ${event.epsActual!.toFixed(2)}
                </div>
              </div>
            )}
            {event.revenueEstimate && (
              <div className="hidden sm:block">
                <div className="text-muted-foreground">Rev. Est.</div>
                <div className="font-mono font-medium tabular-nums">
                  {formatCurrency(event.revenueEstimate / 1e9, true)}B
                </div>
              </div>
            )}
          </div>
        </div>
      }
    />
  )
}

export { EarningsCalendar }

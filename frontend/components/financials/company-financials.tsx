"use client"

import { useState, useEffect } from "react"
import { useFinancialsStore, type CompanyOverview, type CompanyEarning, type RecommendationTrend, type EarningsQuality } from "@/lib/stores/financials-store"
import { StockPicker } from "@/components/shared/stock-picker"
import { LightweightChart } from "@/components/charts/lightweight-chart"
import { isDovizTicker } from "@/lib/constants"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

function CompanyFinancials({ initialSymbol }: { initialSymbol?: string }) {
  const [symbol, setSymbol] = useState(initialSymbol || "")
  const overviews = useFinancialsStore((s) => s.overviews)
  const loading = useFinancialsStore((s) => s.overviewLoading)
  const fetchOverview = useFinancialsStore((s) => s.fetchCompanyOverview)

  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol)
  }, [initialSymbol])

  useEffect(() => {
    if (symbol) fetchOverview(symbol)
  }, [symbol, fetchOverview])

  const data = overviews[symbol]
  const isLoading = loading[symbol]

  return (
    <div className="space-y-6">
      <div className="max-w-sm space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Select a company</label>
        <StockPicker value={symbol} onChange={setSymbol} />
      </div>

      {!symbol && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
          Search and select a company to view financial data
        </div>
      )}

      {symbol && isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[200px] animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      )}

      {symbol && !isDovizTicker(symbol) && data && (
        <ChartCard symbol={symbol} />
      )}

      {data && (
        <div className="space-y-6">
          <MetricsCard metrics={data.metrics.metric} />
          <EarningsHistory earnings={data.earnings} />
          {data.recommendations.length > 0 && <RecommendationsCard recommendations={data.recommendations} />}
          {(data.earningsQuality?.data?.length ?? 0) > 0 && <EarningsQualityCard quality={data.earningsQuality!} />}
        </div>
      )}
    </div>
  )
}

function MetricsCard({ metrics }: { metrics: Record<string, number | null> }) {
  const items = [
    { label: "P/E Ratio", key: "peBasicExclExtraTTM" },
    { label: "EPS (TTM)", key: "epsBasicExclExtraItemsTTM", prefix: "$" },
    { label: "Revenue/Share", key: "revenuePerShareTTM", prefix: "$" },
    { label: "ROE", key: "roeTTM", suffix: "%" },
    { label: "Net Margin", key: "netProfitMarginTTM", suffix: "%" },
    { label: "Debt/Equity", key: "totalDebt/totalEquityQuarterly" },
    { label: "Current Ratio", key: "currentRatioQuarterly" },
    { label: "Dividend Yield", key: "dividendYieldIndicatedAnnual", suffix: "%" },
    { label: "52W High", key: "52WeekHigh", prefix: "$" },
    { label: "52W Low", key: "52WeekLow", prefix: "$" },
    { label: "Beta", key: "beta" },
    { label: "10D Avg Volume", key: "10DayAverageTradingVolume", suffix: "M" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const val = metrics[item.key]
          return (
            <div key={item.key}>
              <div className="text-[11px] text-muted-foreground">{item.label}</div>
              <div className="font-mono text-sm font-medium tabular-nums">
                {val !== null && val !== undefined
                  ? `${item.prefix || ""}${typeof val === "number" ? val.toFixed(2) : val}${item.suffix || ""}`
                  : "N/A"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EarningsHistory({ earnings }: { earnings: CompanyEarning[] }) {
  const valid = earnings.filter((e) => e.actual != null && e.estimate != null)
  if (valid.length === 0) return null
  const sorted = [...valid].reverse()
  const maxVal = Math.max(...sorted.map((e) => Math.max(Math.abs(e.actual), Math.abs(e.estimate))))

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Earnings History</h3>
      <div className="space-y-3">
        {sorted.map((e) => {
          const isBeat = e.actual >= e.estimate
          const barWidth = maxVal > 0 ? (Math.abs(e.actual) / maxVal) * 100 : 0
          const estWidth = maxVal > 0 ? (Math.abs(e.estimate) / maxVal) * 100 : 0

          return (
            <div key={e.period} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{e.period}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Est. ${e.estimate.toFixed(2)}</span>
                  <span className={cn("font-mono font-medium", isBeat ? "text-positive" : "text-negative")}>
                    ${e.actual.toFixed(2)}
                  </span>
                  <span className={cn("rounded-sm px-1 py-0.5 text-[10px] font-medium",
                    isBeat ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                  )}>
                    {e.surprisePercent >= 0 ? "+" : ""}{e.surprisePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-muted-foreground/30"
                  style={{ width: `${estWidth}%` }}
                />
                <div
                  className={cn("absolute left-0 top-0 h-full rounded-full", isBeat ? "bg-positive" : "bg-negative")}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-muted-foreground/30" /> Estimate</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-positive" /> Beat</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-negative" /> Miss</div>
      </div>
    </div>
  )
}

function RecommendationsCard({ recommendations }: { recommendations: RecommendationTrend[] }) {
  const recent = recommendations.slice(0, 6).reverse()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Analyst Recommendations</h3>
      <div className="space-y-2">
        {recent.map((r) => {
          const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell
          if (total === 0) return null

          return (
            <div key={r.period} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{r.period}</span>
                <span>{total} analysts</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full">
                {r.strongBuy > 0 && <div className="bg-foreground" style={{ width: `${(r.strongBuy / total) * 100}%` }} />}
                {r.buy > 0 && <div className="bg-positive" style={{ width: `${(r.buy / total) * 100}%` }} />}
                {r.hold > 0 && <div className="bg-muted-foreground/40" style={{ width: `${(r.hold / total) * 100}%` }} />}
                {r.sell > 0 && <div className="bg-muted-foreground" style={{ width: `${(r.sell / total) * 100}%` }} />}
                {r.strongSell > 0 && <div className="bg-negative" style={{ width: `${(r.strongSell / total) * 100}%` }} />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-foreground" /> Strong Buy</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-positive" /> Buy</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-muted-foreground/40" /> Hold</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-muted-foreground" /> Sell</div>
        <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-negative" /> Strong Sell</div>
      </div>
    </div>
  )
}

function EarningsQualityCard({ quality }: { quality: EarningsQuality }) {
  const latest = quality?.data?.[0]
  if (!latest) return null

  const components = [
    { label: "Growth", value: latest.growth, max: 5 },
    { label: "Profitability", value: latest.profitability, max: 5 },
    { label: "Leverage", value: latest.leverage, max: 5 },
    { label: "Cash & Capital", value: latest.cashGenerationCapitalAllocation, max: 5 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Earnings Quality</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold tabular-nums">{latest.score?.toFixed(1)}</span>
          {latest.letterScore && (
            <span className={cn(
              "rounded-md px-2 py-0.5 text-xs font-bold",
              latest.letterScore === "A" ? "bg-positive/10 text-positive" :
              latest.letterScore === "B" ? "bg-muted text-foreground" :
              latest.letterScore === "C" ? "bg-muted text-muted-foreground" :
              "bg-negative/10 text-negative"
            )}>
              {latest.letterScore}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {components.map((c) => (
          <div key={c.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{c.label}</span>
              <span className="font-mono tabular-nums">{c.value?.toFixed(1) ?? "N/A"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: c.value != null ? `${(c.value / c.max) * 100}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartCard({ symbol }: { symbol: string }) {
  const [range, setRange] = useState("3M")
  const [interval, setInterval] = useState("D")

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="h-[300px] overflow-hidden">
        <LightweightChart
          ticker={symbol}
          range={range}
          interval={interval}
          mode="candlestick"
          showTimeRanges
          onRangeChange={setRange}
          onIntervalChange={setInterval}
        />
      </div>
    </div>
  )
}

export { CompanyFinancials }

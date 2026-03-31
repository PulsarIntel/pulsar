import type { StockQuote } from "@/lib/types"
import { formatCurrency, formatNumber, formatVolume } from "@/lib/format"

interface StockMetricsProps {
  quote: StockQuote
}

function StockMetrics({ quote }: StockMetricsProps) {
  const metrics = [
    { label: "Open", value: formatCurrency(quote.open) },
    { label: "High", value: formatCurrency(quote.high) },
    { label: "Low", value: formatCurrency(quote.low) },
    { label: "Prev Close", value: formatCurrency(quote.previousClose) },
    { label: "Volume", value: quote.volume },
    { label: "Avg Volume", value: quote.avgVolume },
    { label: "Market Cap", value: quote.marketCap },
    { label: "P/E Ratio", value: quote.peRatio?.toFixed(2) ?? "N/A" },
    { label: "EPS", value: quote.eps ? formatCurrency(quote.eps) : "N/A" },
    { label: "Beta", value: quote.beta?.toFixed(2) ?? "N/A" },
    { label: "52W High", value: formatCurrency(quote.week52High) },
    { label: "52W Low", value: formatCurrency(quote.week52Low) },
    {
      label: "Dividend",
      value: quote.dividend ? formatCurrency(quote.dividend) : "N/A",
    },
    {
      label: "Div Yield",
      value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : "N/A",
    },
  ]

  return (
    <div
      data-slot="stock-metrics"
      className="rounded-xl border border-border bg-card"
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Key Statistics</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between bg-card px-4 py-2.5"
          >
            <span className="text-xs text-muted-foreground">
              {metric.label}
            </span>
            <span className="font-mono text-xs font-medium tabular-nums">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { StockMetrics }

import type { Portfolio } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PortfolioSummaryProps {
  portfolio: Portfolio
}

function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isDayPositive = portfolio.dayChange >= 0
  const isTotalPositive = portfolio.totalReturn >= 0
  const isRealizedPositive = portfolio.realizedPnl >= 0

  return (
    <div data-slot="portfolio-summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Total Value</div>
        <div className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight">
          {formatCurrency(portfolio.totalValue)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Base: {formatCurrency(portfolio.totalCost)}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Day Change</div>
        <div
          className={cn(
            "mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight",
            isDayPositive ? "text-positive" : "text-negative"
          )}
        >
          {isDayPositive ? "+" : ""}{formatCurrency(portfolio.dayChange)}
        </div>
        <div
          className={cn(
            "mt-1 font-mono text-xs tabular-nums",
            isDayPositive ? "text-positive" : "text-negative"
          )}
        >
          {formatPercent(portfolio.dayChangePercent)}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Total Return</div>
        <div
          className={cn(
            "mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight",
            isTotalPositive ? "text-positive" : "text-negative"
          )}
        >
          {isTotalPositive ? "+" : ""}{formatCurrency(portfolio.totalReturn)}
        </div>
        <div
          className={cn(
            "mt-1 font-mono text-xs tabular-nums",
            isTotalPositive ? "text-positive" : "text-negative"
          )}
        >
          {formatPercent(portfolio.totalReturnPercent)}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Realized P&L</div>
        <div
          className={cn(
            "mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight",
            isRealizedPositive ? "text-positive" : "text-negative"
          )}
        >
          {isRealizedPositive ? "+" : ""}{formatCurrency(portfolio.realizedPnl)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          From closed trades
        </div>
      </div>
    </div>
  )
}

export { PortfolioSummary }

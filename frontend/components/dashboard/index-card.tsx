import type { MarketIndex } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatNumber, formatChange, formatPercent } from "@/lib/format"

interface IndexCardProps {
  index: MarketIndex
}

function IndexCard({ index }: IndexCardProps) {
  const isPositive = index.changePercent >= 0

  return (
    <div
      data-slot="index-card"
      className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {index.symbol}
        </span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            isPositive
              ? "bg-positive/10 text-positive"
              : "bg-negative/10 text-negative"
          )}
        >
          {formatPercent(index.changePercent)}
        </span>
      </div>
      <div className="text-lg font-semibold font-mono tabular-nums tracking-tight">
        {formatNumber(index.value)}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{index.name}</span>
        <span
          className={cn(
            "text-xs font-mono tabular-nums",
            isPositive ? "text-positive" : "text-negative"
          )}
        >
          {formatChange(index.change)}
        </span>
      </div>
    </div>
  )
}

export { IndexCard }

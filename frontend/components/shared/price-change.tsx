import { cn } from "@/lib/utils"
import { formatChange, formatPercent } from "@/lib/format"

interface PriceChangeProps {
  change: number
  changePercent: number
  showSign?: boolean
  size?: "sm" | "default" | "lg"
  className?: string
}

function PriceChange({
  change,
  changePercent,
  size = "default",
  className,
}: PriceChangeProps) {
  const isPositive = change >= 0

  return (
    <span
      data-slot="price-change"
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium tabular-nums",
        isPositive ? "text-positive" : "text-negative",
        size === "sm" && "text-xs",
        size === "default" && "text-sm",
        size === "lg" && "text-base",
        className
      )}
    >
      <span>{formatChange(change)}</span>
      <span className="text-[0.85em] opacity-80">
        ({formatPercent(changePercent)})
      </span>
    </span>
  )
}

export { PriceChange }

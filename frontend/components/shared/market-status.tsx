"use client"

import { cn } from "@/lib/utils"
import { useWorkerStatus } from "@/lib/hooks/use-market-data"

interface MarketStatusProps {
  className?: string
}

function MarketStatus({ className }: MarketStatusProps) {
  const { data } = useWorkerStatus()
  const isOpen = data?.market_open ?? false

  return (
    <div
      data-slot="market-status"
      className={cn("inline-flex items-center gap-1.5 text-xs", className)}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isOpen ? "bg-positive animate-pulse" : "bg-muted-foreground"
        )}
      />
      <span className="text-muted-foreground">
        {isOpen ? "Market Open" : "Market Closed"}
      </span>
    </div>
  )
}

export { MarketStatus }

import { cn } from "@/lib/utils"

interface TickerLogoProps {
  ticker: string
  size?: "xs" | "sm" | "default" | "lg"
  className?: string
  variant?: "stock" | "currency" | "crypto"
}

function TickerLogo({ ticker, size = "default", className, variant = "stock" }: TickerLogoProps) {
  const initials = ticker.slice(0, 2)

  return (
    <div
      data-slot="ticker-logo"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-mono font-bold",
        variant === "stock"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
        size === "xs" && "size-5 rounded text-[8px]",
        size === "sm" && "size-7 text-[10px]",
        size === "default" && "size-9 text-xs",
        size === "lg" && "size-11 text-sm",
        className
      )}
    >
      {initials}
    </div>
  )
}

export { TickerLogo }

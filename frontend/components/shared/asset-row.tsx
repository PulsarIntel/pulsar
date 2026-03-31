"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercent } from "@/lib/format"
import { TickerLogo } from "@/components/shared/ticker-logo"

interface AssetRowProps {
  variant?: "card" | "row"
  ticker?: string
  title: string
  subtitle?: string
  metadata?: React.ReactNode
  logoVariant?: "stock" | "currency" | "crypto"
  customIcon?: React.ReactNode
  price?: number
  priceFormatted?: string
  change?: number
  changePercent?: number
  secondaryBadge?: React.ReactNode
  rightContent?: React.ReactNode
  action?: React.ReactNode
  href?: string
  onClick?: () => void
  flashClassName?: string
  className?: string
}

function AssetRow({
  variant = "card",
  ticker,
  title,
  subtitle,
  metadata,
  logoVariant = "stock",
  customIcon,
  price,
  priceFormatted,
  change,
  changePercent,
  secondaryBadge,
  rightContent,
  action,
  href,
  onClick,
  flashClassName,
  className,
}: AssetRowProps) {
  const isPositive = (changePercent ?? 0) >= 0
  const displayPrice = priceFormatted ?? (price ? formatCurrency(price) : "—")

  const hasAction = !!action
  const cols = hasAction
    ? "grid-cols-[auto_1fr_auto_auto]"
    : "grid-cols-[auto_1fr_auto]"

  const baseClass =
    variant === "card"
      ? "rounded-xl border border-border bg-card p-4 transition-colors"
      : "border-b border-border px-4 py-2.5 last:border-b-0 transition-colors hover:bg-muted/30"

  const icon = customIcon ?? (
    <TickerLogo
      ticker={ticker ?? title}
      size={variant === "card" ? "default" : "sm"}
      variant={logoVariant}
    />
  )

  const middle = (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
      {metadata && (
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          {metadata}
        </div>
      )}
    </div>
  )

  const right = rightContent ?? (
    <div className="text-right">
      <div className="font-mono text-sm font-medium tabular-nums">
        {displayPrice}
      </div>
      {changePercent !== undefined && (
        <div className="mt-0.5 flex items-center justify-end gap-2">
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              isPositive ? "text-positive" : "text-negative"
            )}
          >
            {formatPercent(changePercent)}
          </span>
          {secondaryBadge}
        </div>
      )}
    </div>
  )

  if (href && !hasAction) {
    return (
      <Link
        href={href}
        className={cn(`grid ${cols} items-center gap-4`, baseClass, flashClassName, className)}
      >
        {icon}
        {middle}
        {right}
      </Link>
    )
  }

  if (onClick && !hasAction) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(`grid ${cols} items-center gap-4 text-left`, baseClass, flashClassName, className)}
      >
        {icon}
        {middle}
        {right}
      </button>
    )
  }

  return (
    <div className={cn(`grid ${cols} items-center gap-4`, baseClass, flashClassName, className)}>
      {href ? (
        <Link href={href}>{icon}</Link>
      ) : (
        icon
      )}
      {href ? (
        <Link href={href} className="min-w-0">
          {middle}
        </Link>
      ) : (
        middle
      )}
      {right}
      {action}
    </div>
  )
}

export { AssetRow }
export type { AssetRowProps }

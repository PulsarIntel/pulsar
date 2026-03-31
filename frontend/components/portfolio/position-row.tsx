"use client"

import { useState } from "react"
import {
  IconChevronDown,
  IconPlus,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { AssetRow } from "@/components/shared/asset-row"
import { TransactionList } from "@/components/portfolio/transaction-list"
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency, formatPercent, formatTRY } from "@/lib/format"
import { isDovizTicker } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface EnrichedPosition {
  id: string
  ticker: string
  currency: string
  total_shares: number
  avg_cost: number
  total_invested: number
  realized_pnl: number
  first_transaction_date: string
  transaction_count: number
  name: string
  currentPrice: number
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
}

interface PositionRowProps {
  position: EnrichedPosition
  expanded: boolean
  onToggle: () => void
  onTransactionChange: () => void
}

function PositionRow({ position, expanded, onToggle, onTransactionChange }: PositionRowProps) {
  const [showAdd, setShowAdd] = useState(false)
  const flash = usePriceFlash(position.currentPrice)
  const isTotalPositive = position.totalReturn >= 0
  const isDayPositive = position.dayChange >= 0
  const isTRY = position.currency === "TRY"
  const fmtPrice = (v: number) => isTRY ? `₺${formatTRY(v)}` : formatCurrency(v)
  const isCurrency = isTRY || isDovizTicker(position.ticker)
  const href = isCurrency ? "/currencies" : `/stocks/${position.ticker}`

  return (
    <div>
      <div className="relative">
        <AssetRow
          variant="card"
          ticker={isCurrency ? position.name : position.ticker}
          title={isCurrency ? position.name : position.ticker}
          subtitle={isCurrency ? undefined : position.name}
          logoVariant={isCurrency ? "currency" : "stock"}
          priceFormatted={fmtPrice(position.totalValue)}
          changePercent={position.totalReturnPercent}
          secondaryBadge={
            <span className={cn("rounded-sm px-1 py-0.5 font-mono text-[10px] tabular-nums", isDayPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative")}>
              {formatPercent(position.dayChangePercent)}
            </span>
          }
          metadata={
            <>
              <span>{position.total_shares} {isCurrency ? "units" : "shares"}</span>
              <span>Avg {fmtPrice(position.avg_cost)}</span>
              <span>{position.transaction_count} txn{position.transaction_count !== 1 ? "s" : ""}</span>
              {position.realized_pnl !== 0 && (
                <span className={cn("font-mono", position.realized_pnl >= 0 ? "text-positive" : "text-negative")}>
                  Realized {fmtPrice(position.realized_pnl)}
                </span>
              )}
            </>
          }
          href={href}
          flashClassName={flash}
          action={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdd(true) }}
              >
                <IconPlus className="size-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
              >
                <IconChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                />
              </Button>
            </div>
          }
        />
      </div>

      {expanded && (
        <div className="ml-4 mt-1 border-l-2 border-border pl-4 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Transaction History</span>
          </div>
          <TransactionList ticker={position.ticker} onChanged={onTransactionChange} />
        </div>
      )}

      {showAdd && (
        <AddTransactionDialog
          defaultTicker={position.ticker}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); onTransactionChange() }}
        />
      )}
    </div>
  )
}

export { PositionRow }

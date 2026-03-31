"use client"

import {
  IconPencil,
  IconTrash,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency, formatTRY } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (txn: Transaction) => void
  onDelete: (id: string) => void
  deleting: boolean
}

function TransactionRow({ transaction, onEdit, onDelete, deleting }: TransactionRowProps) {
  const isBuy = transaction.type === "buy"
  const isTRY = transaction.currency === "TRY"
  const fmtPrice = (v: number) => isTRY ? `₺${formatTRY(v)}` : formatCurrency(v)

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm">
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          isBuy ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative"
        )}
      >
        {transaction.type}
      </span>

      <div className="flex items-center gap-4 overflow-hidden">
        <span className="shrink-0 text-muted-foreground">{formatDate(transaction.date)}</span>
        <span className="shrink-0 font-mono tabular-nums">
          {transaction.shares} @ {fmtPrice(transaction.price_per_share)}
        </span>
        <span className="shrink-0 font-mono tabular-nums font-medium">
          {fmtPrice(transaction.total_cost)}
        </span>
        {transaction.fee > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            Fee: {fmtPrice(transaction.fee)}
          </span>
        )}
        {transaction.notes && (
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {transaction.notes}
          </span>
        )}
      </div>

      <Button variant="ghost" size="icon-xs" onClick={() => onEdit(transaction)}>
        <IconPencil className="size-3 text-muted-foreground" />
      </Button>

      <Button variant="ghost" size="icon-xs" onClick={() => onDelete(transaction.id)} disabled={deleting}>
        {deleting ? (
          <IconLoader2 className="size-3 animate-spin" />
        ) : (
          <IconTrash className="size-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  )
}

export { TransactionRow }

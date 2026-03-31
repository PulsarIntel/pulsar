"use client"

import { useState } from "react"
import {
  IconCheck,
  IconLoader2,
  IconX,
  IconChevronDown,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { updateTransaction } from "@/lib/api/portfolio"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

interface EditTransactionDialogProps {
  transaction: Transaction
  onClose: () => void
  onUpdated: () => void
}

function EditTransactionDialog({
  transaction,
  onClose,
  onUpdated,
}: EditTransactionDialogProps) {
  const [txnType, setTxnType] = useState<"buy" | "sell">(transaction.type)
  const [shares, setShares] = useState(String(transaction.shares))
  const [pricePerShare, setPricePerShare] = useState(String(transaction.price_per_share))
  const [date, setDate] = useState(transaction.date)
  const [fee, setFee] = useState(transaction.fee > 0 ? String(transaction.fee) : "")
  const [notes, setNotes] = useState(transaction.notes)
  const [showMore, setShowMore] = useState(transaction.fee > 0 || !!transaction.notes)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isTRY = transaction.currency === "TRY"
  const isBuy = txnType === "buy"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!shares || Number(shares) <= 0) { setError("Shares must be positive"); return }
    if (!pricePerShare || Number(pricePerShare) <= 0) { setError("Price must be positive"); return }

    setLoading(true)
    try {
      await updateTransaction(transaction.id, {
        type: txnType,
        shares: Number(shares),
        price_per_share: Number(pricePerShare),
        date,
        fee: fee ? Number(fee) : 0,
        notes: notes || "",
      })
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Transaction</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <IconX className="size-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-sm text-negative">
              {error}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setTxnType("buy")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isBuy
                  ? "bg-positive/15 text-positive shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setTxnType("sell")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                !isBuy
                  ? "bg-negative/15 text-negative shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sell
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Asset</label>
            <div className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm font-medium">
              {transaction.ticker}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shares</label>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder="100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Price ({isTRY ? "₺" : "$"})
              </label>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder={isTRY ? "6400.00" : "150.00"}
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconChevronDown className={cn("size-3 transition-transform", showMore && "rotate-180")} />
              More options
            </button>
            {showMore && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Fee ($)</label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Input
                    placeholder="Optional"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconCheck className="size-4" />
              )}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { EditTransactionDialog }

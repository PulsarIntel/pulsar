"use client"

import { useState } from "react"
import {
  IconPlus,
  IconLoader2,
  IconX,
  IconChevronDown,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { StockPicker } from "@/components/shared/stock-picker"
import { addTransaction } from "@/lib/api/portfolio"
import { cn } from "@/lib/utils"

interface AddTransactionDialogProps {
  onClose: () => void
  onAdded: () => void
  defaultTicker?: string
  defaultType?: "buy" | "sell"
  portfolioId?: string
}

function AddTransactionDialog({
  onClose,
  onAdded,
  defaultTicker,
  defaultType,
  portfolioId,
}: AddTransactionDialogProps) {
  const [txnType, setTxnType] = useState<"buy" | "sell">(defaultType ?? "buy")
  const [ticker, setTicker] = useState(defaultTicker ?? "")
  const [assetType, setAssetType] = useState<"stock" | "currency" | "crypto">("stock")
  const [priceCurrency, setPriceCurrency] = useState<"USD" | "TRY">("USD")
  const [shares, setShares] = useState("")
  const [pricePerShare, setPricePerShare] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fee, setFee] = useState("")
  const [notes, setNotes] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleTypeChange(type: "stock" | "currency" | "crypto") {
    setAssetType(type)
    setPriceCurrency(type === "currency" ? "TRY" : "USD")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!ticker) { setError("Select an asset"); return }
    if (!shares || Number(shares) <= 0) { setError("Shares must be positive"); return }
    if (!pricePerShare || Number(pricePerShare) <= 0) { setError("Price must be positive"); return }

    setLoading(true)
    try {
      await addTransaction({
        ticker,
        type: txnType,
        shares: Number(shares),
        price_per_share: Number(pricePerShare),
        date,
        currency: priceCurrency,
        fee: fee ? Number(fee) : 0,
        notes: notes || "",
        portfolio_id: portfolioId,
      })
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const isBuy = txnType === "buy"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Transaction</h2>
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
            {defaultTicker ? (
              <div className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm font-medium">
                {defaultTicker}
              </div>
            ) : (
              <StockPicker value={ticker} onChange={setTicker} onTypeChange={handleTypeChange} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {assetType === "currency" ? "Amount" : "Shares"}
              </label>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Price ({priceCurrency === "TRY" ? "₺" : "$"})
                </label>
                {assetType === "currency" && (
                  <div className="flex items-center gap-0.5 rounded bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setPriceCurrency("TRY")}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        priceCurrency === "TRY" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      ₺ TRY
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceCurrency("USD")}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                        priceCurrency === "USD" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      $ USD
                    </button>
                  </div>
                )}
              </div>
              <Input
                type="number"
                step="any"
                min="0.01"
                placeholder={priceCurrency === "TRY" ? "6400.00" : "150.00"}
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
            <Button
              type="submit"
              className={cn(
                "flex-1",
                isBuy
                  ? "bg-positive hover:bg-positive/90"
                  : "bg-negative hover:bg-negative/90"
              )}
              disabled={loading}
            >
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconPlus className="size-4" />
              )}
              {isBuy ? "Add Buy" : "Add Sell"}
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

export { AddTransactionDialog }

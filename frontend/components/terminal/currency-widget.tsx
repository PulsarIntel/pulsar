"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { IconChevronDown } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useDovizStore } from "@/lib/stores/doviz-store"
import type { DovizQuoteWithBank } from "@/lib/types"
import { formatTRY } from "@/lib/format"

const ASSET_LABELS: Record<string, string> = {
  "gram-altin": "Gold (gr)",
  gumus: "Silver",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
}

const ASSET_ORDER = ["gram-altin", "gumus", "USD", "EUR", "GBP"]

interface BankOption {
  id: number
  name: string
  icon: string
}

function BankDropdown({
  banks,
  selected,
  onSelect,
}: {
  banks: BankOption[]
  selected: BankOption | undefined
  onSelect: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const filtered = search
    ? banks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : banks

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 border border-border bg-muted/50 px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted focus:border-ring"
      >
        {selected?.icon && (
          <img src={selected.icon} alt="" width={16} height={16} className="shrink-0" loading="lazy" />
        )}
        <span className="flex-1 truncate">{selected?.name ?? "Select bank"}</span>
        <IconChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 border border-border bg-popover shadow-xl">
          <div className="border-b border-border p-1.5">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank..."
              className="w-full bg-transparent px-1.5 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-44 overflow-auto">
            {filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => { onSelect(b.id); setOpen(false); setSearch("") }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                  b.id === selected?.id && "bg-muted text-foreground"
                )}
              >
                {b.icon && (
                  <img src={b.icon} alt="" width={16} height={16} className="shrink-0" loading="lazy" />
                )}
                <span className="truncate">{b.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2.5 py-3 text-center text-xs text-muted-foreground">No banks found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyWidget({ bankId: initialBankId, onBankChange }: { bankId?: string; onBankChange?: (id: string) => void }) {
  const quotes = useDovizStore((s) => s.quotes)
  const [selectedBankId, setSelectedBankId] = useState<number | null>(
    initialBankId ? parseInt(initialBankId, 10) : null
  )

  function selectBank(id: number) {
    setSelectedBankId(id)
    onBankChange?.(String(id))
  }

  const banks = useMemo(() => {
    const map = new Map<number, BankOption>()
    for (const [, q] of Object.entries(quotes)) {
      const raw = q as DovizQuoteWithBank
      if (raw.bankId && raw.bankName) {
        map.set(raw.bankId, {
          id: raw.bankId,
          name: raw.bankName,
          icon: raw.bankIcon || "",
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [quotes])

  useEffect(() => {
    if (!selectedBankId && banks.length > 0) {
      setSelectedBankId(banks[0].id)
    }
  }, [banks, selectedBankId])

  const bankQuotes = useMemo(() => {
    if (!selectedBankId) return []
    return ASSET_ORDER.map((asset) => {
      const key = `${selectedBankId}-${asset}`
      const q = quotes[key] as DovizQuoteWithBank | undefined
      if (!q) return null
      const bid = q.bid || 0
      const ask = q.ask || 0
      const spread = ask - bid
      const spreadPct = bid > 0 ? (spread / bid) * 100 : 0
      const isUSD = asset === "gumus"
      const prefix = isUSD ? "$" : "₺"
      return { asset, label: ASSET_LABELS[asset], bid, ask, spread, spreadPct, prefix, changePercent: q.changePercent || 0 }
    }).filter(Boolean) as {
      asset: string; label: string; bid: number; ask: number
      spread: number; spreadPct: number; prefix: string; changePercent: number
    }[]
  }, [selectedBankId, quotes])

  const selectedBank = banks.find((b) => b.id === selectedBankId)

  if (banks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        Loading bank data...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-2">
        <BankDropdown banks={banks} selected={selectedBank} onSelect={selectBank} />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-2.5 py-2 text-left font-medium">Asset</th>
              <th className="px-2.5 py-2 text-right font-medium">Buy</th>
              <th className="px-2.5 py-2 text-right font-medium">Sell</th>
              <th className="px-2.5 py-2 text-right font-medium">Spread</th>
              <th className="px-2.5 py-2 text-right font-medium">Margin</th>
              <th className="px-2.5 py-2 text-right font-medium">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {bankQuotes.map((q) => (
              <tr key={q.asset} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                <td className="px-2.5 py-2 font-medium">{q.label}</td>
                <td className="px-2.5 py-2 text-right font-mono tabular-nums text-foreground">
                  {q.prefix}{formatTRY(q.bid)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono tabular-nums text-foreground">
                  {q.prefix}{formatTRY(q.ask)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono tabular-nums text-muted-foreground">
                  {q.prefix}{formatTRY(q.spread)}
                </td>
                <td className="px-2.5 py-2 text-right font-mono tabular-nums text-muted-foreground">
                  %{q.spreadPct.toFixed(2)}
                </td>
                <td className={cn(
                  "px-2.5 py-2 text-right font-mono tabular-nums",
                  q.changePercent >= 0 ? "text-positive" : "text-negative"
                )}>
                  {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                </td>
              </tr>
            ))}
            {bankQuotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2.5 py-6 text-center text-muted-foreground">
                  No currency data for this bank
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { CurrencyWidget }

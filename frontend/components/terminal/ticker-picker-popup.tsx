"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { IconSearch } from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { useAssets } from "@/lib/hooks/use-market-data"

function TickerPickerPopup({
  x,
  y,
  onSelect,
  onClose,
}: {
  x: number
  y: number
  onSelect: (ticker: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const { data: assets } = useAssets()

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [onClose])

  const filtered = useMemo(() => {
    const list = assets || []
    if (!search) return list.slice(0, 15)
    const q = search.toLowerCase()
    return list
      .filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const at = a.ticker.toLowerCase(), bt = b.ticker.toLowerCase()
        if (at === q && bt !== q) return -1
        if (bt === q && at !== q) return 1
        const aStarts = at.startsWith(q), bStarts = bt.startsWith(q)
        if (aStarts && !bStarts) return -1
        if (bStarts && !aStarts) return 1
        return at.localeCompare(bt)
      })
      .slice(0, 15)
  }, [search, assets])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 rounded-lg border border-border bg-popover shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="relative border-b border-border p-2">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8" autoFocus />
      </div>
      <div className="max-h-48 overflow-auto py-1">
        {!assets ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No stocks found</div>
        ) : (
          filtered.map((s) => (
            <button
              key={s.ticker}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => onSelect(s.ticker)}
            >
              <TickerLogo ticker={s.ticker} size="xs" />
              <span className="font-medium">{s.ticker}</span>
              <span className="truncate text-xs text-muted-foreground">{s.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export { TickerPickerPopup }

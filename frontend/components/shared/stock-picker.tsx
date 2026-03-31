"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { IconSearch } from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { useAllAssets, filterAssets, type SearchableAsset } from "@/lib/hooks/use-all-assets"
import { cn } from "@/lib/utils"

function StockPicker({
  value,
  onChange,
  onTypeChange,
}: {
  value: string
  onChange: (ticker: string) => void
  onTypeChange?: (type: "stock" | "currency" | "crypto") => void
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState("")
  const [selectedType, setSelectedType] = useState<"stock" | "currency" | "crypto">("stock")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const assets = useAllAssets()

  useEffect(() => {
    if (value && assets.length) {
      const found = assets.find((a) => a.ticker === value)
      if (found) {
        setSelectedName(found.name)
        setSelectedType(found.type)
      }
    }
  }, [value, assets])

  const filtered = useMemo(
    () => filterAssets(assets, search),
    [search, assets]
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setSearch("") }}
          className="flex h-8 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:border-ring dark:bg-input/30"
        >
          {value ? (
            <>
              <TickerLogo ticker={selectedType === "currency" ? selectedName : value} size="xs" variant={selectedType} />
              {selectedType === "currency" ? (
                <span className="truncate font-medium">{selectedName}</span>
              ) : (
                <>
                  <span className="shrink-0 font-medium">{value}</span>
                  <span className="truncate text-muted-foreground">{selectedName}</span>
                </>
              )}
            </>
          ) : (
            <>
              <IconSearch className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Select an asset...</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stocks, currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
      )}
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-lg">
          {assets.length === 0 ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-muted/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.ticker}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                  value === s.ticker && "bg-muted"
                )}
                onClick={() => {
                  onChange(s.ticker)
                  setSelectedName(s.name)
                  setSelectedType(s.type)
                  onTypeChange?.(s.type)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <TickerLogo ticker={s.type === "stock" ? s.ticker : s.name} size="xs" variant={s.type === "crypto" ? "currency" : s.type} />
                <span className="shrink-0 font-medium">{s.type === "stock" ? s.ticker : s.name}</span>
                {s.type === "stock" && (
                  <span className="min-w-0 truncate text-muted-foreground">{s.name}</span>
                )}
                {(s.type === "currency" || s.type === "crypto") && (
                  <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {s.type === "crypto" ? "Crypto" : "Currency"}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export { StockPicker }

"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { IconPlus, IconX, IconTrash, IconSearch, IconPencil } from "@tabler/icons-react"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useHeatmap, useSymbolQuotes, type HeatmapSector, type Quote } from "@/lib/hooks/use-market-data"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { useAllAssets, filterAssets } from "@/lib/hooks/use-all-assets"
import { isDovizTicker, API_BASE } from "@/lib/constants"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { formatPercent, formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { HeatmapStock } from "@/lib/types"

interface CustomHeatmap {
  id: string
  name: string
  tickers: string[]
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export default function HeatmapPage() {
  const { data: sectors, loading } = useHeatmap()
  const [tooltip, setTooltip] = useState<{
    stock: HeatmapStock
    sectorName: string
    x: number
    y: number
  } | null>(null)
  const [customHeatmaps, setCustomHeatmaps] = useState<CustomHeatmap[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingHeatmap, setEditingHeatmap] = useState<CustomHeatmap | null>(null)

  const fetchCustom = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/heatmaps/custom`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setCustomHeatmaps(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchCustom() }, [fetchCustom])

  async function handleCreate(data: { name: string; tickers: string[] }) {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/heatmaps/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchCustom()
        setShowCreate(false)
      }
    } catch {}
  }

  async function handleUpdate(id: string, data: { name: string; tickers: string[] }) {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/heatmaps/custom/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchCustom()
        setEditingHeatmap(null)
      }
    } catch {}
  }

  async function handleDelete(id: string) {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`${API_BASE}/heatmaps/custom/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setCustomHeatmaps((h) => h.filter((x) => x.id !== id))
    } catch {}
  }

  return (
    <>
      <Header
        title="Market Heatmap"
        description="Sector performance at a glance"
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {customHeatmaps.length > 0 ? `${customHeatmaps.length} custom heatmap${customHeatmaps.length > 1 ? "s" : ""}` : "Custom Heatmaps"}
            </h2>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <IconPlus className="size-3.5" />
              Create Heatmap
            </Button>
          </div>

          {showCreate && (
            <CreateHeatmapDialog
              onSave={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {editingHeatmap && (
            <CreateHeatmapDialog
              initial={editingHeatmap}
              onSave={(data) => handleUpdate(editingHeatmap.id, data)}
              onCancel={() => setEditingHeatmap(null)}
              onDelete={() => { handleDelete(editingHeatmap.id); setEditingHeatmap(null) }}
            />
          )}

          {customHeatmaps.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {customHeatmaps.map((hm) => (
                <CustomHeatmapCard
                  key={hm.id}
                  heatmap={hm}
                  onEdit={() => setEditingHeatmap(hm)}
                />
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[200px] animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(sectors || []).map((sector) => (
                <SectorCard
                  key={sector.name}
                  sector={sector}
                  onStockHover={setTooltip}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {tooltip && typeof document !== "undefined" &&
        createPortal(
          <StockTooltip
            stock={tooltip.stock}
            sectorName={tooltip.sectorName}
            x={tooltip.x}
            y={tooltip.y}
          />,
          document.body
        )}
    </>
  )
}

function CreateHeatmapDialog({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: CustomHeatmap
  onSave: (data: { name: string; tickers: string[] }) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const isEdit = !!initial
  const assets = useAllAssets()

  const [name, setName] = useState(initial?.name || "")
  const [items, setItems] = useState<{ ticker: string; label: string; type: "stock" | "currency" | "crypto" }[]>(() => {
    if (!initial) return []
    return initial.tickers.map((t) => {
      const found = assets.find((a) => a.ticker === t)
      const isCurrency = isDovizTicker(t)
      return { ticker: t, label: found ? (isCurrency ? found.name : found.ticker) : t, type: isCurrency ? "currency" as const : "stock" as const }
    })
  })
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  const existing = useMemo(() => new Set(items.map((i) => i.ticker)), [items])
  const results = useMemo(() => filterAssets(assets, search, existing, 8), [assets, search, existing])
  const slots = Array.from({ length: 10 }, (_, i) => items[i] || null)

  function addAsset(asset: { ticker: string; name: string; type: "stock" | "currency" | "crypto" }) {
    if (activeSlot !== null && activeSlot < 10) {
      const updated = [...items]
      const entry = { ticker: asset.ticker, label: asset.type === "currency" ? asset.name : asset.ticker, type: asset.type }
      if (activeSlot >= items.length) {
        updated.push(entry)
      } else {
        updated[activeSlot] = entry
      }
      setItems(updated)
    }
    setActiveSlot(null)
    setSearch("")
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
    setActiveSlot(null)
  }

  function handleSave() {
    if (!name.trim() || items.length === 0) return
    onSave({ name: name.trim(), tickers: items.map((i) => i.ticker) })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Heatmap" : "Create Heatmap"}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <IconX className="size-4" />
          </Button>
        </div>

        <div className="mb-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input
            placeholder="e.g. Tech Picks, My Portfolio..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Assets ({items.length}/10)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((item, i) => (
              <div key={i}>
                {item ? (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TickerLogo ticker={item.label} size="xs" variant={item.type === "crypto" ? "currency" : item.type} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-foreground">
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveSlot(i); setSearch("") }}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors",
                      activeSlot === i
                        ? "border-primary/50 bg-muted/50 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <IconPlus className="size-3.5" />
                    Add Asset
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {activeSlot !== null && (
          <div className="mb-4 space-y-2">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stocks, currencies..."
                className="pl-8"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border border-border">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</div>
              ) : (
                results.map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => addAsset(s)}
                    className="flex w-full items-center gap-2.5 border-b border-border/50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted"
                  >
                    <TickerLogo ticker={s.type === "stock" ? s.ticker : s.name} size="xs" variant={s.type === "crypto" ? "currency" : s.type} />
                    <span className="font-medium">{s.type === "stock" ? s.ticker : s.name}</span>
                    {s.type === "stock" && <span className="truncate text-muted-foreground">{s.name}</span>}
                    {(s.type === "currency" || s.type === "crypto") && (
                      <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s.type === "crypto" ? "Crypto" : "Currency"}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {isEdit && onDelete && (
            <Button variant="outline" onClick={onDelete} className="w-20 text-negative hover:bg-negative/10 hover:text-negative">
              <IconTrash className="size-4" />
            </Button>
          )}
          <Button className="flex-1" onClick={handleSave} disabled={!name.trim() || items.length === 0}>
            <IconPlus className="size-4" />
            {isEdit ? "Save Changes" : "Create Heatmap"}
          </Button>
          <Button variant="outline" onClick={onCancel} className="w-20">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function CustomHeatmapCard({
  heatmap,
  onEdit,
}: {
  heatmap: CustomHeatmap
  onEdit: () => void
}) {
  const stockTickers = useMemo(() => heatmap.tickers.filter((t) => !isDovizTicker(t)), [heatmap.tickers])
  const { data: stockQuotes } = useSymbolQuotes(stockTickers)
  const dovizQuotes = useDovizStore((s) => s.quotes)

  const getQuote = useCallback((ticker: string) => {
    if (isDovizTicker(ticker)) {
      const d = dovizQuotes[ticker] || dovizQuotes[ticker.toLowerCase()]
      if (d) return { name: d.name, changePercent: d.changePercent, price: d.price || d.ask }
    }
    const q = stockQuotes?.[ticker]
    if (q) return { name: q.name, changePercent: q.changePercent, price: q.price }
    return null
  }, [stockQuotes, dovizQuotes])

  const avgChange = useMemo(() => {
    const values = heatmap.tickers.map(getQuote).filter((q) => q && q.price > 0)
    if (values.length === 0) return 0
    return values.reduce((sum, q) => sum + q!.changePercent, 0) / values.length
  }, [heatmap.tickers, getQuote])

  const isPositive = avgChange >= 0

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">{heatmap.name}</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
              isPositive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
            )}
          >
            {formatPercent(avgChange)}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <IconPencil className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {heatmap.tickers.map((ticker) => {
          const q = getQuote(ticker)
          const change = q?.changePercent ?? 0
          const stockPositive = change >= 0
          const intensity = Math.min(Math.abs(change) / 4, 1)
          const displayName = q?.name || ticker

          return (
            <div
              key={ticker}
              className={cn(
                "flex flex-col items-center justify-center bg-card px-3 py-3",
                stockPositive ? "hover:bg-positive/5" : "hover:bg-negative/5"
              )}
              style={{
                backgroundColor: stockPositive
                  ? `oklch(0.7 0.15 155 / ${intensity * 0.08})`
                  : `oklch(0.65 0.2 22 / ${intensity * 0.08})`,
              }}
            >
              <span className="text-xs font-medium">{displayName}</span>
              <span
                className={cn(
                  "font-mono text-sm font-bold tabular-nums",
                  stockPositive ? "text-positive" : "text-negative"
                )}
              >
                {q ? formatPercent(change) : "—"}
              </span>
              <span className="max-w-full truncate text-[10px] text-muted-foreground">
                {q ? (isDovizTicker(ticker) ? "Currency" : displayName) : "Loading..."}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectorCard({
  sector,
  onStockHover,
}: {
  sector: HeatmapSector
  onStockHover: (tooltip: {
    stock: HeatmapStock
    sectorName: string
    x: number
    y: number
  } | null) => void
}) {
  const isPositive = sector.changePercent >= 0
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, stock: HeatmapStock) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onStockHover({
        stock,
        sectorName: sector.name,
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    },
    [sector.name, onStockHover]
  )

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => onStockHover(null), 100)
  }, [onStockHover])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">{sector.name}</h3>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
            isPositive
              ? "bg-positive/10 text-positive"
              : "bg-negative/10 text-negative"
          )}
        >
          {formatPercent(sector.changePercent)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {sector.stocks.map((stock) => {
          const stockPositive = stock.changePercent >= 0
          const intensity = Math.min(Math.abs(stock.changePercent) / 4, 1)

          return (
            <div
              key={stock.ticker}
              className={cn(
                "flex flex-col items-center justify-center bg-card px-3 py-3 transition-colors",
                stockPositive
                  ? "hover:bg-positive/5"
                  : "hover:bg-negative/5"
              )}
              style={{
                backgroundColor: stockPositive
                  ? `oklch(0.7 0.15 155 / ${intensity * 0.08})`
                  : `oklch(0.65 0.2 22 / ${intensity * 0.08})`,
              }}
              onMouseEnter={(e) => handleMouseEnter(e, stock)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="text-xs font-medium">{stock.ticker}</span>
              <span
                className={cn(
                  "font-mono text-sm font-bold tabular-nums",
                  stockPositive ? "text-positive" : "text-negative"
                )}
              >
                {formatPercent(stock.changePercent)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {stock.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StockTooltip({
  stock,
  sectorName,
  x,
  y,
}: {
  stock: HeatmapStock
  sectorName: string
  x: number
  y: number
}) {
  const isPositive = stock.changePercent >= 0
  const isAfterHoursPositive = stock.afterHoursChangePercent >= 0
  const tooltipWidth = 340
  const tooltipRef = useRef<HTMLDivElement>(null)

  const clampedX = Math.max(
    tooltipWidth / 2 + 8,
    Math.min(x, window.innerWidth - tooltipWidth / 2 - 8)
  )

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: clampedX,
        top: y - 8,
        transform: "translate(-50%, -100%)",
        width: tooltipWidth,
      }}
    >
      <div className="rounded-lg border border-border bg-popover p-4 shadow-xl">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">
          {sectorName} - {stock.industry}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold">
            {stock.ticker.slice(0, 2)}
          </div>
          <span className="text-xs font-semibold">{stock.ticker}</span>
          <span className="text-xs text-muted-foreground">{stock.name}</span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-1.5 text-xs">
          <span className="font-mono font-semibold tabular-nums">
            {formatCurrency(stock.price)}
          </span>
          <span className={cn("font-mono tabular-nums", isPositive ? "text-positive" : "text-negative")}>
            {isPositive ? "\u2197" : "\u2198"} {Math.abs(stock.changePercent).toFixed(2)}% at Close
          </span>
          <span className="text-muted-foreground">&middot;</span>
          <span className="font-mono font-semibold tabular-nums">
            {formatCurrency(stock.afterHoursPrice)}
          </span>
          <span className={cn("font-mono tabular-nums", isAfterHoursPositive ? "text-positive" : "text-negative")}>
            {isAfterHoursPositive ? "\u2197" : "\u2198"} {Math.abs(stock.afterHoursChangePercent).toFixed(2)}% After Hours
          </span>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {stock.summary}
        </p>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>4:00 PM ET</span>
        </div>
      </div>
    </div>
  )
}

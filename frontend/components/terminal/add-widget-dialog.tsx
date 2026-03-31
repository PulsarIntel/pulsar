"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  IconX,
  IconChartCandle,
  IconList,
  IconNews,
  IconChartBar,
  IconChartPie,
  IconGridDots,
  IconCoin,
  IconSearch,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { useAllAssets, filterAssets } from "@/lib/hooks/use-all-assets"
import { API_BASE } from "@/lib/constants"
import type { WidgetType } from "./types"

interface CustomHeatmap {
  id: string
  name: string
  tickers: string[]
}

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: typeof IconChartCandle }[] = [
  { type: "chart", label: "Chart", icon: IconChartCandle },
  { type: "mini-chart", label: "Mini Chart", icon: IconChartBar },
  { type: "watchlist", label: "Watchlist", icon: IconList },
  { type: "news", label: "News Feed", icon: IconNews },
  { type: "portfolio", label: "Portfolio", icon: IconChartPie },
  { type: "heatmap", label: "Heatmap", icon: IconGridDots },
  { type: "currency", label: "Bank Rates", icon: IconCoin },
]

function AddWidgetDialog({
  onAdd,
  onClose,
  initialStep = "type",
}: {
  onAdd: (type: WidgetType, ticker?: string) => void
  onClose: () => void
  initialStep?: "type" | "ticker" | "heatmap"
}) {
  const [step, setStep] = useState<"type" | "ticker" | "heatmap">(initialStep)
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null)
  const [search, setSearch] = useState("")
  const assets = useAllAssets()
  const [heatmaps, setHeatmaps] = useState<CustomHeatmap[]>([])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return
    fetch(`${API_BASE}/heatmaps/custom`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setHeatmaps)
      .catch(() => {})
  }, [])

  function handleTypeSelect(type: WidgetType) {
    if (type === "chart" || type === "mini-chart") {
      setSelectedType(type)
      setStep("ticker")
    } else if (type === "heatmap") {
      setStep("heatmap")
    } else {
      onAdd(type)
      onClose()
    }
  }

  const filtered = useMemo(
    () => filterAssets(assets, search, undefined, 30),
    [search, assets]
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {step === "type" ? "Add Widget" : step === "ticker" ? "Select Symbol" : "Select Heatmap"}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <IconX className="size-4" />
          </Button>
        </div>

        {step === "type" && (
          <div className="grid grid-cols-2 gap-3">
            {WIDGET_CATALOG.map((w) => (
              <button
                key={w.type}
                onClick={() => handleTypeSelect(w.type)}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <w.icon className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium">{w.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "ticker" && (
          <div className="space-y-3">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stocks, currencies..." className="pl-8" autoFocus />
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              {assets.length === 0 ? (
                <div className="space-y-1.5 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-muted/50" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</div>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => { onAdd(selectedType!, s.ticker); onClose() }}
                    className="flex w-full items-center gap-2.5 border-b border-border/50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted"
                  >
                    <TickerLogo ticker={s.type === "stock" ? s.ticker : s.name} size="xs" variant={s.type === "crypto" ? "currency" : s.type} />
                    <span className="font-medium">{s.type === "stock" ? s.ticker : s.name}</span>
                    {s.type === "stock" && <span className="truncate text-muted-foreground">{s.name}</span>}
                    {s.type === "crypto" && <span className="truncate text-muted-foreground">{s.ticker}</span>}
                    {(s.type === "currency" || s.type === "crypto") && (
                      <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s.type === "crypto" ? "Crypto" : "Currency"}</span>
                    )}
                  </button>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setStep("type"); setSearch("") }}>
              Back
            </Button>
          </div>
        )}

        {step === "heatmap" && (
          <div className="space-y-3">
            {heatmaps.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No custom heatmaps yet. Create one from the Heatmap page first.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-auto">
                {heatmaps.map((hm) => (
                  <button
                    key={hm.id}
                    onClick={() => { onAdd("heatmap", hm.id); onClose() }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <IconGridDots className="size-6 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{hm.name}</div>
                      <div className="text-xs text-muted-foreground">{hm.tickers.length} assets</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setStep("type")}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export { AddWidgetDialog, WIDGET_CATALOG }

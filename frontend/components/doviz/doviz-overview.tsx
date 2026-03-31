"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useDovizRealtime } from "@/lib/hooks/use-doviz-realtime"
import type { DovizQuoteWithBank } from "@/lib/types"
import { useDovizQuotes } from "@/lib/hooks/use-doviz-data"
import { DovizCategoryGroup } from "@/components/doviz/doviz-category-group"

const CATEGORY_TABS = [
  { key: "all", label: "All", cats: ["gold", "silver", "precious_metals", "currency", "index"] },
  { key: "gold", label: "Gold", cats: ["gold"] },
  { key: "silver", label: "Silver", cats: ["silver"] },
  { key: "precious_metals", label: "Precious Metals", cats: ["precious_metals"] },
  { key: "currency", label: "Currency", cats: ["currency"] },
] as const

type TabKey = (typeof CATEGORY_TABS)[number]["key"]

const CATEGORY_ORDER = ["gold", "silver", "precious_metals", "currency", "index"]
const CATEGORY_LABELS: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  precious_metals: "Precious Metals",
  currency: "Currency",
  index: "Index",
}

const SORT_OPTIONS = [
  { key: "sell", label: "Sell" },
  { key: "buy", label: "Buy" },
  { key: "spread", label: "Spread" },
  { key: "spread_pct", label: "Spread %" },
  { key: "change", label: "Change" },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]["key"]
type SortDir = "asc" | "desc"

function sortQuotes(quotes: DovizQuoteWithBank[], sortBy: SortKey, dir: SortDir): DovizQuoteWithBank[] {
  return [...quotes].sort((a, b) => {
    const aBank = a.bankId
    const bBank = b.bankId
    if (aBank && !bBank) return 1
    if (!aBank && bBank) return -1
    if (!aBank && !bBank) return b.price - a.price

    let av = 0, bv = 0
    const aSpread = a.ask && a.bid ? a.ask - a.bid : 0
    const bSpread = b.ask && b.bid ? b.ask - b.bid : 0
    switch (sortBy) {
      case "sell": av = a.ask; bv = b.ask; break
      case "buy": av = a.bid; bv = b.bid; break
      case "spread": av = aSpread; bv = bSpread; break
      case "spread_pct": av = a.bid > 0 ? aSpread / a.bid : 0; bv = b.bid > 0 ? bSpread / b.bid : 0; break
      case "change": av = a.changePercent; bv = b.changePercent; break
    }
    return dir === "asc" ? av - bv : bv - av
  })
}

function DovizOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [sortBy, setSortBy] = useState<SortKey>("sell")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const activeCats = useMemo(() => {
    const tab = CATEGORY_TABS.find((t) => t.key === activeTab)
    return tab ? [...tab.cats] : []
  }, [activeTab])

  const { quotes: realtimeQuotes } = useDovizRealtime()
  const { data: restQuotes, loading } = useDovizQuotes(30_000, activeTab === "all" ? undefined : activeCats.join(","))

  const merged = useMemo(() => {
    const base: Record<string, DovizQuoteWithBank> = { ...(restQuotes || {}) }
    for (const [ticker, update] of Object.entries(realtimeQuotes)) {
      base[ticker] = update
    }
    return base
  }, [restQuotes, realtimeQuotes])

  const grouped = useMemo(() => {
    const groups: Record<string, DovizQuoteWithBank[]> = {}
    for (const q of Object.values(merged)) {
      const cat = q.category || "other"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(q)
    }
    for (const cat of Object.keys(groups)) {
      groups[cat] = sortQuotes(groups[cat], sortBy, sortDir)
    }
    return groups
  }, [merged, sortBy, sortDir])

  const isEmpty = Object.keys(merged).length === 0

  function handleSortClick(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(key)
      setSortDir(key === "spread" || key === "spread_pct" ? "asc" : "desc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "all" && (
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortClick(opt.key)}
                className={cn(
                  "shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  sortBy === opt.key
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {opt.label}
                {sortBy === opt.key && (
                  <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && isEmpty ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No data available yet. Waiting for doviz.com stream...
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER
            .filter((cat) => (activeCats as string[]).includes(cat) && grouped[cat]?.length)
            .map((cat) => (
              <DovizCategoryGroup
                key={cat}
                title={CATEGORY_LABELS[cat] || cat}
                quotes={grouped[cat]}
                grid={cat !== "currency"}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export { DovizOverview }

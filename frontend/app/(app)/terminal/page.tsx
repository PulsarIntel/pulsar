"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { IconPlus, IconChartCandle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Header } from "@/components/shared/header"
import { useAllQuotes, useNews, type Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { FloatingWidget } from "@/components/terminal/floating-widget"
import { AddWidgetDialog, WIDGET_CATALOG } from "@/components/terminal/add-widget-dialog"
import { TickerPickerPopup } from "@/components/terminal/ticker-picker-popup"
import { type Widget, type WidgetType, WIDGET_DEFAULTS, GRID, snap } from "@/components/terminal/types"
import { getAuthHeaders, isLoggedIn } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { API_BASE } from "@/lib/constants"
const PAGES = [1, 2, 3] as const
const STORAGE_KEY = "terminal-v5"

function loadLocalWidgets(): Widget[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    const v4 = localStorage.getItem("terminal-v4")
    if (v4) {
      const widgets: Widget[] = JSON.parse(v4).map((w: Omit<Widget, 'page'> & { page?: number }) => ({ ...w, page: w.page ?? 1 }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
      return widgets
    }
  } catch {}
  return []
}

function saveLocalWidgets(widgets: Widget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
}

async function fetchWidgetsFromApi(): Promise<Widget[] | null> {
  if (!isLoggedIn()) return null
  try {
    const res = await fetch(`${API_BASE}/terminal/widgets`, {
      headers: getAuthHeaders(),
    })
    if (res.ok) {
      const data = await res.json()
      return data.map((w: Omit<Widget, 'page'> & { page?: number }) => ({ ...w, page: w.page ?? 1 }))
    }
  } catch {}
  return null
}

async function saveWidgetsToApi(widgets: Widget[]) {
  if (!isLoggedIn()) return
  try {
    await fetch(`${API_BASE}/terminal/widgets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ widgets }),
    })
  } catch {}
}

export default function TerminalPage() {
  const [allWidgets, setAllWidgets] = useState<Widget[]>([])
  const [activePage, setActivePage] = useState(1)
  const [showAdd, setShowAdd] = useState<boolean | "heatmap">(false)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{
    x: number; y: number; canvasX: number; canvasY: number; pickType?: WidgetType
  } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const addAtRef = useRef<{ x: number; y: number } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: polledQuotes } = useAllQuotes()
  const { data: news } = useNews()

  const widgets = useMemo(
    () => allWidgets.filter((w) => w.page === activePage),
    [allWidgets, activePage]
  )

  const pageWidgetCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of PAGES) counts[p] = 0
    for (const w of allWidgets) counts[w.page] = (counts[w.page] || 0) + 1
    return counts
  }, [allWidgets])

  const allTickers = useMemo(() => {
    const syms = new Set<string>()
    allWidgets.forEach((w) => {
      if (w.ticker && w.type !== "heatmap") syms.add(w.ticker)
    })
    if (polledQuotes) Object.keys(polledQuotes).forEach((s) => syms.add(s))
    return Array.from(syms)
  }, [allWidgets, polledQuotes])
  const { updates: rt, connected: wsConnected } = useRealtimeQuotes(allTickers)

  const quotes = useMemo(() => {
    const merged: Record<string, Quote> = { ...(polledQuotes || {}) }
    for (const [ticker, u] of Object.entries(rt)) {
      if (u.price && merged[ticker]) {
        merged[ticker] = { ...merged[ticker], price: u.price }
      } else if (u.price) {
        merged[ticker] = { ticker, name: ticker, price: u.price, change: 0, changePercent: 0, open: 0, high: 0, low: 0, previousClose: 0, volume: "0", sector: "", industry: "" }
      }
    }
    return merged
  }, [polledQuotes, rt])

  useEffect(() => {
    async function init() {
      const apiWidgets = await fetchWidgetsFromApi()
      if (apiWidgets !== null) {
        setAllWidgets(apiWidgets)
        saveLocalWidgets(apiWidgets)
      } else {
        setAllWidgets(loadLocalWidgets())
      }
      setReady(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (!ready) return
    saveLocalWidgets(allWidgets)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveWidgetsToApi(allWidgets)
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [allWidgets, ready])

  const handleAdd = useCallback((type: WidgetType, ticker?: string) => {
    const d = WIDGET_DEFAULTS[type]
    const catalog = WIDGET_CATALOG.find((c) => c.type === type)!
    let title = catalog.label
    if (type === "chart" && ticker) title = `Chart — ${ticker}`
    else if (type === "mini-chart" && ticker) title = `Mini — ${ticker}`
    else if (type === "heatmap") title = "Heatmap"
    else if (type === "currency") title = "Bank Rates"
    const id = `w-${Date.now()}`
    const pos = addAtRef.current
    addAtRef.current = null
    setAllWidgets((prev) => {
      const pageWidgets = prev.filter((w) => w.page === activePage)
      const offset = pageWidgets.length * GRID
      return [...prev, {
        id, type, ticker, title,
        x: snap(pos?.x ?? offset),
        y: snap(pos?.y ?? offset),
        w: d.w, h: d.h,
        page: activePage,
      }]
    })
    setFocusedId(id)
  }, [activePage])

  const handleUpdate = useCallback((id: string, patch: Partial<Widget>) => {
    setAllWidgets((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w))
  }, [])

  const handleRemove = useCallback((id: string) => {
    setAllWidgets((prev) => prev.filter((w) => w.id !== id))
    if (focusedId === id) setFocusedId(null)
  }, [focusedId])

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    const scrollLeft = canvasRef.current?.scrollLeft ?? 0
    const scrollTop = canvasRef.current?.scrollTop ?? 0
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: e.clientX - (rect?.left ?? 0) + scrollLeft,
      canvasY: e.clientY - (rect?.top ?? 0) + scrollTop,
    })
  }

  if (!ready) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header title="Terminal" description="Build your custom workspace" />
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-1.5 ${wsConnected ? "bg-positive animate-pulse" : "bg-negative"}`} />
            {wsConnected ? "Live" : "Disconnected"}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            {PAGES.map((p) => (
              <button
                key={p}
                onClick={() => { setActivePage(p); setFocusedId(null) }}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                  activePage === p
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                T{p}
                {pageWidgetCounts[p] > 0 && (
                  <span className="ml-1 text-[10px] opacity-60">{pageWidgetCounts[p]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <IconPlus className="size-3.5" />
          Add Widget
        </Button>
      </div>

      <div
        ref={canvasRef}
        className="terminal-grid relative flex-1 overflow-auto"
        onContextMenu={handleContextMenu}
        onClick={() => ctxMenu && setCtxMenu(null)}
      >
        {widgets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <IconChartCandle className="mb-4 size-12 text-muted-foreground/30" />
            <h2 className="mb-1 text-lg font-semibold">Terminal {activePage} is empty</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Add charts, watchlists, and news to build your workspace.
            </p>
            <Button onClick={() => setShowAdd(true)}>
              <IconPlus className="size-4" />
              Add Widget
            </Button>
          </div>
        ) : (
          <div className="relative" style={{ minHeight: "100%", minWidth: "100%" }}>
            {widgets.map((widget) => (
              <FloatingWidget
                key={widget.id}
                widget={widget}
                isFocused={focusedId === widget.id}
                onFocus={() => setFocusedId(widget.id)}
                onUpdate={(patch) => handleUpdate(widget.id, patch)}
                onRemove={() => handleRemove(widget.id)}
                quotes={quotes}
                news={news}
              />
            ))}
          </div>
        )}
      </div>

      {ctxMenu && !ctxMenu.pickType && (
        <div
          className="fixed z-50 min-w-[160px] border border-border bg-popover py-1 shadow-xl"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          {WIDGET_CATALOG.map((w) => (
            <button
              key={w.type}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={() => {
                addAtRef.current = { x: ctxMenu.canvasX, y: ctxMenu.canvasY }
                if (w.type === "chart" || w.type === "mini-chart") {
                  setCtxMenu({ ...ctxMenu, pickType: w.type })
                } else if (w.type === "heatmap") {
                  setCtxMenu(null)
                  setShowAdd("heatmap")
                } else {
                  handleAdd(w.type)
                  setCtxMenu(null)
                }
              }}
            >
              <w.icon className="size-4 text-muted-foreground" />
              {w.label}
            </button>
          ))}
        </div>
      )}

      {ctxMenu?.pickType && (
        <TickerPickerPopup
          x={ctxMenu.x}
          y={ctxMenu.y}
          onSelect={(ticker) => {
            handleAdd(ctxMenu.pickType!, ticker)
            setCtxMenu(null)
          }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {showAdd && (
        <AddWidgetDialog
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); addAtRef.current = null }}
          initialStep={showAdd === "heatmap" ? "heatmap" : "type"}
        />
      )}
    </div>
  )
}

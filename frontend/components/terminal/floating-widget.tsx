"use client"

import { useState, useRef, useCallback } from "react"
import { IconGripVertical, IconX } from "@tabler/icons-react"

import type { Quote, AlpacaNews } from "@/lib/hooks/use-market-data"
import { cn } from "@/lib/utils"
import { TradingViewChart, MiniChart } from "./tradingview-chart"
import { WatchlistWidget } from "./watchlist-widget"
import { NewsWidget } from "./news-widget"
import { PortfolioWidget } from "./portfolio-widget"
import { HeatmapWidget } from "./heatmap-widget"
import { CurrencyWidget } from "./currency-widget"
import { type Widget, MIN_W, MIN_H, snap } from "./types"

function FloatingWidget({
  widget,
  isFocused,
  onFocus,
  onUpdate,
  onRemove,
  quotes,
  news,
}: {
  widget: Widget
  isFocused: boolean
  onFocus: () => void
  onUpdate: (patch: Partial<Widget>) => void
  onRemove: () => void
  quotes: Record<string, Quote> | null
  news: AlpacaNews[] | null
}) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0 })
  const resizeStart = useRef({ mx: 0, my: 0, w: 0, h: 0 })

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onFocus()
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, x: widget.x, y: widget.y }

    function onMove(ev: MouseEvent) {
      onUpdate({
        x: Math.max(0, dragStart.current.x + ev.clientX - dragStart.current.mx),
        y: Math.max(0, dragStart.current.y + ev.clientY - dragStart.current.my),
      })
    }
    function onUp(ev: MouseEvent) {
      setDragging(false)
      onUpdate({
        x: snap(Math.max(0, dragStart.current.x + ev.clientX - dragStart.current.mx)),
        y: snap(Math.max(0, dragStart.current.y + ev.clientY - dragStart.current.my)),
      })
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [widget.x, widget.y, onFocus, onUpdate])

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    setResizing(true)
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: widget.w, h: widget.h }

    function onMove(ev: MouseEvent) {
      onUpdate({
        w: Math.max(MIN_W, resizeStart.current.w + ev.clientX - resizeStart.current.mx),
        h: Math.max(MIN_H, resizeStart.current.h + ev.clientY - resizeStart.current.my),
      })
    }
    function onUp(ev: MouseEvent) {
      setResizing(false)
      onUpdate({
        w: snap(Math.max(MIN_W, resizeStart.current.w + ev.clientX - resizeStart.current.mx)),
        h: snap(Math.max(MIN_H, resizeStart.current.h + ev.clientY - resizeStart.current.my)),
      })
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [widget.w, widget.h, onFocus, onUpdate])

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-lg border bg-card shadow-lg transition-shadow",
        isFocused ? "border-primary/50 shadow-xl" : "border-border",
        (dragging || resizing) && "select-none",
      )}
      style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h, zIndex: isFocused ? 20 : 10 }}
      onMouseDown={onFocus}
    >
      {(dragging || resizing) && <div className="absolute inset-0 z-30" />}

      <div
        className="flex h-8 cursor-grab items-center justify-between border-b border-border bg-muted/40 px-2 active:cursor-grabbing"
        onMouseDown={onDragMouseDown}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <IconGripVertical className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-medium text-muted-foreground">{widget.title}</span>
        </div>
        <button
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onRemove}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <IconX className="size-3.5" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 top-8">
        {widget.type === "chart" && widget.ticker && <TradingViewChart ticker={widget.ticker} realtimePrice={quotes?.[widget.ticker]?.price} />}
        {widget.type === "mini-chart" && widget.ticker && <MiniChart ticker={widget.ticker} realtimePrice={quotes?.[widget.ticker]?.price} />}
        {widget.type === "watchlist" && <WatchlistWidget quotes={quotes} />}
        {widget.type === "news" && <NewsWidget news={news} />}
        {widget.type === "portfolio" && <PortfolioWidget quotes={quotes} />}
        {widget.type === "heatmap" && widget.ticker && <HeatmapWidget heatmapId={widget.ticker} />}
        {widget.type === "currency" && <CurrencyWidget bankId={widget.ticker} onBankChange={(id) => onUpdate({ ticker: id })} />}
      </div>

      <div
        className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-se-resize"
        onMouseDown={onResizeMouseDown}
      >
        <svg viewBox="0 0 16 16" className="size-4 text-muted-foreground/40">
          <path d="M14 14L8 14M14 14L14 8M14 14L5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  )
}

export { FloatingWidget }

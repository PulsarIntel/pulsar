"use client"

import { useEffect, useRef, useState, memo } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
} from "lightweight-charts"
import { API_BASE } from "@/lib/constants"

export interface BarData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface ChartProps {
  ticker: string
  range?: string
  interval?: string
  mode?: "candlestick" | "line" | "area"
  realtimePrice?: number
  showTimeRanges?: boolean
  onRangeChange?: (range: string) => void
  onIntervalChange?: (interval: string) => void
}

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "D", "W", "M"]
const RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y"]

const ALLOWED_RANGES: Record<string, string[]> = {
  "1m":  ["1D"],
  "5m":  ["1D", "5D"],
  "15m": ["1D", "5D", "1M"],
  "1h":  ["1D", "5D", "1M", "3M"],
  "4h":  ["1M", "3M", "6M", "YTD"],
  "D":   ["5D", "1M", "3M", "6M", "YTD", "1Y", "5Y"],
  "W":   ["1M", "3M", "6M", "YTD", "1Y", "5Y"],
  "M":   ["3M", "6M", "YTD", "1Y", "5Y"],
}

const ALLOWED_INTERVALS: Record<string, string[]> = {
  "1D":  ["1m", "5m", "15m", "1h"],
  "5D":  ["5m", "15m", "1h", "D"],
  "1M":  ["15m", "1h", "4h", "D", "W"],
  "3M":  ["1h", "4h", "D", "W", "M"],
  "6M":  ["4h", "D", "W", "M"],
  "YTD": ["4h", "D", "W", "M"],
  "1Y":  ["D", "W", "M"],
  "5Y":  ["D", "W", "M"],
}

const DEFAULT_RANGE_FOR_INTERVAL: Record<string, string> = {
  "1m": "1D", "5m": "1D", "15m": "5D", "1h": "1M", "4h": "3M", "D": "3M", "W": "1Y", "M": "5Y",
}
const DEFAULT_INTERVAL_FOR_RANGE: Record<string, string> = {
  "1D": "5m", "5D": "15m", "1M": "1h", "3M": "D", "6M": "D", "YTD": "D", "1Y": "D", "5Y": "W",
}

function parseTime(time: string): Time {
  const d = new Date(time)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}` as Time
}

function etOffsetSeconds(): number {
  const now = new Date()
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  return Math.round((et.getTime() - utc.getTime()) / 1000)
}

function parseTimeIntraday(time: string): Time {
  const secs = Math.floor(new Date(time).getTime() / 1000)
  return (secs + etOffsetSeconds()) as Time
}

function isIntraday(interval: string): boolean {
  return interval !== "D" && interval !== "W" && interval !== "M"
}

const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400,
}

function currentBarTime(interval: string): Time {
  const secs = INTERVAL_SECONDS[interval]
  if (secs) {
    const nowUtc = Math.floor(Date.now() / 1000)
    const nowEt = nowUtc + etOffsetSeconds()
    return (Math.floor(nowEt / secs) * secs) as Time
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}` as Time
}

const LightweightChart = memo(function LightweightChart({
  ticker,
  range = "3M",
  interval = "D",
  mode = "candlestick",
  realtimePrice,
  showTimeRanges = true,
  onRangeChange,
  onIntervalChange,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const lastBarRef = useRef<BarData | null>(null)
  const realtimePriceRef = useRef(realtimePrice)
  realtimePriceRef.current = realtimePrice
  const liveBarRef = useRef<{ time: Time; open: number; high: number; low: number } | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    setDataLoaded(false)
    setNoData(false)
    liveBarRef.current = null
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#374151" },
        horzLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#374151" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: isIntraday(interval),
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartRef.current = chart

    let series: ISeriesApi<any>
    if (mode === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        wickUpColor: "#22c55e",
      })
    } else if (mode === "area") {
      series = chart.addSeries(AreaSeries, {
        lineColor: "#3b82f6",
        topColor: "rgba(59,130,246,0.3)",
        bottomColor: "rgba(59,130,246,0.02)",
        lineWidth: 2,
      })
    } else {
      series = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
      })
    }
    seriesRef.current = series

    const encodedTicker = encodeURIComponent(ticker)
    fetch(`${API_BASE}/market/bars/${encodedTicker}?range=${range}&interval=${interval}`)
      .then((r) => r.ok ? r.json() : [])
      .then((bars: BarData[]) => {
        if (!bars.length) { setNoData(true); setDataLoaded(true); return }
        const timeFn = isIntraday(interval) ? parseTimeIntraday : parseTime

        if (mode === "candlestick") {
          const data: CandlestickData[] = bars.map((b) => ({
            time: timeFn(b.time),
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          }))
          series.setData(data)
        } else {
          const data: LineData[] = bars.map((b) => ({
            time: timeFn(b.time),
            value: b.close,
          }))
          series.setData(data)
        }

        const lastBar = bars[bars.length - 1]
        lastBarRef.current = lastBar
        const rp = realtimePriceRef.current
        if (rp && Math.abs(rp - lastBar.close) / lastBar.close <= 0.5) {
          const time = currentBarTime(interval)
          if (mode === "candlestick") {
            liveBarRef.current = { time, open: rp, high: rp, low: rp }
            series.update({ time, open: rp, high: rp, low: rp, close: rp } as CandlestickData)
          } else {
            series.update({ time, value: rp } as LineData)
          }
        }
        chart.timeScale().fitContent()
        setDataLoaded(true)
      })
      .catch(() => { setDataLoaded(true) })

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [ticker, range, interval, mode])

  useEffect(() => {
    if (!dataLoaded || !realtimePrice || !seriesRef.current || !lastBarRef.current) return
    const last = lastBarRef.current
    const lastClose = last.close
    if (Math.abs(realtimePrice - lastClose) / lastClose > 0.5) return

    const time = currentBarTime(interval)

    if (mode === "candlestick") {
      const live = liveBarRef.current
      if (live && live.time === time) {
        seriesRef.current.update({
          time,
          open: live.open,
          high: Math.max(live.high, realtimePrice),
          low: Math.min(live.low, realtimePrice),
          close: realtimePrice,
        } as CandlestickData)
        live.high = Math.max(live.high, realtimePrice)
        live.low = Math.min(live.low, realtimePrice)
      } else {
        liveBarRef.current = { time, open: realtimePrice, high: realtimePrice, low: realtimePrice }
        seriesRef.current.update({
          time,
          open: realtimePrice,
          high: realtimePrice,
          low: realtimePrice,
          close: realtimePrice,
        } as CandlestickData)
      }
    } else {
      seriesRef.current.update({ time, value: realtimePrice } as LineData)
    }
  }, [dataLoaded, realtimePrice, mode, interval])

  return (
    <div className="flex h-full w-full flex-col">
      {showTimeRanges && (
        <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/5 px-1 py-1 scrollbar-none">
          {INTERVALS.map((i) => {
            const allowed = ALLOWED_INTERVALS[range]?.includes(i) ?? true
            return (
              <button
                key={i}
                disabled={!allowed}
                onClick={() => {
                  onIntervalChange?.(i)
                  if (!ALLOWED_RANGES[i]?.includes(range)) {
                    onRangeChange?.(DEFAULT_RANGE_FOR_INTERVAL[i] || range)
                  }
                }}
                className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium transition-colors ${
                  i === interval
                    ? "bg-white/10 text-white"
                    : allowed
                      ? "text-muted-foreground hover:text-white"
                      : "cursor-not-allowed text-muted-foreground/30"
                }`}
              >
                {i}
              </button>
            )
          })}
          <div className="mx-1 h-3 w-px bg-white/10" />
          {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onRangeChange?.(r)
                  if (!ALLOWED_INTERVALS[r]?.includes(interval)) {
                    onIntervalChange?.(DEFAULT_INTERVAL_FOR_RANGE[r] || interval)
                  }
                }}
                className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium transition-colors ${
                  r === range
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {r}
              </button>
          ))}
        </div>
      )}
      {noData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <span className="text-xs text-muted-foreground">No data for this time range</span>
          <span className="text-[10px] text-muted-foreground/60">Try a different interval or wider range</span>
        </div>
      ) : (
        <div ref={containerRef} className={`flex-1 transition-opacity duration-200 ${dataLoaded ? "opacity-100" : "invisible opacity-0"}`} />
      )}
    </div>
  )
})

export { LightweightChart }

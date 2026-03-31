"use client"

import { memo, useState } from "react"
import { LightweightChart } from "@/components/charts/lightweight-chart"

const TradingViewChart = memo(function TradingViewChart({ ticker, realtimePrice }: { ticker: string; realtimePrice?: number }) {
  const [range, setRange] = useState("5D")
  const [interval, setInterval] = useState("15m")
  return (
    <LightweightChart ticker={ticker} range={range} interval={interval} mode="candlestick" realtimePrice={realtimePrice} showTimeRanges onRangeChange={setRange} onIntervalChange={setInterval} />
  )
})

const MiniChart = memo(function MiniChart({ ticker, realtimePrice }: { ticker: string; realtimePrice?: number }) {
  const [range, setRange] = useState("5D")
  const [interval, setInterval] = useState("15m")
  return (
    <LightweightChart ticker={ticker} range={range} interval={interval} mode="area" realtimePrice={realtimePrice} showTimeRanges onRangeChange={setRange} onIntervalChange={setInterval} />
  )
})

export { TradingViewChart, MiniChart }

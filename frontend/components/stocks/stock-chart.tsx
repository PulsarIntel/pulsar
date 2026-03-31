"use client"

import { memo, useState } from "react"
import { LightweightChart } from "@/components/charts/lightweight-chart"

interface StockChartProps {
  ticker: string
  positive?: boolean
  realtimePrice?: number
}

function StockChartInner({ ticker, realtimePrice }: StockChartProps) {
  const [range, setRange] = useState("5D")
  const [interval, setInterval] = useState("15m")
  return (
    <LightweightChart ticker={ticker} range={range} interval={interval} mode="candlestick" realtimePrice={realtimePrice} showTimeRanges onRangeChange={setRange} onIntervalChange={setInterval} />
  )
}

const StockChart = memo(StockChartInner)

export { StockChart }

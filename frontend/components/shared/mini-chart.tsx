"use client"

import { cn } from "@/lib/utils"

interface MiniChartProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  positive?: boolean
}

function MiniChart({
  data,
  width = 80,
  height = 32,
  className,
  positive,
}: MiniChartProps) {
  if (data.length < 2) return null

  const isUp =
    positive ?? data[data.length - 1] >= data[0]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data
    .map((value, index) => {
      const x =
        padding + (index / (data.length - 1)) * (width - padding * 2)
      const y =
        padding + (1 - (value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      data-slot="mini-chart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--positive)" : "var(--negative)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { MiniChart }

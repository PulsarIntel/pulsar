export type WidgetType = "chart" | "watchlist" | "news" | "mini-chart" | "portfolio" | "heatmap" | "currency"

export interface Widget {
  id: string
  type: WidgetType
  ticker?: string
  title: string
  x: number
  y: number
  w: number
  h: number
  page: number
}

export const GRID = 40
export const MIN_W = 240
export const MIN_H = 200

export const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number }> = {
  chart: { w: 720, h: 520 },
  "mini-chart": { w: 400, h: 320 },
  watchlist: { w: 320, h: 480 },
  news: { w: 400, h: 400 },
  portfolio: { w: 360, h: 400 },
  heatmap: { w: 400, h: 360 },
  currency: { w: 480, h: 280 },
}

export function snap(v: number): number {
  return Math.round(v / GRID) * GRID
}

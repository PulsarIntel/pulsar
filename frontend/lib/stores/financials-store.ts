"use client"

import { create } from "zustand"
import { API_BASE } from "@/lib/constants"

export interface EarningsEvent {
  symbol: string
  date: string
  hour: string
  quarter: number | null
  year: number | null
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
}

export interface CompanyEarning {
  actual: number
  estimate: number
  surprise: number
  surprisePercent: number
  period: string
  symbol: string
}

export interface RecommendationTrend {
  symbol: string
  period: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export interface EarningsQualityEntry {
  score: number
  letterScore: string
  growth: number
  profitability: number
  leverage: number
  cashGenerationCapitalAllocation: number
}

export interface EarningsQuality {
  data?: EarningsQualityEntry[]
}

export interface CompanyOverview {
  symbol: string
  metrics: { symbol: string; metric: Record<string, number | null> }
  earnings: CompanyEarning[]
  recommendations: RecommendationTrend[]
  earningsQuality: EarningsQuality | null
}

interface FinancialsState {
  earningsCalendar: EarningsEvent[]
  calendarLoading: boolean
  overviews: Record<string, CompanyOverview>
  overviewLoading: Record<string, boolean>

  fetchEarningsCalendar: (from?: string, to?: string) => Promise<void>
  fetchCompanyOverview: (symbol: string) => Promise<void>
}

export const useFinancialsStore = create<FinancialsState>((set, get) => ({
  earningsCalendar: [],
  calendarLoading: false,
  overviews: {},
  overviewLoading: {},

  fetchEarningsCalendar: async (from?: string, to?: string) => {
    set({ calendarLoading: true })
    try {
      const params = new URLSearchParams()
      if (from) params.set("from_date", from)
      if (to) params.set("to_date", to)
      const res = await fetch(`${API_BASE}/financials/earnings-calendar?${params}`)
      if (res.ok) {
        set({ earningsCalendar: await res.json() })
      }
    } catch {}
    set({ calendarLoading: false })
  },

  fetchCompanyOverview: async (symbol: string) => {
    if (get().overviews[symbol]) return
    set((s) => ({ overviewLoading: { ...s.overviewLoading, [symbol]: true } }))
    try {
      const res = await fetch(`${API_BASE}/financials/company/${symbol}/overview`)
      if (res.ok) {
        const data = await res.json()
        set((s) => ({
          overviews: { ...s.overviews, [symbol]: data },
          overviewLoading: { ...s.overviewLoading, [symbol]: false },
        }))
        return
      }
    } catch {}
    set((s) => ({ overviewLoading: { ...s.overviewLoading, [symbol]: false } }))
  },
}))

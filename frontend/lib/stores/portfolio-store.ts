"use client"

import { create } from "zustand"
import type { PortfolioMeta } from "@/lib/types"
import {
  fetchPortfolios,
  createPortfolio,
  renamePortfolio,
  deletePortfolio,
} from "@/lib/api/portfolio"

interface PortfolioStore {
  portfolios: PortfolioMeta[]
  activePortfolioId: string | null
  loading: boolean

  load: () => Promise<void>
  setActive: (id: string) => void
  create: (name: string) => Promise<PortfolioMeta>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

const STORAGE_KEY = "activePortfolioId"

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  portfolios: [],
  activePortfolioId: null,
  loading: true,

  load: async () => {
    try {
      const portfolios = await fetchPortfolios()
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      const activeId =
        saved && portfolios.some((p) => p.id === saved)
          ? saved
          : portfolios.find((p) => p.is_default)?.id ?? portfolios[0]?.id ?? null
      set({ portfolios, activePortfolioId: activeId, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setActive: (id) => {
    localStorage.setItem(STORAGE_KEY, id)
    set({ activePortfolioId: id })
  },

  create: async (name) => {
    const p = await createPortfolio(name)
    set((s) => ({ portfolios: [...s.portfolios, p] }))
    return p
  },

  rename: async (id, name) => {
    await renamePortfolio(id, name)
    set((s) => ({
      portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
  },

  remove: async (id) => {
    await deletePortfolio(id)
    set((s) => {
      const remaining = s.portfolios.filter((p) => p.id !== id)
      const newActive =
        s.activePortfolioId === id
          ? remaining.find((p) => p.is_default)?.id ?? remaining[0]?.id ?? null
          : s.activePortfolioId
      if (newActive) localStorage.setItem(STORAGE_KEY, newActive)
      return { portfolios: remaining, activePortfolioId: newActive }
    })
  },
}))

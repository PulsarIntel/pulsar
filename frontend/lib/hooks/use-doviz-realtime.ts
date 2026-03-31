"use client"

import { useDovizStore } from "@/lib/stores/doviz-store"
import type { DovizUpdate } from "@/lib/doviz-realtime-manager"

export type { DovizUpdate }

export function useDovizRealtime() {
  const quotes = useDovizStore((s) => s.quotes)
  const connected = useDovizStore((s) => s.connected)
  return { quotes, connected }
}

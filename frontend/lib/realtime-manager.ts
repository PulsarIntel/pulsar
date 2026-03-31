"use client"

export interface RealtimeUpdate {
  type: string
  ticker: string
  price?: number
  change?: number
  changePercent?: number
  bidPrice?: number
  askPrice?: number
  bidSize?: number
  askSize?: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  size?: number
  timestamp?: string
}

type Listener = (update: RealtimeUpdate) => void
type StatusListener = (connected: boolean) => void

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/ws/quotes"

class RealtimeManager {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<Listener>>()
  private statusListeners = new Set<StatusListener>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private _connected = false
  private connecting = false
  private backoff = 1000
  private maxBackoff = 30000

  connect() {
    if (typeof window === "undefined") return
    if (this.ws?.readyState === WebSocket.OPEN || this.connecting) return
    this.connecting = true

    try {
      const ws = new WebSocket(WS_URL)
      this.ws = ws

      ws.onopen = () => {
        this._connected = true
        this.connecting = false
        this.backoff = 1000
        this.notifyStatus(true)
        const allSymbols = Array.from(this.listeners.keys())
        if (allSymbols.length > 0) {
          ws.send(JSON.stringify({ action: "subscribe", symbols: allSymbols }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          const items: RealtimeUpdate[] = Array.isArray(parsed) ? parsed : [parsed]
          for (const data of items) {
            if (!data.ticker) continue
            const set = this.listeners.get(data.ticker)
            if (set) set.forEach((fn) => fn(data))
          }
        } catch {}
      }

      ws.onclose = () => {
        this._connected = false
        this.connecting = false
        this.ws = null
        this.notifyStatus(false)
        this.reconnectTimer = setTimeout(() => this.connect(), this.backoff)
        this.backoff = Math.min(this.backoff * 2, this.maxBackoff)
      }

      ws.onerror = () => ws.close()
    } catch {
      this.connecting = false
    }
  }

  subscribe(symbols: string[], listener: Listener) {
    const newSymbols: string[] = []
    for (const sym of symbols) {
      const s = sym.toUpperCase()
      if (!this.listeners.has(s)) {
        this.listeners.set(s, new Set())
        newSymbols.push(s)
      }
      this.listeners.get(s)!.add(listener)
    }
    if (newSymbols.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "subscribe", symbols: newSymbols }))
    }
    if (!this._connected && !this.connecting) this.connect()
  }

  unsubscribe(symbols: string[], listener: Listener) {
    const removedSymbols: string[] = []
    for (const sym of symbols) {
      const s = sym.toUpperCase()
      const set = this.listeners.get(s)
      if (set) {
        set.delete(listener)
        if (set.size === 0) {
          this.listeners.delete(s)
          removedSymbols.push(s)
        }
      }
    }
    if (removedSymbols.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "unsubscribe", symbols: removedSymbols }))
    }
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener)
    return () => { this.statusListeners.delete(listener) }
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((fn) => fn(connected))
  }

  get connected() { return this._connected }
}

export const realtimeManager = new RealtimeManager()

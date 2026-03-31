"use client"

export interface DovizUpdate {
  type: string
  provider: string
  ticker: string
  name: string
  category: string
  price: number
  bid: number
  ask: number
  change: number
  changePercent: number
  weeklyChange: number
  weeklyChangePercent: number
  monthlyChange: number
  monthlyChangePercent: number
  yearlyChange: number
  yearlyChangePercent: number
  low: number
  high: number
  timestamp: number
}

type Listener = (update: DovizUpdate) => void
type StatusListener = (connected: boolean) => void

const DOVIZ_WS_URL =
  process.env.NEXT_PUBLIC_DOVIZ_WS_URL || "ws://localhost:8000/api/ws/doviz"

class DovizRealtimeManager {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
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
      const ws = new WebSocket(DOVIZ_WS_URL)
      this.ws = ws

      ws.onopen = () => {
        this._connected = true
        this.connecting = false
        this.backoff = 1000
        this.notifyStatus(true)
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          const items: DovizUpdate[] = Array.isArray(parsed) ? parsed : [parsed]
          for (const data of items) {
            if (!data.ticker) continue
            this.listeners.forEach((fn) => fn(data))
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

  addListener(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => { this.statusListeners.delete(listener) }
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((fn) => fn(connected))
  }

  get connected() { return this._connected }
}

export const dovizRealtimeManager = new DovizRealtimeManager()

"use client"

export interface CryptoUpdate {
  type: string
  provider: string
  exchange: string
  ticker: string
  name: string
  symbol: string
  category: string
  price: number
  bid: number
  ask: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
}

type Listener = (update: CryptoUpdate) => void
type StatusListener = (connected: boolean) => void

function getCryptoWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  return api.replace(/^http/, "ws").replace(/\/api\/?$/, "/api/ws/crypto")
}

class CryptoRealtimeManager {
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
      const ws = new WebSocket(getCryptoWsUrl())
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
          const items: CryptoUpdate[] = Array.isArray(parsed) ? parsed : [parsed]
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

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this._connected = false
    this.connecting = false
    this.notifyStatus(false)
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

export const cryptoRealtimeManager = new CryptoRealtimeManager()

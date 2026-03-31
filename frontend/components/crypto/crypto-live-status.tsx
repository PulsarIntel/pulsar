"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { cryptoRealtimeManager } from "@/lib/crypto-realtime-manager"

function CryptoLiveStatus() {
  const [connected, setConnected] = useState(cryptoRealtimeManager.connected)

  useEffect(() => {
    return cryptoRealtimeManager.onStatusChange(setConnected)
  }, [])

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-1.5 rounded-full",
          connected ? "bg-positive animate-pulse" : "bg-muted-foreground"
        )}
      />
      <span className="text-muted-foreground">
        {connected ? "Live" : "Connecting..."}
      </span>
    </div>
  )
}

export { CryptoLiveStatus }

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { dovizRealtimeManager } from "@/lib/doviz-realtime-manager"

function DovizLiveStatus() {
  const [connected, setConnected] = useState(dovizRealtimeManager.connected)

  useEffect(() => {
    return dovizRealtimeManager.onStatusChange(setConnected)
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

export { DovizLiveStatus }

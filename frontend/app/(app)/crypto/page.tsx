"use client"

import { Header } from "@/components/shared/header"
import { PageFooter } from "@/components/shared/page-footer"
import { CryptoLiveStatus } from "@/components/crypto/crypto-live-status"
import { CryptoOverview } from "@/components/crypto/crypto-overview"

export default function CryptoPage() {
  return (
    <>
      <Header
        title="Crypto"
        description="Real-time cryptocurrency prices"
        status={<CryptoLiveStatus />}
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <CryptoOverview />
        </div>
        <PageFooter>
          <div className="text-xs text-muted-foreground">
            Cryptocurrency prices powered by Binance WebSocket
          </div>
        </PageFooter>
      </div>
    </>
  )
}

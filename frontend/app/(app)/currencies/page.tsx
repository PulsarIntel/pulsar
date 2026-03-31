"use client"

import { Header } from "@/components/shared/header"
import { PageFooter } from "@/components/shared/page-footer"
import { DovizLiveStatus } from "@/components/doviz/doviz-live-status"
import { DovizOverview } from "@/components/doviz/doviz-overview"
import { DovizAttribution } from "@/components/doviz/doviz-attribution"

export default function CurrenciesPage() {
  return (
    <>
      <Header
        title="Currencies"
        description="Real-time gold, silver, and currency prices from Turkey"
        status={<DovizLiveStatus />}
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <DovizOverview />
        </div>
        <PageFooter>
          <DovizAttribution />
        </PageFooter>
      </div>
    </>
  )
}

"use client"

import { useState } from "react"
import { Header } from "@/components/shared/header"
import { EarningsCalendar } from "@/components/financials/earnings-calendar"
import { CompanyFinancials } from "@/components/financials/company-financials"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "calendar", label: "Earnings Calendar" },
  { key: "company", label: "Company Lookup" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar")
  const [lookupSymbol, setLookupSymbol] = useState("")

  function handleCompanySelect(symbol: string) {
    setLookupSymbol(symbol)
    setActiveTab("company")
  }

  return (
    <>
      <Header
        title="Financials"
        description="Earnings calendar, company metrics, and analyst estimates"
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "calendar" && <EarningsCalendar onCompanySelect={handleCompanySelect} />}
          {activeTab === "company" && <CompanyFinancials initialSymbol={lookupSymbol} />}
        </div>
      </div>
    </>
  )
}

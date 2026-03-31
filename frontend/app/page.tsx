"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconChartCandle,
  IconCoin,
  IconBriefcase,
  IconGridDots,
  IconTerminal2,
  IconChartBar,
  IconArrowRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { BrandCarousel } from "@/components/shared/brand-carousel"
import { LandingHeader } from "@/components/shared/landing-header"
import { LandingFooter } from "@/components/shared/landing-footer"
import { MobileGate } from "@/components/shared/mobile-gate"

const FEATURES = [
  { icon: IconChartCandle, title: "Real-Time Stocks", desc: "Live US market data powered by Alpaca SIP feed" },
  { icon: IconCoin, title: "Turkish Currencies", desc: "Gold, silver, and forex prices from 38+ banks" },
  { icon: IconBriefcase, title: "Portfolio Tracking", desc: "Track holdings in USD and TRY with live P&L" },
  { icon: IconGridDots, title: "Market Heatmaps", desc: "Sector performance and custom watchlist heatmaps" },
  { icon: IconChartBar, title: "Company Financials", desc: "Earnings, analyst ratings, and quality scores" },
  { icon: IconTerminal2, title: "Custom Terminal", desc: "Drag-and-drop workspace with charts and widgets" },
]

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-32">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-positive animate-pulse" />
            Live market data streaming
          </div>
          <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight lg:text-6xl">
            Market Intelligence,{" "}
            <span className="text-muted-foreground">
              Simplified
            </span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
            Track US stocks, Turkish gold and currency prices, manage portfolios, analyze earnings, and build custom trading workspaces — all in real-time.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Get Started
              <IconArrowRight className="size-4" />
            </Button>
          </Link>
        </section>

        <BrandCarousel />

        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
                <f.icon className="mb-3 size-8 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  )
}

export default function RootPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.replace("/dashboard")
      return
    }
    setIsMobile(window.innerWidth < 768)
    setChecked(true)
  }, [router])

  if (!checked) return null
  return isMobile ? <MobileGate /> : <LandingPage />
}

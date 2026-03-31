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
  IconDeviceDesktop,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { BrandCarousel } from "@/components/shared/brand-carousel"

const FEATURES = [
  { icon: IconChartCandle, title: "Real-Time Stocks", desc: "Live US market data powered by Alpaca SIP feed" },
  { icon: IconCoin, title: "Turkish Currencies", desc: "Gold, silver, and forex prices from 38+ banks" },
  { icon: IconBriefcase, title: "Portfolio Tracking", desc: "Track holdings in USD and TRY with live P&L" },
  { icon: IconGridDots, title: "Market Heatmaps", desc: "Sector performance and custom watchlist heatmaps" },
  { icon: IconChartBar, title: "Company Financials", desc: "Earnings, analyst ratings, and quality scores" },
  { icon: IconTerminal2, title: "Custom Terminal", desc: "Drag-and-drop workspace with charts and widgets" },
]

function MobileGate() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/logo.png" alt="Pulsar" width={64} height={64} className="mb-6 hidden dark:block" />
      <img src="/logo-dark.png" alt="Pulsar" width={64} height={64} className="mb-6 dark:hidden" />
      <h1 className="mb-2 text-2xl font-bold">Pulsar</h1>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Desktop for the full experience, mobile app coming soon.
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
        <IconDeviceDesktop className="size-5" />
        <span>pulsar.investments</span>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Pulsar" width={28} height={28} className="hidden dark:block" />
          <img src="/logo-dark.png" alt="Pulsar" width={28} height={28} className="dark:hidden" />
          <span className="text-lg font-semibold tracking-tight">Pulsar</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

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

      <footer className="relative overflow-hidden border-t border-border">
        <div className="mx-auto max-w-6xl px-6 pb-32 pt-16">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img src="/logo.png" alt="Pulsar" width={20} height={20} className="hidden dark:block" />
                <img src="/logo-dark.png" alt="Pulsar" width={20} height={20} className="dark:hidden" />
                <span className="text-sm font-semibold">Pulsar</span>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                Real-time market intelligence for US stocks, Turkish gold and currency prices, portfolio tracking, and custom trading workspaces.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/currencies" className="text-muted-foreground transition-colors hover:text-foreground">Currencies</Link></li>
                <li><Link href="/terminal" className="text-muted-foreground transition-colors hover:text-foreground">Terminal</Link></li>
                <li><Link href="/heatmap" className="text-muted-foreground transition-colors hover:text-foreground">Heatmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup" className="text-muted-foreground transition-colors hover:text-foreground">Get Started</Link></li>
                <li><Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">Sign In</Link></li>
                <li><Link href="/portfolio" className="text-muted-foreground transition-colors hover:text-foreground">Portfolio</Link></li>
                <li><Link href="/financials" className="text-muted-foreground transition-colors hover:text-foreground">Financials</Link></li>
                <li><a href="https://docs.pulsar.investments" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">Docs</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center overflow-hidden" style={{ height: "300px" }}>
          <img
            src="/logo.png"
            alt=""
            className="hidden dark:block"
            style={{ width: "800px", height: "800px", opacity: 0.04, transform: "translateY(45%)" }}
          />
          <img
            src="/logo-dark.png"
            alt=""
            className="dark:hidden"
            style={{ width: "800px", height: "800px", opacity: 0.04, transform: "translateY(45%)" }}
          />
        </div>

        <div className="relative border-t border-border px-6 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="text-xs text-muted-foreground">© 2026 Pulsar. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">pulsar.investments</span>
          </div>
        </div>
      </footer>
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

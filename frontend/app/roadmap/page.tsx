"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconDeviceMobile,
  IconRss,
  IconBrandX,
  IconArrowLeft,
  IconCoin,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react"
import { LandingHeader } from "@/components/shared/landing-header"
import { LandingFooter } from "@/components/shared/landing-footer"
import { MobileGate } from "@/components/shared/mobile-gate"

const ROADMAP_ITEMS = [
  {
    icon: IconDeviceMobile,
    title: "Mobile App",
    description:
      "Native iOS and Android apps with real-time push notifications, watchlist management, and portfolio tracking on the go.",
    status: "planned" as const,
    quarter: "Q3 2026",
  },
  {
    icon: IconRss,
    title: "Custom News Streaming Feed",
    description:
      "Personalized, real-time news feed tailored to your portfolio and watchlist. Filter by sector, asset class, or sentiment.",
    status: "in-progress" as const,
    quarter: "Q2 2026",
  },
  {
    icon: IconBrandX,
    title: "X Posts Subscribe",
    description:
      "Follow financial accounts on X (Twitter) and stream their posts directly into Pulsar. Stay on top of market-moving commentary without leaving the platform.",
    status: "planned" as const,
    quarter: "Q3 2026",
  },
  {
    icon: IconCoin,
    title: "More Crypto Exchanges",
    description:
      "Aggregate data from additional crypto exchanges beyond the current integrations. Unified order books, deeper liquidity insights, and broader token coverage.",
    status: "planned" as const,
    quarter: "Q4 2026",
  },
]

const STATUS_CONFIG = {
  "in-progress": {
    label: "In Progress",
    icon: IconClock,
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  },
  planned: {
    label: "Planned",
    icon: IconCircleCheck,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
}

function RoadmapContent() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center lg:py-24">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            Back to home
          </Link>
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            Roadmap
          </h1>
          <p className="mb-16 max-w-2xl text-lg text-muted-foreground">
            What we&apos;re building next. Follow along as we expand Pulsar with new features and integrations.
          </p>

          <div className="w-full space-y-4">
            {ROADMAP_ITEMS.map((item) => {
              const status = STATUS_CONFIG[item.status]
              return (
                <div
                  key={item.title}
                  className="group rounded-xl border border-border bg-card p-6 text-left transition-colors hover:border-primary/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <item.icon className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          <status.icon className="size-3" />
                          {status.label}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.quarter}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}

export default function RoadmapPage() {
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
  return isMobile ? <MobileGate /> : <RoadmapContent />
}

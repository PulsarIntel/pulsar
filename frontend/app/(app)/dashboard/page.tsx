import { Header } from "@/components/shared/header"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { TrendingStocks } from "@/components/dashboard/trending-stocks"
import { MarketMovers } from "@/components/dashboard/market-movers"
import { MarketNews } from "@/components/dashboard/market-news"

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Real-time market data and insights"
      />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <MarketOverview />
          <MarketMovers />
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <TrendingStocks />
            <MarketNews />
          </div>
        </div>
      </div>
    </>
  )
}

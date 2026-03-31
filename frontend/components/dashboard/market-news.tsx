"use client"

import { useNews } from "@/lib/hooks/use-market-data"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function MarketNews() {
  const { data: news, loading } = useNews()

  if (loading) {
    return (
      <section data-slot="market-news">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Latest News</h2>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[90px] animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section data-slot="market-news">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Latest News</h2>
      <div className="flex flex-col gap-2">
        {(news || []).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              {item.symbols?.slice(0, 2).map((sym) => (
                <Badge key={sym} variant="secondary" className="text-[10px]">
                  {sym}
                </Badge>
              ))}
            </div>
            <h3 className="text-sm font-medium leading-snug line-clamp-2">
              {item.headline}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>&middot;</span>
              <span>{timeAgo(item.created_at)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export { MarketNews }

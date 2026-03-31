"use client"

import type { AlpacaNews } from "@/lib/hooks/use-market-data"
import { timeAgo } from "@/lib/format"

function NewsWidget({ news }: { news: AlpacaNews[] | null }) {
  return (
    <div className="flex h-full flex-col overflow-auto">
      {(news || []).slice(0, 20).map((n) => (
        <a
          key={n.id}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-border/50 px-3 py-2 transition-colors hover:bg-muted/30"
        >
          <div className="text-xs font-medium leading-snug line-clamp-2">{n.headline}</div>
          <div className="mt-0.5 flex gap-2 text-[10px] text-muted-foreground">
            <span>{n.source}</span>
            <span>{timeAgo(n.created_at)}</span>
            {n.symbols?.slice(0, 2).map((s) => (
              <span key={s} className="text-primary">{s}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
  )
}

export { NewsWidget }

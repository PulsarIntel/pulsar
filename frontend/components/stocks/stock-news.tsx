import { NEWS_ITEMS } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

interface StockNewsProps {
  ticker: string
}

function StockNews({ ticker }: StockNewsProps) {
  const news = NEWS_ITEMS.filter(
    (item) => !item.ticker || item.ticker === ticker
  ).slice(0, 4)

  return (
    <div
      data-slot="stock-news"
      className="rounded-xl border border-border bg-card"
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Related News</h3>
      </div>
      <div className="flex flex-col">
        {news.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0"
          >
            <h4 className="text-sm leading-snug">{item.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>·</span>
              <span>{item.time}</span>
              <Badge
                variant={
                  item.sentiment === "positive"
                    ? "positive"
                    : item.sentiment === "negative"
                      ? "negative"
                      : "secondary"
                }
                className="ml-auto text-[10px]"
              >
                {item.sentiment}
              </Badge>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export { StockNews }

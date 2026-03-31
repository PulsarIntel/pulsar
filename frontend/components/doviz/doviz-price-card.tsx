"use client"

import { cn } from "@/lib/utils"
import { formatTRY, formatPercent } from "@/lib/format"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { AssetRow } from "@/components/shared/asset-row"
import type { DovizQuoteWithBank } from "@/lib/types"

interface DovizItemProps {
  quote: DovizQuoteWithBank
}

function DovizItem({ quote }: DovizItemProps) {
  const priceVal = isFinite(quote.price) && quote.price > 0 ? quote.price : quote.ask
  const flash = usePriceFlash(priceVal)
  const isBank = !!quote.bankId
  const isUSD = quote.ticker === "ons" || quote.ticker === "gumus"
  const prefix = isUSD ? "$" : "₺"
  const isPositive = quote.changePercent >= 0

  const spread = quote.ask && quote.bid ? quote.ask - quote.bid : 0
  const spreadPct = quote.bid > 0 ? (spread / quote.bid) * 100 : 0

  const bankIcon = isBank && quote.bankIcon ? (
    <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
      <img
        src={quote.bankIcon}
        alt={quote.bankName}
        width={24}
        height={24}
        className="rounded-sm"
        loading="lazy"
      />
    </div>
  ) : undefined

  return (
    <AssetRow
      variant="card"
      title={isBank ? quote.bankName! : quote.name}
      subtitle={isBank ? quote.assetLabel : undefined}
      ticker={quote.name}
      logoVariant="currency"
      customIcon={bankIcon}
      priceFormatted={
        isBank
          ? `${prefix}${formatTRY(quote.ask)}`
          : `${prefix}${formatTRY(quote.price)}`
      }
      changePercent={quote.changePercent}
      secondaryBadge={
        isBank ? (
          <span className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
            %{spreadPct.toFixed(2)}
          </span>
        ) : undefined
      }
      metadata={
        isBank ? (
          <>
            <span>Buy <span className="font-mono text-foreground">{prefix}{formatTRY(quote.bid)}</span></span>
            <span>Sell <span className="font-mono text-foreground">{prefix}{formatTRY(quote.ask)}</span></span>
            <span className="hidden sm:inline">Spread <span className="font-mono text-foreground">{prefix}{formatTRY(spread)}</span></span>
          </>
        ) : undefined
      }
      flashClassName={flash}
    />
  )
}

export { DovizItem }

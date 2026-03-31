"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { IconStar, IconPlus, IconX, IconSearch, IconLoader2 } from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { AuthGate } from "@/components/shared/auth-gate"
import { AssetRow } from "@/components/shared/asset-row"
import { AssetList } from "@/components/shared/asset-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAllQuotes, useSymbolQuotes, type Quote } from "@/lib/hooks/use-market-data"
import { useRealtimeQuotes } from "@/lib/hooks/use-realtime-quotes"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { usePriceFlash } from "@/lib/hooks/use-price-flash"
import { formatCurrency, formatTRY } from "@/lib/format"
import { TickerLogo } from "@/components/shared/ticker-logo"
import { useAllAssets, filterAssets } from "@/lib/hooks/use-all-assets"
import { isDovizTicker, isCryptoTicker, API_BASE } from "@/lib/constants"
import { useCryptoStore } from "@/lib/stores/crypto-store"

function WatchlistItem({ stock, onRemove, removing }: { stock: Quote; onRemove: (t: string) => void; removing: boolean }) {
  const flash = usePriceFlash(stock.price)
  const isCurrency = isDovizTicker(stock.ticker)
  const isUSD = stock.ticker === "ons" || stock.ticker === "gumus"
  const fmtPrice = isCurrency && !isUSD ? `₺${formatTRY(stock.price)}` : formatCurrency(stock.price)

  return (
    <AssetRow
      variant="card"
      ticker={isCurrency ? stock.name : stock.ticker}
      title={isCurrency ? stock.name : stock.ticker}
      subtitle={isCurrency ? undefined : stock.name}
      logoVariant={isCurrency ? "currency" : "stock"}
      priceFormatted={stock.price ? fmtPrice : "—"}
      changePercent={stock.price ? stock.changePercent : undefined}
      href={isCurrency ? "/currencies" : `/stocks/${stock.ticker}`}
      flashClassName={flash}
      action={
        <Button variant="ghost" size="icon-sm" onClick={() => onRemove(stock.ticker)} disabled={removing}>
          {removing ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconX className="size-3.5 text-muted-foreground" />}
        </Button>
      }
    />
  )
}

function AddToWatchlist({
  existing,
  onAdd,
  buttonSize = "sm",
}: {
  existing: Set<string>
  onAdd: (ticker: string) => void
  buttonSize?: "sm" | "default" | "lg"
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const assets = useAllAssets()

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const available = useMemo(
    () => filterAssets(assets, search, existing),
    [search, existing, assets]
  )

  return (
    <div ref={ref} className="relative">
      <Button size={buttonSize} onClick={() => setOpen(!open)}>
        <IconPlus className="size-4" />
        Add to Watchlist
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-popover shadow-xl">
          <div className="relative border-b border-border p-2">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search stocks, currencies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" autoFocus />
          </div>
          <div className="max-h-48 overflow-auto py-1">
            {assets.length === 0 ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-muted/50" />
                ))}
              </div>
            ) : available.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
            ) : (
              available.map((s) => (
                <button
                  key={s.ticker}
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => { onAdd(s.ticker); setSearch(""); setOpen(false) }}
                >
                  <TickerLogo ticker={s.type === "stock" ? s.ticker : s.name} size="xs" variant={s.type === "crypto" ? "currency" : s.type} />
                  <span className="font-medium">{s.type === "stock" ? s.ticker : s.name}</span>
                  {s.type === "stock" && (
                    <span className="truncate text-muted-foreground">{s.name}</span>
                  )}
                  {(s.type === "currency" || s.type === "crypto") && (
                    <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {s.type === "crypto" ? "Crypto" : "Currency"}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function WatchlistPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [tickers, setTickers] = useState<string[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [removingTicker, setRemovingTicker] = useState<string | null>(null)
  const stockTickers = useMemo(() => tickers.filter((t) => !isDovizTicker(t) && !isCryptoTicker(t)), [tickers])
  const { data: allQuotes } = useAllQuotes()
  const { data: specificQuotes } = useSymbolQuotes(stockTickers)
  const { updates: rt } = useRealtimeQuotes(stockTickers)
  const dovizQuotes = useDovizStore((s) => s.quotes)
  const cryptoQuotes = useCryptoStore((s) => s.quotes)

  const quotes = useMemo(() => {
    const merged: Record<string, Quote> = {}

    for (const t of stockTickers) {
      const q = allQuotes?.[t] || specificQuotes?.[t]
      if (q) {
        const r = rt[t]
        merged[t] = r?.price ? { ...q, price: r.price } : q
      }
    }

    for (const t of tickers) {
      if (!isDovizTicker(t)) continue
      const tLower = t.toLowerCase()
      const d = dovizQuotes[t] || dovizQuotes[tLower]
      if (d) {
        merged[t] = {
          ticker: t, name: d.name, price: d.price || d.ask,
          change: d.change, changePercent: d.changePercent,
          open: 0, high: 0, low: 0, previousClose: 0,
          volume: "0", sector: d.category || "", industry: "",
        }
      }
    }

    for (const t of tickers) {
      if (!isCryptoTicker(t)) continue
      const c = cryptoQuotes[t]
      if (c) {
        merged[t] = {
          ticker: t, name: c.name, price: c.price,
          change: c.change, changePercent: c.changePercent,
          open: 0, high: 0, low: 0, previousClose: 0,
          volume: String(c.volume), sector: "crypto", industry: "",
        }
      }
    }

    return merged
  }, [tickers, stockTickers, allQuotes, specificQuotes, rt, dovizQuotes, cryptoQuotes])

  const fetchList = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/watchlist/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setTickers(await res.json())
    } catch {}
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("token")
    setIsLoggedIn(loggedIn)
    if (loggedIn) fetchList()
    else setLoadingList(false)
  }, [fetchList])

  async function handleAdd(ticker: string) {
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE}/watchlist/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticker }),
      })
      if (res.ok) setTickers(await res.json())
    } catch {}
  }

  async function handleRemove(ticker: string) {
    setRemovingTicker(ticker)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE}/watchlist/items/${ticker}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setTickers(await res.json())
    } catch {}
    finally { setRemovingTicker(null) }
  }

  if (isLoggedIn === null || (isLoggedIn && loadingList)) {
    return (
      <>
        <Header title="Watchlist" description="Track stocks you're interested in" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-4 sm:p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[52px] animate-pulse border-b border-border" />
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        <Header title="Watchlist" description="Track stocks you're interested in" />
        <div className="flex-1 overflow-auto">
          <AuthGate
            icon={<IconStar className="size-8 text-muted-foreground" />}
            title="Sign in to use your watchlist"
            description="Save your favorite stocks and track them in one place."
          />
        </div>
      </>
    )
  }

  const existingSet = new Set(tickers)

  if (tickers.length === 0) {
    return (
      <>
        <Header title="Watchlist" description="Track stocks you're interested in" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <IconStar className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Your watchlist is empty</h2>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Add stocks to your watchlist to track them here.
            </p>
            <AddToWatchlist existing={existingSet} onAdd={handleAdd} buttonSize="lg" />
          </div>
        </div>
      </>
    )
  }

  const items = tickers.map((t): Quote => quotes?.[t] ?? { ticker: t, name: t, price: 0, change: 0, changePercent: 0, open: 0, high: 0, low: 0, previousClose: 0, volume: "0", sector: "", industry: "" })

  return (
    <>
      <Header title="Watchlist" description="Track stocks you're interested in" />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">{tickers.length} stocks</h2>
            <AddToWatchlist existing={existingSet} onAdd={handleAdd} />
          </div>
          <AssetList variant="card">
            {items.map((stock) => (
              <WatchlistItem key={stock.ticker} stock={stock} onRemove={handleRemove} removing={removingTicker === stock.ticker} />
            ))}
          </AssetList>
        </div>
      </div>
    </>
  )
}

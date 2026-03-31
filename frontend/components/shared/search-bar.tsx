"use client"

import * as React from "react"
import { IconSearch } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useAllAssets, filterAssets } from "@/lib/hooks/use-all-assets"
import { TickerLogo } from "@/components/shared/ticker-logo"

function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const assets = useAllAssets()

  const results = React.useMemo(
    () => (query.length > 0 ? filterAssets(assets, query, undefined, 8) : []),
    [query, assets]
  )

  function handleSelect(asset: (typeof results)[number]) {
    setQuery("")
    setIsOpen(false)
    if (asset.type === "crypto") {
      router.push(`/crypto/${encodeURIComponent(asset.ticker)}`)
    } else if (asset.type === "currency") {
      router.push(`/currencies`)
    } else {
      router.push(`/stocks/${asset.ticker}`)
    }
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div data-slot="search-bar" className={cn("relative", className)}>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search stocks, currencies, crypto..."
          className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30 dark:bg-input/30"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {results.map((asset) => (
            <button
              key={asset.ticker}
              type="button"
              onMouseDown={() => handleSelect(asset)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <TickerLogo ticker={asset.type === "currency" ? asset.name : asset.type === "crypto" ? asset.name : asset.ticker} size="xs" variant={asset.type === "crypto" ? "currency" : asset.type} />
              <div className="flex-1 truncate">
                <div className="font-medium">{asset.type === "stock" ? asset.ticker : asset.name}</div>
                {asset.type === "stock" && (
                  <div className="truncate text-xs text-muted-foreground">
                    {asset.name}
                  </div>
                )}
                {asset.type === "crypto" && (
                  <div className="truncate text-xs text-muted-foreground">
                    {asset.ticker}
                  </div>
                )}
              </div>
              {(asset.type === "currency" || asset.type === "crypto") && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {asset.type === "crypto" ? "Crypto" : "Currency"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { SearchBar }

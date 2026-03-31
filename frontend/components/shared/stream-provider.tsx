"use client"

import { useEffect } from "react"
import { useMarketStore } from "@/lib/stores/market-store"
import { useDovizStore } from "@/lib/stores/doviz-store"
import { useCryptoStore } from "@/lib/stores/crypto-store"

function StreamProvider({ children }: { children: React.ReactNode }) {
  const initMarket = useMarketStore((s) => s.initStreams)
  const initDoviz = useDovizStore((s) => s.initStream)
  const fetchQuotes = useMarketStore((s) => s.fetchQuotes)
  const fetchMovers = useMarketStore((s) => s.fetchMovers)
  const fetchNews = useMarketStore((s) => s.fetchNews)
  const fetchStatus = useMarketStore((s) => s.fetchStatus)
  const fetchDovizQuotes = useDovizStore((s) => s.fetchQuotes)
  const fetchDovizSymbols = useDovizStore((s) => s.fetchSymbols)
  const initCrypto = useCryptoStore((s) => s.initStream)
  const fetchCryptoQuotes = useCryptoStore((s) => s.fetchQuotes)

  useEffect(() => {
    initMarket()
    initDoviz()
    initCrypto()

    fetchQuotes()
    fetchMovers()
    fetchNews()
    fetchStatus()
    fetchDovizQuotes()
    fetchDovizSymbols()
    fetchCryptoQuotes()

    const marketInterval = setInterval(() => {
      fetchQuotes()
      fetchMovers()
      fetchStatus()
    }, 30_000)

    const newsInterval = setInterval(fetchNews, 60_000)
    const dovizInterval = setInterval(() => fetchDovizQuotes(), 30_000)
    const cryptoInterval = setInterval(() => fetchCryptoQuotes(), 30_000)

    return () => {
      clearInterval(marketInterval)
      clearInterval(newsInterval)
      clearInterval(dovizInterval)
      clearInterval(cryptoInterval)
    }
  }, [])

  return <>{children}</>
}

export { StreamProvider }

"use client"

import { useRef, useState, useEffect } from "react"

export function usePriceFlash(price: number | undefined): string {
  const prevPrice = useRef(price)
  const [flash, setFlash] = useState("")

  useEffect(() => {
    if (price === undefined || prevPrice.current === undefined) {
      prevPrice.current = price
      return
    }
    if (price === prevPrice.current) return

    setFlash(price > prevPrice.current ? "flash-positive" : "flash-negative")
    prevPrice.current = price

    const id = setTimeout(() => setFlash(""), 600)
    return () => clearTimeout(id)
  }, [price])

  return flash
}

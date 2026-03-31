"use client"

interface BrandItem {
  type: "svg" | "text"
  src?: string
  label: string
}

const LOGO_HEIGHT = 22

const BRANDS: BrandItem[] = [
  { type: "svg", src: "/brands/nasdaq.svg", label: "NASDAQ" },
  { type: "svg", src: "/brands/nyse.svg", label: "NYSE" },
  { type: "svg", src: "/brands/bist.svg", label: "BIST" },
  { type: "svg", src: "/brands/cboe.svg", label: "Cboe" },
  { type: "svg", src: "/brands/btc.svg", label: "Bitcoin" },
  { type: "svg", src: "/brands/eth.svg", label: "Ethereum" },
  { type: "text", label: "IEX" },
  { type: "text", label: "$XAU" },
  { type: "text", label: "$XAG" },
  { type: "text", label: "$" },
  { type: "text", label: "€" },
  { type: "text", label: "£" },
  { type: "text", label: "₺" },
]

function Item({ item }: { item: BrandItem }) {
  if (item.type === "svg" && item.src) {
    return (
      <li className="mx-8">
        <img
          src={item.src}
          alt={item.label}
          style={{ height: LOGO_HEIGHT, width: "auto", filter: "brightness(0) invert(1)" }}
          className="max-w-none opacity-30 transition-opacity duration-300 hover:opacity-70"
          draggable={false}
        />
      </li>
    )
  }

  const isSymbol = item.label.length <= 2 && !/[a-zA-Z]{2}/.test(item.label)

  return (
    <li className="mx-8">
      <span className={`whitespace-nowrap font-mono uppercase text-foreground opacity-30 transition-opacity duration-300 hover:opacity-70 ${isSymbol ? "text-2xl font-normal tracking-normal" : "text-sm font-bold tracking-widest"}`}>
        {item.label}
      </span>
    </li>
  )
}

function BrandCarousel() {
  return (
    <div
      className="inline-flex w-full flex-nowrap overflow-hidden border-y border-border bg-background py-6"
      style={{
        maskImage: "linear-gradient(to right, transparent 0, black 128px, black calc(100% - 128px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, black 128px, black calc(100% - 128px), transparent 100%)",
      }}
    >
      <ul className="flex animate-[scroll_60s_linear_infinite] items-center">
        {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
          <Item key={i} item={brand} />
        ))}
      </ul>
      <ul className="flex animate-[scroll_60s_linear_infinite] items-center" aria-hidden="true">
        {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
          <Item key={i} item={brand} />
        ))}
      </ul>
    </div>
  )
}

export { BrandCarousel }

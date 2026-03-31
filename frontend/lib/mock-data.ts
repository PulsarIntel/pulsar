import type { NewsItem } from "./types"

export function generateSparkline(base: number, points = 20): number[] {
  const data: number[] = []
  let current = base

  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.48) * base * 0.02
    data.push(Number(current.toFixed(2)))
  }

  return data
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    title: "NVIDIA announces next-gen Blackwell Ultra chips for AI training",
    source: "Reuters",
    time: "2h ago",
    ticker: "NVDA",
    sentiment: "positive",
  },
  {
    id: "2",
    title: "Apple Vision Pro 2 production ramps up ahead of Q3 launch",
    source: "Bloomberg",
    time: "3h ago",
    ticker: "AAPL",
    sentiment: "positive",
  },
  {
    id: "3",
    title:
      "Federal Reserve signals potential rate cut in upcoming FOMC meeting",
    source: "CNBC",
    time: "4h ago",
    sentiment: "positive",
  },
  {
    id: "4",
    title: "Tesla Robotaxi fleet expansion faces regulatory hurdles in Europe",
    source: "Financial Times",
    time: "5h ago",
    ticker: "TSLA",
    sentiment: "negative",
  },
  {
    id: "5",
    title:
      "S&P 500 hits new all-time high driven by tech and financial sectors",
    source: "WSJ",
    time: "6h ago",
    sentiment: "positive",
  },
  {
    id: "6",
    title: "Microsoft Azure revenue growth accelerates to 34% year-over-year",
    source: "TechCrunch",
    time: "7h ago",
    ticker: "MSFT",
    sentiment: "positive",
  },
]

function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Pulsar",
    url: "https://pulsar.investments",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "Real-time stock tracking, portfolio management, Turkish gold and currency prices, earnings analysis, and market heatmaps.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time stock quotes",
      "Portfolio tracking",
      "Watchlist management",
      "Turkish gold and currency prices",
      "Earnings calendar",
      "Company financials",
      "Market heatmaps",
      "Custom terminal workspace",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export { StructuredData }

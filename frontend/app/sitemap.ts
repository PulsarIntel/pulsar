import type { MetadataRoute } from "next"

const BASE_URL = "https://pulsar.investments"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/dashboard",
    "/portfolio",
    "/watchlist",
    "/financials",
    "/currencies",
    "/crypto",
    "/heatmap",
    "/terminal",
    "/stocks",
    "/login",
    "/signup",
  ]

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : 0.8,
  }))
}

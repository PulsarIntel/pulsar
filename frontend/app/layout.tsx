import { Space_Grotesk, Space_Mono } from "next/font/google"
import Script from "next/script"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { cn } from "@/lib/utils"
import { StructuredData } from "@/components/shared/structured-data"

const THEME_INIT_SCRIPT = `
try {
  const storageKey = "theme";
  const root = document.documentElement;
  const storedTheme = localStorage.getItem(storageKey);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : storedTheme === "system"
      ? systemTheme
      : "dark";
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
} catch {}
`

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://pulsar.investments"),
  title: {
    default: "Pulsar - Market Intelligence",
    template: "%s | Pulsar",
  },
  description:
    "Real-time stock tracking, portfolio management, Turkish gold and currency prices, earnings analysis, and market heatmaps — all in one platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pulsar",
    title: "Pulsar - Market Intelligence",
    description:
      "Real-time stock tracking, portfolio management, Turkish gold and currency prices, earnings analysis, and market heatmaps.",
    images: [{ url: "/og-image.jpg", width: 2752, height: 1536, alt: "Pulsar - Market Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulsar - Market Intelligence",
    description:
      "Real-time stock tracking, portfolio management, Turkish gold and currency prices, earnings analysis, and market heatmaps.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark", fontSans.variable, fontMono.variable)}
    >
      <body className="antialiased">
        <StructuredData />
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  )
}

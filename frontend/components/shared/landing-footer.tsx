import Link from "next/link"

function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-6xl px-6 pb-32 pt-16">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src="/logo.png" alt="Pulsar" width={20} height={20} className="hidden dark:block" />
              <img src="/logo-dark.png" alt="Pulsar" width={20} height={20} className="dark:hidden" />
              <span className="text-sm font-semibold">Pulsar</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Real-time market intelligence for US stocks, Turkish gold and currency prices, portfolio tracking, and custom trading workspaces.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link></li>
              <li><Link href="/currencies" className="text-muted-foreground transition-colors hover:text-foreground">Currencies</Link></li>
              <li><Link href="/terminal" className="text-muted-foreground transition-colors hover:text-foreground">Terminal</Link></li>
              <li><Link href="/heatmap" className="text-muted-foreground transition-colors hover:text-foreground">Heatmap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="text-muted-foreground transition-colors hover:text-foreground">Get Started</Link></li>
              <li><Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">Sign In</Link></li>
              <li><Link href="/portfolio" className="text-muted-foreground transition-colors hover:text-foreground">Portfolio</Link></li>
              <li><Link href="/financials" className="text-muted-foreground transition-colors hover:text-foreground">Financials</Link></li>
              <li><Link href="/roadmap" className="text-muted-foreground transition-colors hover:text-foreground">Roadmap</Link></li>
              <li><a href="https://docs.pulsar.investments" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">Docs</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-center overflow-hidden" style={{ height: "300px" }}>
        <img
          src="/logo.png"
          alt=""
          className="hidden dark:block"
          style={{ width: "800px", height: "800px", opacity: 0.04, transform: "translateY(45%)" }}
        />
        <img
          src="/logo-dark.png"
          alt=""
          className="dark:hidden"
          style={{ width: "800px", height: "800px", opacity: 0.04, transform: "translateY(45%)" }}
        />
      </div>

      <div className="relative border-t border-border px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xs text-muted-foreground">&copy; 2026 Pulsar. All rights reserved.</span>
          <span className="text-xs text-muted-foreground">pulsar.investments</span>
        </div>
      </div>
    </footer>
  )
}

export { LandingFooter }

import Link from "next/link"
import { Button } from "@/components/ui/button"

function LandingHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-12">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="Pulsar" width={28} height={28} className="hidden dark:block" />
        <img src="/logo-dark.png" alt="Pulsar" width={28} height={28} className="dark:hidden" />
        <span className="text-lg font-semibold tracking-tight">Pulsar</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link href="/signup">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    </header>
  )
}

export { LandingHeader }

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="font-mono text-6xl font-bold">404</h1>
      <p className="text-sm text-muted-foreground">Page not found</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}

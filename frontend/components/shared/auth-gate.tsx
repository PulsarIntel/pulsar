import Link from "next/link"
import { IconLock } from "@tabler/icons-react"

function AuthGate({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        {icon}
      </div>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <IconLock className="size-4" />
          Sign In
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Create Account
        </Link>
      </div>
    </div>
  )
}

export { AuthGate }

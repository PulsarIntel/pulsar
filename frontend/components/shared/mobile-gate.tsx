import { IconDeviceDesktop } from "@tabler/icons-react"

function MobileGate() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/logo.png" alt="Pulsar" width={64} height={64} className="mb-6 hidden dark:block" />
      <img src="/logo-dark.png" alt="Pulsar" width={64} height={64} className="mb-6 dark:hidden" />
      <h1 className="mb-2 text-2xl font-bold">Pulsar</h1>
      <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Desktop for the full experience, mobile app coming soon.
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
        <IconDeviceDesktop className="size-5" />
        <span>pulsar.investments</span>
      </div>
    </div>
  )
}

export { MobileGate }

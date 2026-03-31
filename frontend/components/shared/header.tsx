import { MarketStatus } from "@/components/shared/market-status"
import { SearchBar } from "@/components/shared/search-bar"
import { ThemeToggle } from "@/components/shared/theme-toggle"

interface HeaderProps {
  title: string
  description?: string
  status?: React.ReactNode
}

function Header({ title, description, status }: HeaderProps) {
  return (
    <header
      data-slot="header"
      className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
    >
      <div className="flex flex-1 flex-col gap-1 pl-10 lg:pl-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {status !== undefined ? status : <MarketStatus />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SearchBar className="w-full sm:w-64" />
        <ThemeToggle />
      </div>
    </header>
  )
}

export { Header }

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconStar,
  IconCalendarEvent,
  IconGridDots,
  IconTerminal2,
  IconCoin,
  IconCurrencyBitcoin,
  IconMenu2,
  IconX,
  IconLogout,
  IconUser,
  IconChevronUp,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getUser, getUserInitials, logout, isLoggedIn } from "@/lib/auth"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Portfolio", href: "/portfolio", icon: IconBriefcase },
  { label: "Watchlist", href: "/watchlist", icon: IconStar },
  { label: "Financials", href: "/financials", icon: IconCalendarEvent },
  { label: "Currencies", href: "/currencies", icon: IconCoin },
  { label: "Crypto", href: "/crypto", icon: IconCurrencyBitcoin },
  { label: "Heatmap", href: "/heatmap", icon: IconGridDots },
  { label: "Terminal", href: "/terminal", icon: IconTerminal2 },
]

function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null)
  const [loggedIn, setLoggedIn] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setUser(getUser())
    setLoggedIn(isLoggedIn())
  }, [])

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        data-slot="sidebar"
        className={cn(
          "fixed top-0 left-0 z-40 flex h-dvh w-[220px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <img src="/logo.png" alt="Pulsar" width={22} height={22} className="hidden dark:block" />
          <img src="/logo-dark.png" alt="Pulsar" width={22} height={22} className="dark:hidden" />
          <span className="text-base font-semibold tracking-tight">
            Pulsar
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="relative border-t border-sidebar-border p-3" ref={menuRef}>
          {menuOpen && loggedIn && (
            <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              <Link
                href="/profile"
                onClick={() => { setMenuOpen(false); setIsOpen(false) }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <IconUser className="size-4 text-muted-foreground" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-negative transition-colors hover:bg-muted"
              >
                <IconLogout className="size-4" />
                Log out
              </button>
            </div>
          )}

          {loggedIn && user ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/15">
                <span className="text-xs font-bold text-primary">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 truncate text-left">
                <div className="text-xs font-medium">{user.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>
              </div>
              <IconChevronUp className={cn("size-3.5 text-muted-foreground transition-transform", menuOpen ? "rotate-0" : "rotate-180")} />
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent"
            >
              <IconUser className="size-[18px] text-muted-foreground" />
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

export { Sidebar }

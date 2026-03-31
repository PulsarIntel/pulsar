"use client"

import { useState, useEffect } from "react"
import { IconSun, IconMoon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {!mounted ? (
        <span className="size-4" />
      ) : resolvedTheme === "dark" ? (
        <IconSun className="size-4" />
      ) : (
        <IconMoon className="size-4" />
      )}
    </Button>
  )
}

export { ThemeToggle }

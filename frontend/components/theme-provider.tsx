"use client"

import * as React from "react"

const STORAGE_KEY = "theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
)

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function resolveTheme(
  theme: Theme,
  systemTheme: ResolvedTheme,
  enableSystem: boolean
): ResolvedTheme {
  if (theme === "system" && enableSystem) {
    return systemTheme
  }

  return theme === "dark" ? "dark" : "light"
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

function temporarilyDisableTransitions() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}")
  )
  document.head.append(style)

  return () => {
    window.getComputedStyle(document.body)
    window.setTimeout(() => {
      style.remove()
    }, 1)
  }
}

function readStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") {
    return defaultTheme
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme
    }
  } catch {}

  return defaultTheme
}

function ThemeProvider({
  children,
  defaultTheme = "dark",
  disableTransitionOnChange = true,
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() =>
    readStoredTheme(defaultTheme)
  )
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>("dark")

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const updateSystemTheme = () => {
      setSystemTheme(getSystemTheme())
    }

    updateSystemTheme()
    mediaQuery.addEventListener("change", updateSystemTheme)

    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme)
    }
  }, [])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return
      }

      const nextTheme =
        event.newValue === "light" ||
        event.newValue === "dark" ||
        event.newValue === "system"
          ? event.newValue
          : defaultTheme

      setThemeState(nextTheme)
    }

    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("storage", onStorage)
    }
  }, [defaultTheme])

  const resolvedTheme = React.useMemo(
    () => resolveTheme(theme, systemTheme, enableSystem),
    [enableSystem, systemTheme, theme]
  )

  React.useEffect(() => {
    const restoreTransitions = disableTransitionOnChange
      ? temporarilyDisableTransitions()
      : undefined

    applyTheme(resolvedTheme)
    restoreTransitions?.()
  }, [disableTransitionOnChange, resolvedTheme])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {}
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [resolvedTheme, setTheme, theme]
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }

"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/shared/sidebar"
import { StreamProvider } from "@/components/shared/stream-provider"
import { Toolbox } from "@/components/shared/toolbox"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider defaultTheme="dark">
      <StreamProvider>
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-auto">{children}</main>
          <Toolbox />
        </div>
      </StreamProvider>
    </ThemeProvider>
  )
}

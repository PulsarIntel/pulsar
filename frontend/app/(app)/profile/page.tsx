"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { IconUser, IconMail, IconCalendar, IconLogout, IconLoader2, IconCheck } from "@tabler/icons-react"

import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthGate } from "@/components/shared/auth-gate"
import { getUser, getToken, getUserInitials, logout, type User } from "@/lib/auth"
import { API_BASE } from "@/lib/constants"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const u = getUser()
    const token = getToken()
    setLoggedIn(!!token)
    if (u) {
      setUser(u)
      setName(u.name)
    }
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || "Failed to update profile")
        return
      }
      const data = await res.json()
      const updated = { ...user!, name: data.name }
      localStorage.setItem("user", JSON.stringify(updated))
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Unable to connect to server")
    } finally {
      setSaving(false)
    }
  }

  if (loggedIn === null) {
    return (
      <>
        <Header title="Profile" />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-lg p-4 sm:p-6">
            <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card" />
          </div>
        </div>
      </>
    )
  }

  if (!loggedIn || !user) {
    return (
      <>
        <Header title="Profile" />
        <div className="flex-1 overflow-auto">
          <AuthGate
            icon={<IconUser className="size-8 text-muted-foreground" />}
            title="Sign in to view your profile"
            description="Manage your account settings and preferences."
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Profile" description="Manage your account" />
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
              <span className="text-2xl font-bold text-primary">
                {getUserInitials(user.name)}
              </span>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Account Details</h3>

            <form className="space-y-4" onSubmit={handleSaveName}>
              {error && (
                <div className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-sm text-negative">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <Button type="submit" disabled={saving || name.trim() === user.name}>
                    {saving ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : saved ? (
                      <IconCheck className="size-4" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <IconMail className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email</span>
                <span className="ml-auto font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <IconUser className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">User ID</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-negative/20 bg-card p-6">
            <h3 className="mb-2 text-sm font-semibold">Sign Out</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Sign out of your account on this device.
            </p>
            <Button variant="destructive" onClick={logout}>
              <IconLogout className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

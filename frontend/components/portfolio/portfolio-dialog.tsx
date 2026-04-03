"use client"

import { useState } from "react"
import { IconLoader2, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PortfolioDialogProps {
  mode: "create" | "rename"
  initialName?: string
  onSubmit: (name: string) => Promise<void>
  onClose: () => void
}

function PortfolioDialog({ mode, initialName = "", onSubmit, onClose }: PortfolioDialogProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Name cannot be empty")
      return
    }
    setError("")
    setLoading(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "New Portfolio" : "Rename Portfolio"}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <IconX className="size-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2 text-sm text-negative">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Portfolio Name</label>
            <Input
              placeholder="e.g. Long-term, Swing Trades"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : mode === "create" ? (
                "Create"
              ) : (
                "Rename"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { PortfolioDialog }

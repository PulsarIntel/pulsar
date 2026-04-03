"use client"

import { useState, useRef, useEffect } from "react"
import {
  IconChevronDown,
  IconCheck,
  IconPencil,
  IconTrash,
  IconPlus,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { usePortfolioStore } from "@/lib/stores/portfolio-store"
import { PortfolioDialog } from "@/components/portfolio/portfolio-dialog"
import { cn } from "@/lib/utils"

function PortfolioSwitcher() {
  const { portfolios, activePortfolioId, setActive, create, rename, remove } =
    usePortfolioStore()
  const [open, setOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "rename" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = portfolios.find((p) => p.id === activePortfolioId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmDeleteId(null)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleSelect(id: string) {
    setActive(id)
    setOpen(false)
    setConfirmDeleteId(null)
  }

  function handleRenameClick(id: string) {
    setEditingId(id)
    setDialogMode("rename")
    setOpen(false)
  }

  function handleDeleteClick(id: string) {
    setConfirmDeleteId(id)
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await remove(confirmDeleteId)
    } catch {}
    setDeleting(false)
    setConfirmDeleteId(null)
  }

  if (portfolios.length <= 1 && !open && !dialogMode) {
    return (
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{active?.name ?? "Portfolio"}</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setDialogMode("create")}
          title="New Portfolio"
        >
          <IconPlus className="size-3.5 text-muted-foreground" />
        </Button>
        {dialogMode === "create" && (
          <PortfolioDialog
            mode="create"
            onSubmit={async (name) => {
              const p = await create(name)
              setActive(p.id)
            }}
            onClose={() => setDialogMode(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setConfirmDeleteId(null) }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
      >
        <h2 className="text-lg font-semibold">{active?.name ?? "Portfolio"}</h2>
        <IconChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-border bg-card p-1 shadow-xl">
          {portfolios.map((p) => (
            <div key={p.id}>
              {confirmDeleteId === p.id ? (
                <div className="rounded-lg bg-negative/5 px-3 py-2">
                  <p className="mb-2 text-xs text-negative">
                    Delete <strong>{p.name}</strong>? All positions and transactions will be removed.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      className="bg-negative hover:bg-negative/90"
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                    >
                      {deleting ? <IconLoader2 className="size-3 animate-spin" /> : "Delete"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer",
                    p.id === activePortfolioId
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleSelect(p.id)}
                >
                  <div className="flex-1 truncate text-sm font-medium">
                    {p.name}
                  </div>
                  {p.id === activePortfolioId && (
                    <IconCheck className="size-3.5 text-positive" />
                  )}
                  {!p.is_default && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="rounded p-0.5 hover:bg-muted-foreground/10"
                        onClick={(e) => { e.stopPropagation(); handleRenameClick(p.id) }}
                        title="Rename"
                      >
                        <IconPencil className="size-3 text-muted-foreground" />
                      </button>
                      <button
                        className="rounded p-0.5 hover:bg-negative/10"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(p.id) }}
                        title="Delete"
                      >
                        <IconTrash className="size-3 text-negative" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="mt-1 border-t border-border pt-1">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              onClick={() => { setDialogMode("create"); setOpen(false) }}
            >
              <IconPlus className="size-3.5" />
              New Portfolio
            </button>
          </div>
        </div>
      )}

      {dialogMode === "create" && (
        <PortfolioDialog
          mode="create"
          onSubmit={async (name) => {
            const p = await create(name)
            setActive(p.id)
          }}
          onClose={() => setDialogMode(null)}
        />
      )}

      {dialogMode === "rename" && editingId && (
        <PortfolioDialog
          mode="rename"
          initialName={portfolios.find((p) => p.id === editingId)?.name}
          onSubmit={async (name) => {
            await rename(editingId, name)
          }}
          onClose={() => { setDialogMode(null); setEditingId(null) }}
        />
      )}
    </div>
  )
}

export { PortfolioSwitcher }

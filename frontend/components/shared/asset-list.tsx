import { cn } from "@/lib/utils"

interface ColumnDef {
  key: string
  label: string
  align?: "left" | "right"
  hiddenBelow?: "sm" | "md" | "lg"
}

interface AssetListProps {
  columns?: ColumnDef[]
  loading?: boolean
  skeletonCount?: number
  skeletonHeight?: string
  emptyMessage?: string
  variant?: "card" | "row"
  children?: React.ReactNode
  className?: string
}

function AssetList({
  columns,
  loading,
  skeletonCount = 6,
  skeletonHeight = "h-[56px]",
  emptyMessage = "No data available",
  variant = "row",
  children,
  className,
}: AssetListProps) {
  if (variant === "card") {
    if (loading) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    )
  }

  if (loading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse border-b border-border last:border-b-0",
              skeletonHeight
            )}
          />
        ))}
      </div>
    )
  }

  const isEmpty = !children || (Array.isArray(children) && children.length === 0)

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {columns && (
        <div className="grid items-center gap-4 border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: `1fr ${columns.slice(1).map(() => "auto").join(" ")}` }}
        >
          {columns.map((col) => (
            <span
              key={col.key}
              className={cn(
                col.align === "right" && "text-right",
                col.hiddenBelow === "sm" && "hidden sm:block",
                col.hiddenBelow === "md" && "hidden md:block",
                col.hiddenBelow === "lg" && "hidden lg:block",
              )}
            >
              {col.label}
            </span>
          ))}
        </div>
      )}
      {isEmpty ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export { AssetList }
export type { ColumnDef }

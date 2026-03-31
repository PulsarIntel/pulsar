import { cn } from "@/lib/utils"

interface PageFooterProps {
  children: React.ReactNode
  className?: string
}

function PageFooter({ children, className }: PageFooterProps) {
  return (
    <footer className={cn("flex items-center justify-center border-t border-border px-4 py-4 sm:px-6", className)}>
      {children}
    </footer>
  )
}

export { PageFooter }

"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { IconChevronLeft, IconChevronRight, IconCalendar } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function startDay(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function formatDisplay(date: string) {
  if (!date) return ""
  const d = new Date(date + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
}

function DatePicker({ value, onChange }: DatePickerProps) {
  const parsed = value ? new Date(value + "T00:00:00") : new Date()
  const [viewYear, setViewYear] = useState(parsed.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed.getMonth())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const days = daysInMonth(viewYear, viewMonth)
  const offset = startDay(viewYear, viewMonth)
  const prevDays = daysInMonth(viewYear, viewMonth - 1)

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function select(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    onChange(iso)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:border-ring dark:bg-input/30"
      >
        <IconCalendar className="size-3.5 text-muted-foreground" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? formatDisplay(value) : "Select date"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-border bg-popover p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <Button variant="ghost" size="icon-xs" onClick={prev} type="button">
              <IconChevronLeft className="size-3.5" />
            </Button>
            <span className="text-sm font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon-xs" onClick={next} type="button">
              <IconChevronRight className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {DAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}

            {Array.from({ length: offset }).map((_, i) => (
              <div key={`p${i}`} className="py-1 text-center text-xs text-muted-foreground/30">
                {prevDays - offset + i + 1}
              </div>
            ))}

            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isSelected = iso === value
              const isToday = iso === today
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  className={cn(
                    "rounded-md py-1 text-center text-xs transition-colors hover:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/80",
                    isToday && !isSelected && "font-bold text-primary",
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="xs"
              type="button"
              onClick={() => { onChange(today); setOpen(false) }}
            >
              Today
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DatePicker }

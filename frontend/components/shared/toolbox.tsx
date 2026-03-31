"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { IconTools, IconCalculator } from "@tabler/icons-react"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { CalculatorToggle, useCalcStore } from "./calculator"

const TOOLS = [
  { id: "calculator" as const, label: "Calculator", icon: IconCalculator },
]

const RAIL_HEIGHT = TOOLS.length * 40
const STORAGE_KEY = "toolbox-pos"

function loadPos(): { x: number; y: number } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function savePos(x: number, y: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }))
}

function Toolbox() {
  const [expanded, setExpanded] = useState(true)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const calcOpen = useCalcStore((s) => s.open)
  const calcToggle = useCalcStore((s) => s.toggle)
  const containerRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const toolsIconRef = useRef<SVGSVGElement>(null)
  const mounted = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0 })
  const didDrag = useRef(false)

  useEffect(() => {
    const saved = loadPos()
    if (saved) {
      const x = Math.min(saved.x, window.innerWidth - 56)
      const y = Math.min(saved.y, window.innerHeight - 56)
      setPos({ x: Math.max(0, x), y: Math.max(0, y) })
    } else {
      setPos({ x: window.innerWidth - 56, y: window.innerHeight - 56 })
    }
  }, [])

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (!pos) return
    e.preventDefault()
    setDragging(true)
    didDrag.current = false
    dragStart.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y }

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - dragStart.current.mx
      const dy = ev.clientY - dragStart.current.my
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true
      const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStart.current.x + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStart.current.y + dy))
      setPos({ x: newX, y: newY })
    }
    function onUp() {
      setDragging(false)
      const el = containerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        savePos(rect.left, rect.top)
      }
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [pos])

  const handleToggleClick = useCallback(() => {
    if (didDrag.current) return
    setExpanded((e) => !e)
  }, [])

  const animateOpen = useCallback(() => {
    if (!railRef.current) return
    gsap.killTweensOf(railRef.current)
    btnRefs.current.forEach((btn) => btn && gsap.killTweensOf(btn))

    gsap.to(railRef.current, {
      height: RAIL_HEIGHT, duration: 0.3, ease: "power3.out",
    })
    btnRefs.current.forEach((btn, i) => {
      if (btn) {
        gsap.to(btn, {
          scale: 1, opacity: 1, duration: 0.25, delay: 0.1 + i * 0.06, ease: "back.out(2.5)",
        })
      }
    })
  }, [])

  const animateClose = useCallback(() => {
    if (!railRef.current) return
    gsap.killTweensOf(railRef.current)
    btnRefs.current.forEach((btn) => btn && gsap.killTweensOf(btn))

    btnRefs.current.forEach((btn) => {
      if (btn) {
        gsap.to(btn, { scale: 0, opacity: 0, duration: 0.15, ease: "power2.in" })
      }
    })
    gsap.to(railRef.current, {
      height: 0, duration: 0.25, delay: 0.08, ease: "power3.in",
    })
  }, [])

  useEffect(() => {
    if (!pos) return
    if (!mounted.current) {
      mounted.current = true
      requestAnimationFrame(() => {
        if (railRef.current) gsap.set(railRef.current, { height: expanded ? RAIL_HEIGHT : 0 })
        btnRefs.current.forEach((btn) => {
          if (btn) gsap.set(btn, { scale: expanded ? 1 : 0, opacity: expanded ? 1 : 0 })
        })
      })
      return
    }
    if (expanded) animateOpen()
    else animateClose()
    if (toolsIconRef.current) {
      gsap.to(toolsIconRef.current, {
        rotation: expanded ? 0 : 180,
        duration: 0.4,
        ease: "back.out(1.5)",
      })
    }
  }, [expanded, pos, animateOpen, animateClose])

  if (!pos) return null

  return (
    <>
      {calcOpen && <CalculatorToggle standalone />}

      <div
        ref={containerRef}
        className={cn("fixed z-[99] flex flex-col items-center", dragging && "select-none")}
        style={{ left: pos.x, top: pos.y, transform: "translate(0, -100%)" }}
      >
        <div
          ref={railRef}
          className="flex w-10 flex-col items-center overflow-hidden border border-b-0 border-border bg-card"
          style={{ height: RAIL_HEIGHT }}
        >
          {TOOLS.map((tool, i) => {
            const active = tool.id === "calculator" && calcOpen
            return (
              <button
                key={tool.id}
                ref={(el) => { btnRefs.current[i] = el }}
                onClick={() => {
                  if (tool.id === "calculator") calcToggle()
                }}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center transition-colors hover:bg-muted",
                  active && "bg-muted"
                )}
                title={tool.label}
              >
                <tool.icon className="size-[18px]" />
              </button>
            )
          })}
        </div>

        <div
          className={cn(
            "flex size-10 items-center justify-center border border-border bg-card shadow-lg transition-colors hover:bg-muted",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={onDragMouseDown}
          onMouseUp={handleToggleClick}
          title="Tools — drag to move"
        >
          <IconTools ref={toolsIconRef} className="size-[18px] text-foreground" />
        </div>
      </div>
    </>
  )
}

export { Toolbox }

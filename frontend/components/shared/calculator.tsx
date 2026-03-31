"use client"

import { useRef, useCallback, useEffect } from "react"
import { create } from "zustand"
import { IconCalculator, IconX, IconGripVertical } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface CalcState {
  display: string
  prev: string
  op: string | null
  fresh: boolean
  open: boolean
  focused: boolean
  x: number
  y: number
  w: number
  h: number
  setDisplay: (v: string) => void
  setPrev: (v: string) => void
  setOp: (v: string | null) => void
  setFresh: (v: boolean) => void
  toggle: () => void
  setFocused: (v: boolean) => void
  setPos: (x: number, y: number) => void
  setSize: (w: number, h: number) => void
}

const useCalcStore = create<CalcState>((set) => ({
  display: "0",
  prev: "",
  op: null,
  fresh: true,
  open: false,
  focused: false,
  x: -1,
  y: -1,
  w: 220,
  h: 280,
  setDisplay: (display) => set({ display }),
  setPrev: (prev) => set({ prev }),
  setOp: (op) => set({ op }),
  setFresh: (fresh) => set({ fresh }),
  toggle: () => set((s) => ({ open: !s.open })),
  setFocused: (focused) => set({ focused }),
  setPos: (x, y) => set({ x, y }),
  setSize: (w, h) => set({ w, h }),
}))

function compute(a: string, b: string, op: string): string {
  const x = parseFloat(a)
  const y = parseFloat(b)
  if (isNaN(x) || isNaN(y)) return "0"
  let r: number
  switch (op) {
    case "+": r = x + y; break
    case "-": r = x - y; break
    case "×": r = x * y; break
    case "÷": r = y === 0 ? NaN : x / y; break
    default: return b
  }
  if (isNaN(r) || !isFinite(r)) return "Error"
  return parseFloat(r.toPrecision(12)).toString()
}

const KEY_MAP: Record<string, string> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "+", "-": "-", "*": "×", "/": "÷",
  Enter: "=", "=": "=", Escape: "C", Backspace: "⌫",
  "%": "%",
}

const BUTTONS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
]

const MIN_W = 180
const MIN_H = 240

function CalcPanel() {
  const {
    display, prev, op, fresh, focused,
    setDisplay, setPrev, setOp, setFresh, setFocused,
    x, y, w, h, setPos, setSize, toggle,
  } = useCalcStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0 })
  const resizeStart = useRef({ mx: 0, my: 0, w: 0, h: 0 })

  useEffect(() => {
    if (x === -1 && y === -1) {
      setPos(window.innerWidth - 260, 80)
    }
  }, [x, y, setPos])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!useCalcStore.getState().focused) return
      const mapped = KEY_MAP[e.key]
      if (mapped) {
        e.preventDefault()
        e.stopPropagation()
        press(mapped)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [setFocused])

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setFocused(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, x, y }
    function onMove(ev: MouseEvent) {
      setPos(
        Math.max(0, dragStart.current.x + ev.clientX - dragStart.current.mx),
        Math.max(0, dragStart.current.y + ev.clientY - dragStart.current.my)
      )
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [x, y, setPos, setFocused])

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeStart.current = { mx: e.clientX, my: e.clientY, w, h }
    function onMove(ev: MouseEvent) {
      setSize(
        Math.max(MIN_W, resizeStart.current.w + ev.clientX - resizeStart.current.mx),
        Math.max(MIN_H, resizeStart.current.h + ev.clientY - resizeStart.current.my)
      )
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [w, h, setSize])

  function press(key: string) {
    const s = useCalcStore.getState()
    const d = s.display
    const p = s.prev
    const o = s.op
    const f = s.fresh

    if (key === "C") {
      setDisplay("0"); setPrev(""); setOp(null); setFresh(true)
      return
    }
    if (key === "⌫") {
      if (d.length <= 1 || d === "Error") setDisplay("0")
      else setDisplay(d.slice(0, -1))
      return
    }
    if (key === "±") {
      setDisplay(d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d)
      return
    }
    if (key === "%") {
      setDisplay((parseFloat(d) / 100).toString())
      return
    }
    if (["+", "-", "×", "÷"].includes(key)) {
      if (o && !f) {
        const result = compute(p, d, o)
        setPrev(result); setDisplay(result)
      } else {
        setPrev(d)
      }
      setOp(key); setFresh(true)
      return
    }
    if (key === "=") {
      if (o && p) {
        const result = compute(p, d, o)
        setDisplay(result); setPrev(""); setOp(null); setFresh(true)
      }
      return
    }
    if (key === ".") {
      if (f) { setDisplay("0."); setFresh(false); return }
      if (!d.includes(".")) setDisplay(d + ".")
      return
    }
    if (f) { setDisplay(key); setFresh(false) }
    else setDisplay(d === "0" ? key : d + key)
  }

  const displaySize = w > 280 ? "text-2xl" : w > 240 ? "text-xl" : "text-lg"
  const btnPad = h > 320 ? "py-3.5" : "py-2.5"

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[100] flex flex-col border bg-card shadow-2xl select-none",
        focused ? "border-foreground/30" : "border-border"
      )}
      style={{ left: x, top: y, width: w, height: h }}
      onMouseDown={() => setFocused(true)}
    >
      <div
        className="flex h-7 shrink-0 cursor-grab items-center justify-between border-b border-border bg-muted/40 px-2 active:cursor-grabbing"
        onMouseDown={onDragMouseDown}
      >
        <div className="flex items-center gap-1.5">
          <IconGripVertical className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Calculator</span>
        </div>
        <button onClick={toggle} className="text-muted-foreground transition-colors hover:text-foreground">
          <IconX className="size-3" />
        </button>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2 text-right">
        {op && prev && (
          <div className="text-[10px] text-muted-foreground tabular-nums truncate">
            {prev} {op}
          </div>
        )}
        <div className={cn("font-mono font-bold tabular-nums truncate text-foreground", displaySize)}>
          {display}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-4 gap-px bg-border">
        {BUTTONS.map((row, ri) =>
          row.map((key) => {
            const isOp = ["+", "-", "×", "÷"].includes(key)
            const isEq = key === "="
            const isZero = key === "0"
            return (
              <button
                key={`${ri}-${key}`}
                onClick={() => press(key)}
                className={cn(
                  "flex items-center justify-center text-xs font-medium transition-colors",
                  btnPad,
                  isZero && "col-span-2",
                  isEq ? "bg-foreground text-background hover:bg-foreground/80" :
                  isOp ? "bg-muted/80 text-foreground hover:bg-muted" :
                  key === "C" || key === "±" || key === "%" ? "bg-muted/50 text-foreground hover:bg-muted/70" :
                  "bg-card text-foreground hover:bg-muted/30"
                )}
              >
                {key}
              </button>
            )
          })
        )}
      </div>

      <div
        className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-se-resize"
        onMouseDown={onResizeMouseDown}
      >
        <svg viewBox="0 0 16 16" className="size-4 text-muted-foreground/40">
          <path d="M14 14L8 14M14 14L14 8M14 14L5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  )
}

function CalculatorToggle({ standalone }: { standalone?: boolean }) {
  const { open, toggle } = useCalcStore()

  if (standalone) {
    return open ? <CalcPanel /> : null
  }

  return (
    <>
      <button
        onClick={toggle}
        className={cn(
          "fixed bottom-4 right-4 z-[99] flex size-10 items-center justify-center border border-border bg-card shadow-lg transition-colors hover:bg-muted",
          open && "bg-muted"
        )}
        title="Calculator"
      >
        <IconCalculator className="size-5 text-foreground" />
      </button>
      {open && <CalcPanel />}
    </>
  )
}

export { CalculatorToggle, useCalcStore }

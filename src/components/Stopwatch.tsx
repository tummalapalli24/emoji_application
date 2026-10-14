import { useEffect, useState } from 'react'

interface Props {
  /** performance.now() timestamp when the round began, or null if not running. */
  startedAt: number | null
  capMs: number
  /** Frozen time to display after the round ends. */
  finishedMs: number | null
  label: string
}

/** Count-up timer for Speed Run and Mystery Face, with a bar toward the time limit. */
export function Stopwatch({ startedAt, capMs, finishedMs, label }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === null) return
    let raf = 0
    const step = () => {
      const now = Math.min(capMs, performance.now() - startedAt)
      setElapsed(now)
      if (now < capMs) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, capMs])

  const shown = finishedMs ?? (startedAt === null ? 0 : elapsed)
  const pct = (shown / capMs) * 100
  const urgent = startedAt !== null && capMs - shown <= 3000

  return (
    <footer className="surface flex items-center gap-4 rounded-[1.75rem] px-5 py-3 md:gap-6 md:px-7 md:py-4">
      <div className={`flex items-baseline gap-1.5 rounded-2xl px-3 py-1 transition-colors ${urgent ? 'animate-urgent bg-az-red' : 'bg-az-blue/70'}`}>
        <span className="font-display w-[5.5ch] text-center text-4xl text-white tabular-nums md:text-5xl">{(shown / 1000).toFixed(1)}</span>
        <span className="font-display text-base text-white/70 md:text-lg">SEC</span>
      </div>
      <div className="flex-1">
        <div className="relative h-6 overflow-hidden rounded-full bg-az-night/70 ring-1 ring-cloud/10 md:h-8">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-azurite via-cloud to-az-red shadow-[0_0_24px_rgba(171,5,32,0.6)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 flex justify-between text-xs font-extrabold tracking-wide text-cloud/60 md:text-sm">
          <span>{label}</span>
          <span>MAX {capMs / 1000}s</span>
        </p>
      </div>
    </footer>
  )
}

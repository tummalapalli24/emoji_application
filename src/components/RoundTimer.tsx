import { useEffect, useRef, useState } from 'react'
import { sounds } from '../lib/sound'

interface Props {
  /** performance.now() timestamp when the round began, or null if not running. */
  startedAt: number | null
  durationMs: number
  /** What to show when not running: a full bar (upcoming) or empty bar (finished). */
  idleState: 'full' | 'empty'
}

export function RoundTimer({ startedAt, durationMs, idleState }: Props) {
  const [runningRemaining, setRemaining] = useState(durationMs)
  const lastSecond = useRef<number | null>(null)

  useEffect(() => {
    lastSecond.current = null
    if (startedAt === null) return
    let raf = 0
    const step = () => {
      const left = Math.max(0, durationMs - (performance.now() - startedAt))
      setRemaining(left)
      const sec = Math.ceil(left / 1000)
      if (lastSecond.current !== null && sec !== lastSecond.current && sec > 0 && sec <= 3) sounds.tick()
      lastSecond.current = sec
      if (left > 0) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, durationMs])

  const remaining = startedAt === null ? (idleState === 'full' ? durationMs : 0) : runningRemaining
  const seconds = Math.ceil(remaining / 1000)
  const pct = (remaining / durationMs) * 100
  const urgent = startedAt !== null && remaining <= 2000 && remaining > 0

  return (
    <footer className="surface flex items-center gap-4 rounded-[1.75rem] px-5 py-3 md:gap-6 md:px-7 md:py-4">
      <div className={`flex items-baseline gap-1.5 rounded-2xl px-3 py-1 transition-colors ${urgent ? 'animate-urgent bg-az-red' : 'bg-az-blue/70'}`}>
        <span className="font-display w-10 text-center text-5xl text-white tabular-nums md:w-14 md:text-6xl">{seconds}</span>
        <span className="font-display text-base text-white/70 md:text-lg">SEC</span>
      </div>
      <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-az-night/70 ring-1 ring-cloud/10 md:h-8">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white via-cloud to-az-red shadow-[0_0_24px_rgba(171,5,32,0.6)]"
          style={{ width: `${pct}%` }}
        />
        <div className="animate-shimmer absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:50%_100%] bg-no-repeat" />
      </div>
    </footer>
  )
}

import { useEffect, useState, type RefObject } from 'react'
import { motion } from 'motion/react'
import type { Blendshapes, ExpressionDefinition } from '../lib/expressions'

interface Props {
  expression: ExpressionDefinition
  source: RefObject<(Blendshapes | null)[]>
}

/** Shows students the exact face movements the AI is measuring for the current emoji. */
export function XRayPanel({ expression, source }: Props) {
  const [values, setValues] = useState<Blendshapes | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      const latest = source.current[0]
      setValues(latest ? { ...latest } : null)
    }, 100)
    return () => window.clearInterval(id)
  }, [source])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="pointer-events-none absolute right-3 bottom-3 left-3 rounded-2xl border border-az-red/60 bg-az-night/80 p-3 backdrop-blur md:right-auto md:w-80"
    >
      <p className="font-display text-sm text-white md:text-base">
        🔬 AI X-RAY <span className="text-cloud/60">· what it measures</span>
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        {expression.signals.map((s) => {
          const v = values?.[s.key] ?? 0
          return (
            <div key={s.key} className="flex items-center gap-2 text-xs font-bold text-cloud md:text-sm">
              <span className="w-36 shrink-0 truncate">{s.label}</span>
              <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white to-az-red" style={{ width: `${v * 100}%` }} />
              </span>
              <span className="w-9 text-right tabular-nums">{Math.round(v * 100)}%</span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[0.7rem] font-semibold text-cloud/60 md:text-xs">The AI turns 478 face points into movement numbers like these.</p>
    </motion.div>
  )
}

import { useEffect, useState, type RefObject } from 'react'
import type { Blendshapes } from '../lib/expressions'

const KEYS = [
  'mouthSmileLeft',
  'mouthSmileRight',
  'jawOpen',
  'mouthFunnel',
  'mouthPucker',
  'mouthFrownLeft',
  'mouthFrownRight',
  'browInnerUp',
  'browDownLeft',
  'browDownRight',
  'eyeBlinkLeft',
  'eyeBlinkRight',
]

/** Raw blendshape values for calibrating at the booth. Enable with ?debug in the URL. */
export function DebugReadout({ source }: { source: RefObject<Blendshapes | null> }) {
  const [values, setValues] = useState<Blendshapes | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setValues(source.current ? { ...source.current } : null), 120)
    return () => window.clearInterval(id)
  }, [source])

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-az-night/80 p-3 font-mono text-xs text-cloud backdrop-blur">
      {KEYS.map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-32">{k}</span>
          <span className="h-1.5 w-20 overflow-hidden rounded bg-white/10">
            <span className="block h-full bg-az-red" style={{ width: `${(values?.[k] ?? 0) * 100}%` }} />
          </span>
          <span className="w-10 text-right tabular-nums">{values ? (values[k] ?? 0).toFixed(2) : '-'}</span>
        </div>
      ))}
    </div>
  )
}

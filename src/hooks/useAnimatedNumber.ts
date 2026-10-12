import { useEffect, useRef, useState } from 'react'

/** Smoothly tweens a displayed number toward `target`. */
export function useAnimatedNumber(target: number, durationMs = 600) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const valueRef = useRef(target)

  useEffect(() => {
    fromRef.current = valueRef.current
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(fromRef.current + (target - fromRef.current) * eased)
      valueRef.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

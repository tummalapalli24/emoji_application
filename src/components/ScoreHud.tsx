import { motion } from 'motion/react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { formatTime } from '../lib/modes'

const bump = (value: number) =>
  ({
    initial: value > 0 ? { scale: 1.12 } : false,
    animate: { scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 14 },
  }) as const

/** Running total time for Speed Run and Mystery Face. */
export function TimeScore({ totalMs }: { totalMs: number }) {
  const shown = useAnimatedNumber(Math.round(totalMs / 10), 700)
  return (
    <motion.div
      key={totalMs}
      {...bump(totalMs)}
      className="btn-red flex items-center gap-3 rounded-2xl px-4 py-2 shadow-[0_12px_40px_-10px_rgba(171,5,32,0.9)] md:gap-4 md:px-6 md:py-2.5"
    >
      <span className="font-display text-xs leading-tight text-white/85 md:text-base">
        TOTAL
        <br className="md:hidden" /> TIME
      </span>
      <span className="font-display text-3xl text-white tabular-nums md:text-5xl">{formatTime(shown * 10)}</span>
    </motion.div>
  )
}

interface VersusProps {
  labels: [string, string]
  scores: [number, number]
}

/** Side-by-side totals for Face-Off and Team Relay. Left is Arizona Red, right is Azurite. */
export function VersusScore({ labels, scores }: VersusProps) {
  const left = useAnimatedNumber(scores[0], 900)
  const right = useAnimatedNumber(scores[1], 900)
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <motion.div key={`left-${scores[0]}`} {...bump(scores[0])} className="btn-red flex items-baseline gap-2 rounded-2xl px-3 py-1.5 md:px-5 md:py-2">
        <span className="font-display text-xs text-white/85 md:text-base">{labels[0]}</span>
        <span className="font-display text-2xl text-white tabular-nums md:text-4xl">{left}</span>
      </motion.div>
      <span className="font-display text-base text-cloud/70 md:text-xl">VS</span>
      <motion.div
        key={`right-${scores[1]}`}
        {...bump(scores[1])}
        className="flex items-baseline gap-2 rounded-2xl border-[3px] border-white/90 bg-azurite px-3 py-1.5 md:px-5 md:py-2"
      >
        <span className="font-display text-2xl text-white tabular-nums md:text-4xl">{right}</span>
        <span className="font-display text-xs text-white/85 md:text-base">{labels[1]}</span>
      </motion.div>
    </div>
  )
}

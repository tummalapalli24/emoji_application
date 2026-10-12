import { motion } from 'motion/react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

interface Props {
  total: number
  max: number
}

export function TotalScore({ total, max }: Props) {
  const shown = useAnimatedNumber(total, 1000)
  return (
    <motion.div
      key={total}
      initial={total > 0 ? { scale: 1.12 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      className="btn-red flex items-center gap-3 rounded-2xl px-4 py-2 shadow-[0_12px_40px_-10px_rgba(171,5,32,0.9)] md:gap-4 md:px-6 md:py-2.5"
    >
      <span className="font-display text-xs leading-tight text-white/85 md:text-base">
        TOTAL
        <br className="md:hidden" /> SCORE
      </span>
      <span className="font-display text-3xl text-white tabular-nums md:text-5xl">{shown}</span>
      <span className="font-display text-lg text-white/70 md:text-2xl">/ {max}</span>
    </motion.div>
  )
}

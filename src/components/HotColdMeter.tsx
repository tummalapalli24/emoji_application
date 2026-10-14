import { motion } from 'motion/react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

interface Props {
  score: number
  trend: number
  faceVisible: boolean
  /** Score needed to find the mystery face. */
  target: number
  found: boolean
}

const LEVELS = [
  { min: 0, emoji: '🥶', label: 'FREEZING' },
  { min: 15, emoji: '❄️', label: 'COLD' },
  { min: 30, emoji: '😐', label: 'COOL' },
  { min: 45, emoji: '☀️', label: 'WARM' },
  { min: 58, emoji: '🌶️', label: 'HOT!' },
  { min: 68, emoji: '🔥', label: 'ON FIRE!' },
]

/** Warmer/colder thermometer for Mystery Face. Fills from Azurite (cold) to Arizona Red (hot). */
export function HotColdMeter({ score, trend, faceVisible, target, found }: Props) {
  const shown = useAnimatedNumber(found ? 100 : score, 300)
  const level = [...LEVELS].reverse().find((l) => shown >= l.min) ?? LEVELS[0]
  const direction = !faceVisible || found ? null : trend >= 4 ? 'WARMER' : trend <= -4 ? 'COLDER' : null

  return (
    <section className="surface flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-[2rem] p-4 lg:gap-4 lg:p-6">
      <p className="font-display text-base tracking-wide text-cloud/80 md:text-lg xl:text-2xl">HOT OR COLD?</p>

      <motion.span
        key={level.label}
        initial={{ scale: 0.4, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
        className="emoji text-6xl md:text-7xl xl:text-8xl"
      >
        {found ? '🎉' : faceVisible ? level.emoji : '🙈'}
      </motion.span>
      <p className="font-display text-2xl text-white md:text-3xl xl:text-4xl">{found ? 'FOUND IT!' : faceVisible ? level.label : 'NO FACE'}</p>

      <div className="relative h-5 w-full max-w-[15rem] overflow-hidden rounded-full bg-az-night/70 ring-1 ring-cloud/10 md:h-6">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-azurite via-cloud to-az-red"
          style={{ width: `${shown}%` }}
        />
        <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_white]" style={{ left: `${target}%` }} />
      </div>

      <div className="h-9">
        {direction && (
          <motion.p
            key={direction}
            initial={{ y: direction === 'WARMER' ? 12 : -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`font-display rounded-full px-4 py-1 text-lg text-white md:text-xl ${direction === 'WARMER' ? 'bg-az-red' : 'bg-azurite'}`}
          >
            {direction === 'WARMER' ? '▲ WARMER' : '▼ COLDER'}
          </motion.p>
        )}
      </div>
    </section>
  )
}

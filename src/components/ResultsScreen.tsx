import { motion } from 'motion/react'
import { MAX_ROUND_POINTS, MAX_TOTAL_POINTS, type ExpressionDefinition } from '../lib/expressions'
import { performanceMessage } from '../lib/scoring'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { Confetti } from './Confetti'
import { Attribution, BackgroundOrbs } from './Background'

interface Props {
  rounds: ExpressionDefinition[]
  scores: number[]
  onPlayAgain: () => void
  starting: boolean
}

const spring = { type: 'spring', stiffness: 240, damping: 18 } as const

export function ResultsScreen({ rounds, scores, onPlayAgain, starting }: Props) {
  const total = scores.reduce((a, s) => a + s, 0)
  const shown = useAnimatedNumber(total, 1800)
  const message = performanceMessage(total, MAX_TOTAL_POINTS)

  return (
    <div className="az-bg flex h-full flex-col items-center justify-center overflow-hidden px-6 py-6 text-center">
      <BackgroundOrbs />
      <Confetti />

      <motion.p
        initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: -3 }}
        transition={spring}
        className="font-display btn-red rounded-2xl px-6 py-2 text-[clamp(1.6rem,min(4vw,6vh),3.2rem)] text-white shadow-[0_14px_40px_-8px_rgba(171,5,32,0.9)]"
      >
        BEAR DOWN! <span className="emoji">🐻</span>
      </motion.p>

      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.15 }}
        className="font-display title-shadow mt-4 text-[clamp(2.2rem,min(6vw,8vh),5.5rem)] leading-none text-white"
      >
        CHALLENGE COMPLETE!
      </motion.h1>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.3 }}
        className="relative mt-3 flex items-baseline gap-3"
      >
        <span className="font-display red-glow-text text-[clamp(5rem,min(15vw,20vh),12rem)] leading-none text-white tabular-nums">{shown}</span>
        <span className="font-display text-[clamp(2rem,min(5vw,7vh),4rem)] text-cloud/60">/ {MAX_TOTAL_POINTS}</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
        <p className="font-display text-[clamp(1.4rem,min(3.2vw,5vh),2.8rem)] text-az-red-tint">{message.title}</p>
        <p className="mt-1 text-lg font-bold text-cloud md:text-xl">{message.subtitle}</p>
      </motion.div>

      <div className="mt-[min(4vh,2rem)] flex flex-wrap justify-center gap-4 md:gap-6">
        {rounds.map((r, i) => {
          const pts = scores[i] ?? 0
          return (
            <motion.div
              key={r.id}
              initial={{ y: 60, opacity: 0, rotate: i % 2 ? 6 : -6 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ ...spring, delay: 0.5 + i * 0.15 }}
              className="surface flex w-36 flex-col items-center rounded-3xl px-4 py-4 md:w-44 md:py-5"
            >
              <span className="emoji text-[clamp(3rem,min(6vw,8vh),4.5rem)]">{r.emoji}</span>
              <span className="mt-2 text-sm font-extrabold text-cloud/80">{r.name}</span>
              <span className="font-display mt-1 text-3xl text-white md:text-4xl">+{pts}</span>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-az-night/70">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(pts / MAX_ROUND_POINTS) * 100}%` }}
                  transition={{ duration: 1, delay: 0.8 + i * 0.15, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-white to-az-red"
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={onPlayAgain}
        disabled={starting}
        className="btn-red font-display animate-pulse-glow relative z-30 mt-[min(5vh,2.5rem)] rounded-full px-14 py-[clamp(0.9rem,min(2vw,3vh),1.4rem)] text-[clamp(1.5rem,min(3vw,5vh),2.5rem)] text-white disabled:cursor-wait disabled:opacity-80"
      >
        {starting ? 'GETTING READY…' : 'PLAY AGAIN'}
      </motion.button>

      <p className="mt-4 max-w-2xl text-sm font-semibold text-cloud/60 md:text-base">
        🤖 How it worked: the AI tracked 478 points on your face and measured movements like smiling, jaw opening, and blinking —
        all right here in your browser.
      </p>
      <Attribution className="mt-3 text-[0.65rem]! md:text-xs!" />
    </div>
  )
}

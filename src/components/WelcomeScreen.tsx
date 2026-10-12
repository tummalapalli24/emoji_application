import { motion, type Variants } from 'motion/react'
import { EXPRESSIONS, EXPRESSION_POOL, MAX_TOTAL_POINTS, ROUND_COUNT, ROUND_DURATION_MS } from '../lib/expressions'
import { Attribution, BackgroundOrbs } from './Background'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

interface Props {
  onStart: () => void
  starting: boolean
}

export function WelcomeScreen({ onStart, starting }: Props) {
  const emojis = EXPRESSION_POOL.map((id) => EXPRESSIONS[id])

  return (
    <div className="az-bg flex h-full flex-col items-center justify-center overflow-hidden px-6 py-8 text-center">
      <BackgroundOrbs />

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center">
        <motion.div variants={item} className="rounded-full border border-cloud/20 bg-az-blue/60 px-5 py-2 backdrop-blur">
          <Attribution />
        </motion.div>

        <motion.h1 variants={item} className="font-display title-shadow mt-[min(4vh,2rem)] leading-[0.92]">
          <span className="block text-[clamp(3rem,min(12vw,15vh),10rem)] text-white">EMOJI</span>
          <span className="red-glow-text block text-[clamp(3rem,min(12vw,15vh),10rem)] text-az-red">CHALLENGE</span>
        </motion.h1>

        <motion.p variants={item} className="mt-3 text-[clamp(1.25rem,min(2.6vw,4vh),2.1rem)] font-extrabold text-cloud">
          Can You Match the Face?
        </motion.p>

        <motion.div variants={item} className="my-[min(5vh,2.5rem)] flex flex-wrap items-end justify-center gap-x-[clamp(0.75rem,3vw,2.75rem)] gap-y-3">
          {emojis.map((e, i) => (
            <span key={e.id} className="relative flex flex-col items-center">
              <span
                className="emoji animate-float inline-block text-[clamp(2.75rem,min(8vw,12vh),6.5rem)] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
                style={{ animationDelay: `${i * -0.7}s`, animationDuration: `${3 + (i % 3) * 0.4}s` }}
                aria-hidden
              >
                {e.emoji}
              </span>
              <span className="mt-3 h-2.5 w-[60%] rounded-full bg-black/35 blur-[3px]" />
            </span>
          ))}
        </motion.div>

        <motion.button
          variants={item}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onStart}
          disabled={starting}
          className="btn-red font-display animate-pulse-glow rounded-full px-[clamp(2.5rem,5vw,4.5rem)] py-[clamp(1rem,min(2vw,3vh),1.6rem)] text-[clamp(1.5rem,min(3vw,5vh),2.6rem)] text-white disabled:cursor-wait disabled:opacity-80 focus-visible:outline-4 focus-visible:outline-white"
        >
          {starting ? 'GETTING READY…' : 'START CHALLENGE'}
        </motion.button>

        <motion.p variants={item} className="mt-6 text-base font-extrabold tracking-wide text-white md:text-xl">
          {ROUND_COUNT} Rounds <span className="text-az-red-tint">•</span> {ROUND_DURATION_MS / 1000} Seconds Each{' '}
          <span className="text-az-red-tint">•</span> {MAX_TOTAL_POINTS} Points
        </motion.p>

        <motion.p variants={item} className="mt-[min(5vh,2rem)] text-sm font-semibold text-cloud/60">
          🔒 Your camera stays private. Nothing is recorded.
        </motion.p>
      </motion.div>
    </div>
  )
}

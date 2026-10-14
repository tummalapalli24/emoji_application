import { AnimatePresence, motion } from 'motion/react'

/** Big 3-2-1-GO! inside a pulsing Arizona Red ring, with an optional line underneath. */
export function CountdownOverlay({ value, subtitle }: { value: string; subtitle?: string }) {
  const isGo = value === 'GO!'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-az-night/45"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="relative grid place-items-center"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute h-[min(52vw,52vh)] w-[min(52vw,52vh)] rounded-full border-[10px] border-az-red"
          />
          <span
            className={`grid h-[min(42vw,44vh)] w-[min(42vw,44vh)] place-items-center rounded-full border-[6px] ${
              isGo ? 'border-white bg-az-red' : 'border-az-red bg-az-blue/90'
            } shadow-[0_0_80px_rgba(171,5,32,0.75)]`}
          >
            <span className={`font-display title-shadow leading-none text-white ${isGo ? 'text-[min(14vw,15vh)]' : 'text-[min(24vw,26vh)]'}`}>
              {value}
            </span>
          </span>
        </motion.div>
      </AnimatePresence>
      {subtitle && <p className="font-display title-shadow rounded-full bg-az-blue/90 px-6 py-2 text-xl text-white md:text-3xl">{subtitle}</p>}
    </motion.div>
  )
}

interface TransitionProps {
  /** e.g. "ROUND 2 / 3" */
  label: string
  /** e.g. "GET READY!" or "PASS THE CAMERA!" */
  title: string
  subtitle?: string
  emoji: string
  tone?: 'red' | 'blue'
}

/** Full-screen card that introduces the next round or turn. */
export function RoundTransition({ label, title, subtitle, emoji, tone = 'red' }: TransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-none fixed inset-0 z-30 grid place-items-center overflow-hidden bg-az-blue/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
        className={`absolute inset-y-0 w-[60vw] -skew-x-12 bg-gradient-to-r from-transparent ${tone === 'red' ? 'via-az-red/50' : 'via-azurite/70'} to-transparent`}
      />
      <div className="relative px-6 text-center">
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`font-display inline-block rounded-full px-6 py-2 text-xl text-white md:text-3xl ${tone === 'red' ? 'bg-az-red' : 'bg-azurite ring-2 ring-white'}`}
        >
          {label}
        </motion.p>
        <motion.div
          initial={{ scale: 0.2, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          className="emoji my-4 text-[min(28vw,30vh)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
        >
          {emoji}
        </motion.div>
        <motion.p
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.25 }}
          className="font-display red-glow-text text-4xl text-white md:text-6xl"
        >
          {title}
        </motion.p>
        {subtitle && (
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-3 text-lg font-bold text-cloud md:text-2xl"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import type { ExpressionDefinition } from '../lib/expressions'

interface Props {
  expression: ExpressionDefinition
}

export function EmojiDisplay({ expression }: Props) {
  return (
    <section className="surface relative flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[2rem] p-4 lg:gap-4 lg:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(171,5,32,0.35),transparent_58%)]" />
      <p className="font-display relative text-center text-lg leading-tight text-white md:text-2xl xl:text-3xl">
        MAKE THIS <span className="text-az-red-tint">FACE!</span>
      </p>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={expression.id}
          initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.3, rotate: 25 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="relative"
        >
          <span
            className="emoji animate-wiggle block text-[5.5rem] drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)] md:text-[7rem] lg:text-[min(16vw,22vh)]"
            role="img"
            aria-label={expression.name}
          >
            {expression.emoji}
          </span>
        </motion.div>
      </AnimatePresence>
      <div className="relative text-center">
        <p className="font-display text-xl text-white md:text-2xl xl:text-3xl">{expression.name.toUpperCase()}</p>
        <p className="mt-1 hidden text-base font-bold text-cloud/75 sm:block xl:text-lg">{expression.hint}</p>
      </div>
    </section>
  )
}

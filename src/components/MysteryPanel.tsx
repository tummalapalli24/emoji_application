import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EXPRESSIONS, EXPRESSION_POOL, type ExpressionDefinition } from '../lib/expressions'

const CLUE_AT_MS = 8000
const NAME_AT_MS = 16000

interface Props {
  expression: ExpressionDefinition
  revealed: boolean
  /** performance.now() when the round began, or null when not running. */
  startedAt: number | null
  /** Emojis already found this game, shown dimmed in the list of possibilities. */
  solvedIds: string[]
}

/** Hidden target for Mystery Face, with timed clues and the list of possible faces. */
export function MysteryPanel({ expression, revealed, startedAt, solvedIds }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setElapsed(performance.now() - startedAt), 250)
    return () => window.clearInterval(id)
  }, [startedAt])

  const running = startedAt !== null
  const clue = running && elapsed >= NAME_AT_MS ? `Clue: it’s the ${expression.name} face!` : running && elapsed >= CLUE_AT_MS ? expression.mysteryHint : null

  return (
    <section className="surface relative flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[2rem] p-4 lg:gap-3 lg:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,82,136,0.55),transparent_60%)]" />
      <p className="font-display relative text-center text-lg leading-tight text-white md:text-2xl xl:text-3xl">
        {revealed ? 'IT WAS…' : <>MYSTERY <span className="text-az-red-tint">FACE</span></>}
      </p>

      <AnimatePresence mode="popLayout">
        <motion.span
          key={revealed ? expression.id : 'hidden'}
          initial={{ scale: 0.3, rotate: revealed ? -30 : 0, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 14 }}
          className={`emoji relative block text-[5rem] drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)] md:text-[6.5rem] lg:text-[min(13vw,18vh)] ${revealed ? '' : 'animate-wiggle'}`}
        >
          {revealed ? expression.emoji : '❓'}
        </motion.span>
      </AnimatePresence>

      <div className="relative h-14 text-center">
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.p key="name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl text-white md:text-2xl">
              {expression.name.toUpperCase()}
            </motion.p>
          ) : clue ? (
            <motion.p
              key={clue}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-az-red/30 px-3 py-1.5 text-sm font-extrabold text-white ring-1 ring-az-red md:text-base"
            >
              💡 {clue}
            </motion.p>
          ) : (
            <motion.p key="intro" className="text-sm font-bold text-cloud/75 md:text-base">
              Try different faces and follow the hints!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative hidden w-full sm:block">
        <p className="mb-1.5 text-center text-xs font-extrabold tracking-wider text-cloud/60">IT’S ONE OF THESE</p>
        <div className="mx-auto flex max-w-[11rem] flex-wrap justify-center gap-1.5 xl:max-w-[13.5rem]">
          {EXPRESSION_POOL.map((id) => (
            <span
              key={id}
              className={`emoji grid h-9 w-9 place-items-center rounded-xl bg-az-night/50 text-2xl xl:h-11 xl:w-11 xl:text-3xl ${solvedIds.includes(id) ? 'opacity-30' : ''}`}
              title={EXPRESSIONS[id].name}
            >
              {EXPRESSIONS[id].emoji}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

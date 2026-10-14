import { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { EXPRESSIONS, EXPRESSION_POOL } from '../lib/expressions'
import { MODES, type ModeId } from '../lib/modes'
import { formatBoardValue, getBoard, type BoardId } from '../lib/leaderboard'
import { Attribution, BackgroundOrbs } from './Background'
import { LeaderboardModal } from './LeaderboardModal'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

const EXTRA_MODES: ModeId[] = ['speed', 'mystery', 'faceoff', 'relay']
const TICKER: { board: BoardId; label: string }[] = [
  { board: 'classic', label: 'HIGH SCORE' },
  { board: 'speed', label: 'FASTEST RUN' },
  { board: 'mystery', label: 'MYSTERY RECORD' },
]

interface Props {
  onStart: (mode: ModeId) => void
  starting: boolean
}

export function WelcomeScreen({ onStart, starting }: Props) {
  const [showBoards, setShowBoards] = useState(false)
  const emojis = EXPRESSION_POOL.map((id) => EXPRESSIONS[id])
  const champions = TICKER.map((t) => ({ ...t, top: getBoard(t.board)[0] })).filter((t) => t.top)

  return (
    <div className="az-bg flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
      <BackgroundOrbs />

      <motion.div variants={container} initial="hidden" animate="show" className="flex w-full max-w-6xl flex-col items-center">
        <motion.div variants={item} className="rounded-full border border-cloud/20 bg-az-blue/60 px-5 py-2 backdrop-blur">
          <Attribution />
        </motion.div>

        <motion.h1 variants={item} className="font-display title-shadow mt-[min(3vh,1.5rem)] leading-[0.92]">
          <span className="block text-[clamp(2.75rem,min(10vw,11vh),8.5rem)] text-white">EMOJI</span>
          <span className="red-glow-text block text-[clamp(2.75rem,min(10vw,11vh),8.5rem)] text-az-red">CHALLENGE</span>
        </motion.h1>

        <motion.p variants={item} className="mt-2 text-[clamp(1.15rem,min(2.4vw,3.5vh),2rem)] font-extrabold text-cloud">
          Can You Match the Face?
        </motion.p>

        <motion.div variants={item} className="my-[min(3vh,1.75rem)] flex flex-wrap items-end justify-center gap-x-[clamp(0.75rem,3vw,2.5rem)] gap-y-2">
          {emojis.map((e, i) => (
            <span key={e.id} className="relative flex flex-col items-center">
              <span
                className="emoji animate-float inline-block text-[clamp(2.5rem,min(7vw,9vh),5.5rem)] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
                style={{ animationDelay: `${i * -0.7}s`, animationDuration: `${3 + (i % 3) * 0.4}s` }}
                aria-hidden
              >
                {e.emoji}
              </span>
              <span className="mt-2 h-2 w-[60%] rounded-full bg-black/35 blur-[3px]" />
            </span>
          ))}
        </motion.div>

        <motion.button
          variants={item}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onStart('classic')}
          disabled={starting}
          className="btn-red font-display animate-pulse-glow rounded-full px-[clamp(2.5rem,5vw,4.5rem)] py-[clamp(0.9rem,min(2vw,2.6vh),1.5rem)] text-[clamp(1.5rem,min(3vw,4.5vh),2.6rem)] text-white disabled:cursor-wait disabled:opacity-80 focus-visible:outline-4 focus-visible:outline-white"
        >
          {starting ? 'GETTING READY…' : 'START CHALLENGE'}
        </motion.button>

        <motion.p variants={item} className="mt-3 text-base font-extrabold tracking-wide text-white md:text-lg">
          {MODES.classic.details.split(' • ').map((part, i) => (
            <span key={part}>
              {i > 0 && <span className="text-az-red-tint"> • </span>}
              {part}
            </span>
          ))}
        </motion.p>

        <motion.p variants={item} className="font-display mt-[min(3.5vh,1.75rem)] text-sm tracking-[0.2em] text-cloud/70 md:text-base">
          MORE WAYS TO PLAY
        </motion.p>
        <motion.div variants={item} className="mt-2 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {EXTRA_MODES.map((id) => {
            const m = MODES[id]
            return (
              <motion.button
                key={id}
                type="button"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onStart(id)}
                disabled={starting}
                className="surface group flex flex-col items-center rounded-3xl px-3 py-3 transition-colors hover:border-az-red disabled:opacity-60 md:py-4"
              >
                <span className="emoji text-4xl transition-transform group-hover:scale-110 md:text-5xl">{m.icon}</span>
                <span className="font-display mt-1.5 text-lg text-white md:text-xl">{m.name.toUpperCase()}</span>
                <span className="text-sm font-bold text-cloud/80">{m.tagline}</span>
                <span className="mt-2 rounded-full bg-az-red/25 px-2.5 py-0.5 text-[0.7rem] font-extrabold tracking-wider text-white ring-1 ring-az-red/60">
                  {m.playersLabel}
                </span>
              </motion.button>
            )
          })}
        </motion.div>

        <motion.div variants={item} className="mt-[min(3vh,1.5rem)] flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowBoards(true)}
            className="font-display rounded-full border-2 border-white/80 bg-az-blue px-6 py-2.5 text-lg text-white transition hover:bg-az-red active:scale-95"
          >
            🏆 LEADERBOARDS
          </button>
          {champions.map((c) => (
            <span key={c.board} className="surface rounded-full px-4 py-2 text-sm font-extrabold text-cloud">
              <span className="emoji">{MODES[c.board].icon}</span> {c.label}: <span className="font-display text-white">{c.top.initials}</span>{' '}
              {formatBoardValue(c.board, c.top.value)}
            </span>
          ))}
        </motion.div>

        <motion.p variants={item} className="mt-[min(3vh,1.5rem)] text-sm font-semibold text-cloud/60">
          🔒 Your camera stays private. Nothing is recorded.
        </motion.p>
      </motion.div>

      <AnimatePresence>{showBoards && <LeaderboardModal key="boards" onClose={() => setShowBoards(false)} />}</AnimatePresence>
    </div>
  )
}

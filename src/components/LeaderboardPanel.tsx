import { motion } from 'motion/react'
import { formatBoardValue, type BoardId, type LeaderboardEntry } from '../lib/leaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  board: BoardId
  title: string
  entries: LeaderboardEntry[]
  /** Row to highlight, e.g. the score just saved. */
  highlight?: number | null
  compact?: boolean
}

export function LeaderboardPanel({ board, title, entries, highlight = null, compact = false }: Props) {
  return (
    <div className={`surface w-full rounded-[2rem] ${compact ? 'p-4' : 'p-5 md:p-6'}`}>
      <p className="font-display text-center text-xl text-white md:text-2xl">🏆 {title}</p>
      {entries.length === 0 ? (
        <p className="mt-6 mb-4 text-center text-base font-bold text-cloud/70">No scores yet. Be the first!</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-1.5">
          {entries.map((e, i) => (
            <motion.li
              key={`${e.at}-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-xl px-3 ${compact ? 'py-1' : 'py-1.5'} ${
                i === highlight ? 'bg-az-red ring-2 ring-white' : i < 3 ? 'bg-white/10' : 'bg-az-night/40'
              }`}
            >
              <span className="emoji w-8 text-center text-xl font-extrabold text-cloud">{MEDALS[i] ?? `${i + 1}`}</span>
              <span className="font-display flex-1 text-xl tracking-widest text-white md:text-2xl">{e.initials}</span>
              <span className="font-display text-lg text-white tabular-nums md:text-xl">{formatBoardValue(board, e.value)}</span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}

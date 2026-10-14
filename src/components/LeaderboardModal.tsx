import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { MODES } from '../lib/modes'
import { clearBoards, getBoard, type BoardId } from '../lib/leaderboard'
import { LeaderboardPanel } from './LeaderboardPanel'

const BOARDS: BoardId[] = ['classic', 'speed', 'mystery']
const HOLD_TO_CLEAR_MS = 3000

/** All leaderboards in one place, with a hold-to-clear button for booth staff. */
export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<BoardId>('speed')
  const [version, setVersion] = useState(0)
  const [holding, setHolding] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const entries = getBoard(tab)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const startHold = () => {
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      clearBoards()
      setVersion((v) => v + 1)
      setHolding(false)
    }, HOLD_TO_CLEAR_MS)
  }
  const stopHold = () => {
    setHolding(false)
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-az-night/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="flex max-h-full w-full max-w-2xl flex-col items-center gap-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {BOARDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`font-display rounded-full px-4 py-2 text-base transition md:text-lg ${tab === id ? 'btn-red text-white' : 'surface text-cloud hover:text-white'}`}
            >
              <span className="emoji">{MODES[id].icon}</span> {MODES[id].name.toUpperCase()}
            </button>
          ))}
        </div>

        <LeaderboardPanel key={`${tab}-${version}`} board={tab} title={tab === 'classic' ? 'HIGHEST SCORES' : 'FASTEST TIMES'} entries={entries} />

        <div className="flex items-center gap-4">
          <button type="button" onClick={onClose} className="btn-red font-display rounded-full px-10 py-3 text-xl text-white">
            CLOSE
          </button>
          <button
            type="button"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            className="relative overflow-hidden rounded-full border border-cloud/20 px-4 py-2 text-xs font-bold text-cloud/50 hover:text-cloud"
          >
            <span
              className="absolute inset-y-0 left-0 bg-az-red/60"
              style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${HOLD_TO_CLEAR_MS}ms linear` : 'none' }}
            />
            <span className="relative">Hold 3s to clear all scores</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

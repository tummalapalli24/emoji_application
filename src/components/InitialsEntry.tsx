import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { isAllowedInitials } from '../lib/leaderboard'
import { sounds } from '../lib/sound'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface Props {
  /** 0-based leaderboard position this score earns. */
  rank: number
  unit: 'SCORE' | 'TIME'
  onSave: (initials: string) => void
  onSkip: () => void
}

/** Arcade-style 3-letter initials picker. Big tap targets, plus keyboard typing. */
export function InitialsEntry({ rank, unit, onSave, onSkip }: Props) {
  const [letters, setLetters] = useState([0, 0, 0])
  const [slot, setSlot] = useState(0)
  const [error, setError] = useState(false)
  const initials = letters.map((i) => LETTERS[i]).join('')

  const shift = useCallback((index: number, delta: number) => {
    setError(false)
    setSlot(index)
    setLetters((ls) => ls.map((l, i) => (i === index ? (l + delta + LETTERS.length) % LETTERS.length : l)))
    sounds.click()
  }, [])

  const save = useCallback(() => {
    if (!isAllowedInitials(initials)) {
      setError(true)
      return
    }
    onSave(initials)
  }, [initials, onSave])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (/^[A-Z]$/.test(key)) {
        setError(false)
        setLetters((ls) => ls.map((l, i) => (i === slot ? LETTERS.indexOf(key) : l)))
        setSlot((s) => Math.min(2, s + 1))
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        setSlot((s) => Math.max(0, s - 1))
      } else if (e.key === 'ArrowRight') {
        setSlot((s) => Math.min(2, s + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        shift(slot, -1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        shift(slot, 1)
      } else if (e.key === 'Enter') {
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slot, shift, save])

  const arrow =
    'grid h-12 w-16 place-items-center rounded-2xl bg-white/10 text-2xl text-white transition hover:bg-az-red active:scale-90 md:h-14 md:w-20'

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="surface w-full rounded-[2rem] border-t-4 border-t-az-red! p-5 text-center md:p-6"
    >
      <p className="font-display text-2xl text-white md:text-3xl">{rank === 0 ? `NEW #1 ${unit}!` : `YOU MADE #${rank + 1}!`}</p>
      <p className="mt-1 text-sm font-bold text-cloud/80 md:text-base">Enter your initials for the leaderboard</p>

      <div className="mt-4 flex justify-center gap-3 md:gap-4">
        {letters.map((l, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button type="button" className={arrow} onClick={() => shift(i, -1)} aria-label={`Previous letter for slot ${i + 1}`}>
              ▲
            </button>
            <button
              type="button"
              onClick={() => setSlot(i)}
              className={`font-display grid h-20 w-16 place-items-center rounded-2xl text-5xl text-white transition md:h-24 md:w-20 md:text-6xl ${
                slot === i ? 'bg-az-red ring-4 ring-white' : 'bg-az-night/70 ring-1 ring-cloud/20'
              }`}
            >
              {LETTERS[l]}
            </button>
            <button type="button" className={arrow} onClick={() => shift(i, 1)} aria-label={`Next letter for slot ${i + 1}`}>
              ▼
            </button>
          </div>
        ))}
      </div>

      <p className={`mt-3 h-5 text-sm font-bold ${error ? 'text-az-red-tint' : 'text-cloud/50'}`}>
        {error ? 'Please pick different letters.' : 'Initials only. No real names needed.'}
      </p>

      <div className="mt-3 flex flex-col items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={save}
          className="btn-red font-display rounded-full px-10 py-3 text-2xl text-white shadow-[0_14px_40px_-8px_rgba(171,5,32,0.9)]"
        >
          SAVE {initials}
        </motion.button>
        <button type="button" onClick={onSkip} className="text-sm font-bold text-cloud/60 underline-offset-4 hover:text-white hover:underline">
          Skip
        </button>
      </div>
    </motion.div>
  )
}

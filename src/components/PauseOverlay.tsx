import { motion } from 'motion/react'

interface Props {
  onResume: () => void
  onQuit: () => void
}

/** Pause menu: resume the current round or end the game and return to the start screen. */
export function PauseOverlay({ onResume, onQuit }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-az-night/80 p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="surface w-full max-w-lg rounded-[2rem] border-t-4 border-t-az-red! p-8 text-center md:p-10"
      >
        <div className="emoji text-7xl">⏸️</div>
        <h2 id="pause-title" className="font-display mt-4 text-4xl text-white md:text-5xl">
          PAUSED
        </h2>
        <p className="mt-3 text-lg font-semibold text-cloud">Finished rounds are kept. A round that was in progress restarts with a fresh countdown.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            autoFocus
            onClick={onResume}
            className="btn-red font-display rounded-full px-12 py-4 text-2xl text-white shadow-[0_14px_40px_-8px_rgba(171,5,32,0.9)] transition hover:scale-105 active:scale-95"
          >
            RESUME
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="font-display rounded-full border-2 border-cloud/25 px-8 py-2.5 text-lg text-cloud/80 transition hover:border-az-red hover:text-white active:scale-95"
          >
            END GAME
          </button>
          <p className="text-sm font-semibold text-cloud/50">Ending now won’t save your score.</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

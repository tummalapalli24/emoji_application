import { motion } from 'motion/react'

export type StepStatus = 'pending' | 'done' | 'failed'

export interface StartupError {
  title: string
  message: string
}

interface Props {
  camera: StepStatus
  model: StepStatus
  error: StartupError | null
  onRetry: () => void
  onCancel: () => void
}

function Step({ label, status }: { label: string; status: StepStatus }) {
  return (
    <li className="flex items-center gap-3 text-lg font-extrabold md:text-xl">
      <span className="grid h-8 w-8 place-items-center">
        {status === 'pending' && <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-cloud/20 border-t-az-red" />}
        {status === 'done' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-7 w-7 place-items-center rounded-full bg-white text-base text-az-blue">
            ✓
          </motion.span>
        )}
        {status === 'failed' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-7 w-7 place-items-center rounded-full bg-az-red text-base text-white">
            ✕
          </motion.span>
        )}
      </span>
      <span className={status === 'pending' ? 'text-white' : status === 'done' ? 'text-cloud/70' : 'text-az-red-tint'}>{label}</span>
    </li>
  )
}

/** Shown while the camera and AI model start up, or when either fails. */
export function StartOverlay({ camera, model, error, onRetry, onCancel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-az-night/80 p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="surface w-full max-w-lg rounded-[2rem] border-t-4 border-t-az-red! p-8 text-center md:p-10"
      >
        {error ? (
          <>
            <div className="emoji text-7xl">{camera === 'failed' ? '📷' : '🤖'}</div>
            <h2 className="font-display mt-4 text-3xl text-white md:text-4xl">{error.title}</h2>
            <p className="mt-3 text-lg font-semibold text-cloud">{error.message}</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="btn-red font-display rounded-full px-10 py-4 text-2xl text-white shadow-[0_14px_40px_-8px_rgba(171,5,32,0.9)] transition hover:scale-105 active:scale-95"
              >
                TRY AGAIN
              </button>
              <button type="button" onClick={onCancel} className="text-base font-bold text-cloud/60 underline-offset-4 hover:text-white hover:underline">
                Back to start
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="emoji animate-wiggle text-7xl">🤖</div>
            <h2 className="font-display mt-4 text-3xl text-white md:text-4xl">GETTING READY…</h2>
            <ul className="mx-auto mt-6 flex w-fit flex-col gap-3 text-left">
              <Step label="Turning on your camera" status={camera} />
              <Step label="Loading the AI face model" status={model} />
            </ul>
            <p className="mt-6 text-sm font-semibold text-cloud/60">If your browser asks, click “Allow” to use the camera.</p>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

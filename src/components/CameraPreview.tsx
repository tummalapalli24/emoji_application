import { useEffect, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface Props {
  stream: MediaStream
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** Whether each player's face is visible. Two entries switch to the Face-Off split view. */
  faces: boolean[]
  ready: boolean
  children?: ReactNode
}

/** Large mirrored webcam view with the AI landmark overlay. */
export function CameraPreview({ stream, videoRef, canvasRef, faces, ready, children }: Props) {
  const faceVisible = faces.some(Boolean)
  const split = faces.length === 2
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    video.play().catch(() => {})
    return () => {
      video.srcObject = null
    }
  }, [stream, videoRef])

  return (
    <section
      className={`relative h-full min-h-[14rem] overflow-hidden rounded-[2rem] border-2 bg-az-night transition-[border-color,box-shadow] duration-500 ${
        faceVisible
          ? 'border-az-red shadow-[0_0_0_1px_rgba(171,5,32,0.4),0_0_36px_rgba(171,5,32,0.55),0_30px_80px_-20px_rgba(0,0,0,0.8)]'
          : 'border-azurite shadow-[0_0_30px_rgba(30,82,136,0.6),0_30px_80px_-20px_rgba(0,0,0,0.8)]'
      }`}
    >
      <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />

      {split ? (
        <>
          <div className="pointer-events-none absolute inset-y-6 left-1/2 w-0 border-l-2 border-dashed border-white/40" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
            {(['PLAYER 1', 'PLAYER 2'] as const).map((label, i) => (
              <span
                key={label}
                className={`font-display flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white md:text-sm ${i === 0 ? 'bg-az-red' : 'bg-azurite'}`}
              >
                {label} {faces[i] ? '✓' : '· SHOW FACE'}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
          <span className="flex items-center gap-2 rounded-full bg-az-night/70 px-3 py-1.5 text-xs font-extrabold tracking-wider text-white backdrop-blur md:text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${faceVisible ? 'animate-pulse bg-az-red shadow-[0_0_10px_#ab0520]' : 'bg-cloud/50'}`} />
            {faceVisible ? 'AI SEES YOU' : 'LOOKING FOR A FACE…'}
          </span>
          <span className="hidden rounded-full bg-az-night/70 px-3 py-1.5 text-xs font-bold text-cloud/75 backdrop-blur md:block">
            🔒 Processed on this device only
          </span>
        </div>
      )}

      <AnimatePresence>
        {ready && !faceVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 grid place-items-center bg-az-blue/65 backdrop-blur-[2px]"
          >
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="text-center">
              <div className="emoji animate-float text-7xl md:text-8xl">🙈</div>
              <p className="font-display red-glow-text mt-3 text-3xl text-white md:text-5xl">{split ? 'SHOW YOUR FACES!' : 'SHOW YOUR FACE!'}</p>
              <p className="mt-2 text-base font-bold text-cloud md:text-lg">
                {split ? 'Player 1 on the left, Player 2 on the right' : 'Look at the camera and get in the frame'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-az-night/75">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-cloud/20 border-t-az-red" />
        </div>
      )}

      {children}
    </section>
  )
}

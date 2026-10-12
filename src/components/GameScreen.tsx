import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { MAX_TOTAL_POINTS, ROUND_DURATION_MS, type ExpressionDefinition } from '../lib/expressions'
import { useExpressionTracker } from '../hooks/useExpressionTracker'
import { sounds } from '../lib/sound'
import { CameraPreview } from './CameraPreview'
import { EmojiDisplay } from './EmojiDisplay'
import { LiveScoreMeter } from './LiveScoreMeter'
import { RoundTimer } from './RoundTimer'
import { TotalScore } from './TotalScore'
import { CountdownOverlay, RoundTransition } from './RoundTransition'
import { PointsPopup } from './PointsPopup'
import { Attribution } from './Background'
import { DebugReadout } from './DebugReadout'
import { DEBUG_ENABLED } from '../lib/debug'

type Phase = 'countdown' | 'playing' | 'reveal' | 'transition'

const COUNTDOWN_STEP_MS = 1000
const GO_FLASH_MS = 700
const REVEAL_MS = 1900
const TRANSITION_MS = 1600

interface Props {
  stream: MediaStream
  landmarker: FaceLandmarker
  rounds: ExpressionDefinition[]
  onComplete: (scores: number[]) => void
}

export function GameScreen({ stream, landmarker, rounds, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('countdown')
  const [round, setRound] = useState(0)
  const [count, setCount] = useState(3)
  const [showGo, setShowGo] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const scoresRef = useRef<number[]>([])

  const expression = rounds[round]
  const tracker = useExpressionTracker({
    videoRef,
    canvasRef,
    landmarker,
    expression,
    recording: phase === 'playing',
  })
  const { ready, resetRound, getBestScore } = tracker

  // Single state machine: each phase schedules exactly one transition and
  // clears its timers on exit, so rounds can never overlap or double-score.
  useEffect(() => {
    const timers: number[] = []
    const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    if (phase === 'countdown') {
      if (!ready) return
      setCount(3)
      sounds.tick()
      after(COUNTDOWN_STEP_MS, () => {
        setCount(2)
        sounds.tick()
      })
      after(COUNTDOWN_STEP_MS * 2, () => {
        setCount(1)
        sounds.tick()
      })
      after(COUNTDOWN_STEP_MS * 3, () => setPhase('playing'))
    } else if (phase === 'playing') {
      resetRound()
      setStartedAt(performance.now())
      setShowGo(true)
      sounds.go()
      after(GO_FLASH_MS, () => setShowGo(false))
      after(ROUND_DURATION_MS, () => {
        const points = getBestScore()
        scoresRef.current[round] = points
        setScores(scoresRef.current.slice())
        setStartedAt(null)
        sounds.points(points)
        setPhase('reveal')
      })
    } else if (phase === 'reveal') {
      after(REVEAL_MS, () => {
        if (round + 1 < rounds.length) {
          setRound(round + 1)
          setPhase('transition')
        } else {
          onComplete(scoresRef.current.slice())
        }
      })
    } else if (phase === 'transition') {
      after(TRANSITION_MS, () => setPhase('playing'))
    }

    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [phase, round, ready, rounds.length, resetRound, getBestScore, onComplete])

  const total = scores.reduce((a, s) => a + (s ?? 0), 0)
  const countdownValue = phase === 'countdown' && ready ? String(count) : phase === 'playing' && showGo ? 'GO!' : null

  return (
    <div className="az-bg flex h-full flex-col gap-3 p-3 md:gap-5 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="surface flex items-center gap-3 rounded-2xl px-4 py-2 md:px-6 md:py-3">
          <span className="font-display text-xl text-white md:text-3xl">
            ROUND <span className="text-az-red-tint">{round + 1}</span> / {rounds.length}
          </span>
          <div className="hidden gap-1.5 sm:flex">
            {rounds.map((r, i) => {
              const done = i < round || (i === round && phase === 'reveal')
              const current = i === round && !done
              return (
                <span
                  key={r.id}
                  className={`emoji grid h-8 w-8 place-items-center rounded-full text-lg transition md:h-10 md:w-10 md:text-2xl ${
                    done ? 'bg-white/15' : current ? 'bg-az-red/40 ring-2 ring-az-red' : 'font-display bg-az-night/60 text-cloud/40'
                  }`}
                >
                  {i <= round ? r.emoji : '?'}
                </span>
              )
            })}
          </div>
        </div>
        <div className="hidden text-center xl:block">
          <p className="font-display text-2xl tracking-wide text-white">
            EMOJI <span className="text-az-red-tint">CHALLENGE</span>
          </p>
          <Attribution className="mt-0.5 text-[0.65rem]! tracking-[0.14em]" />
        </div>
        <TotalScore total={total} max={MAX_TOTAL_POINTS} />
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-3 [grid-template-areas:'target_meter'_'camera_camera'] md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,0.8fr)] lg:grid-rows-1 lg:[grid-template-areas:'target_camera_meter']">
        <div className="min-h-0 [grid-area:target]">
          <EmojiDisplay expression={expression} />
        </div>
        <div className="min-h-0 [grid-area:camera]">
          <CameraPreview stream={stream} videoRef={videoRef} canvasRef={canvasRef} faceVisible={tracker.faceVisible} ready={ready}>
            {DEBUG_ENABLED && <DebugReadout source={tracker.blendshapesRef} />}
          </CameraPreview>
        </div>
        <div className="min-h-0 [grid-area:meter]">
          <LiveScoreMeter
            score={phase === 'reveal' ? (scores[round] ?? 0) : tracker.live}
            best={phase === 'reveal' ? (scores[round] ?? 0) : tracker.best}
            active={phase === 'playing' || phase === 'reveal'}
            faceVisible={tracker.faceVisible}
          />
        </div>
      </main>

      <div className="pr-[7.5rem]">
        <RoundTimer key={startedAt ?? 'idle'} startedAt={startedAt} durationMs={ROUND_DURATION_MS} idleState={phase === 'reveal' ? 'empty' : 'full'} />
      </div>

      <AnimatePresence>
        {countdownValue && <CountdownOverlay key="countdown" value={countdownValue} />}
        {phase === 'reveal' && <PointsPopup key={`points-${round}`} points={scores[round] ?? 0} />}
        {phase === 'transition' && (
          <RoundTransition key={`transition-${round}`} roundNumber={round + 1} totalRounds={rounds.length} expression={expression} />
        )}
      </AnimatePresence>
    </div>
  )
}

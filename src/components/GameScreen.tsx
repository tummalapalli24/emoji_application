import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { MAX_TOTAL_POINTS } from '../lib/expressions'
import {
  TEAMS,
  formatTime,
  teamTotals,
  totalPoints,
  totalTime,
  turnLabel,
  type ModeDefinition,
  type RoundResult,
  type RoundSpec,
} from '../lib/modes'
import { useExpressionTracker } from '../hooks/useExpressionTracker'
import { roundReaction, speedReaction } from '../lib/scoring'
import { sounds } from '../lib/sound'
import { CameraPreview } from './CameraPreview'
import { EmojiDisplay } from './EmojiDisplay'
import { LiveScoreMeter } from './LiveScoreMeter'
import { RoundTimer } from './RoundTimer'
import { Stopwatch } from './Stopwatch'
import { TotalScore } from './TotalScore'
import { TimeScore, VersusScore } from './ScoreHud'
import { HotColdMeter } from './HotColdMeter'
import { MysteryPanel } from './MysteryPanel'
import { FaceOffMeters } from './FaceOffMeters'
import { XRayPanel } from './XRayPanel'
import { CountdownOverlay, RoundTransition } from './RoundTransition'
import { PointsPopup } from './PointsPopup'
import { PauseOverlay } from './PauseOverlay'
import { Attribution } from './Background'
import { DebugReadout } from './DebugReadout'
import { DEBUG_ENABLED } from '../lib/debug'

type Phase = 'countdown' | 'playing' | 'reveal' | 'transition'

const COUNTDOWN_STEP_MS = 1000
const GO_FLASH_MS = 700

interface Props {
  mode: ModeDefinition
  rounds: RoundSpec[]
  stream: MediaStream
  landmarker: FaceLandmarker
  onComplete: (results: RoundResult[]) => void
  onQuit: () => void
}

export function GameScreen({ mode, rounds, stream, landmarker, onComplete, onQuit }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('countdown')
  const [round, setRound] = useState(0)
  const [count, setCount] = useState(3)
  const [showGo, setShowGo] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const startedAtRef = useRef(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const resultsRef = useRef<RoundResult[]>([])
  const [paused, setPaused] = useState(false)
  const [xray, setXray] = useState(false)

  const spec = rounds[round]
  const expression = spec.expression
  const tracker = useExpressionTracker({
    videoRef,
    canvasRef,
    landmarker,
    expression,
    recording: phase === 'playing' && !paused,
    players: mode.players,
  })
  const { ready, resetRound, getBestScores } = tracker
  const lead = tracker.players[0]
  const result = results[round]
  const xrayAllowed = mode.players === 1 && mode.hideTarget !== 'always'

  const pause = useCallback(() => {
    setPaused(true)
    setStartedAt(null)
    setShowGo(false)
    sounds.click()
  }, [])

  // Resuming re-enters the current phase from the start; a round that was in
  // progress gets a fresh 3-2-1 so the player isn't dropped straight into it.
  const resume = useCallback(() => {
    if (phase === 'playing') setPhase('countdown')
    setPaused(false)
    sounds.click()
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'x' && xrayAllowed && !paused) {
        setXray((v) => !v)
        return
      }
      if (e.key !== 'Escape' && key !== 'p') return
      e.preventDefault()
      if (paused) resume()
      else pause()
    }
    const onHidden = () => {
      if (document.hidden && !paused) pause()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [paused, pause, resume, xrayAllowed])

  /** Freezes the current round. Safe to call more than once; only the first call counts. */
  const finishRound = useCallback(
    (timedOut: boolean) => {
      if (resultsRef.current[round]) return
      const scores = getBestScores()
      const elapsed = performance.now() - startedAtRef.current
      const timeMs = mode.end.kind === 'target' ? (timedOut ? mode.end.capMs : Math.min(elapsed, mode.end.capMs)) : null
      resultsRef.current[round] = { scores, timeMs, timedOut }
      setResults(resultsRef.current.slice())
      setStartedAt(null)
      if (mode.end.kind === 'target') {
        if (timedOut) sounds.roundEnd()
        else sounds.points(100)
      } else {
        sounds.points(Math.max(...scores))
      }
      setPhase('reveal')
    },
    [round, mode.end, getBestScores],
  )

  // Single state machine: each phase schedules exactly one transition and
  // clears its timers on exit, so rounds can never overlap or double-score.
  useEffect(() => {
    if (paused) return
    const timers: number[] = []
    const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    if (phase === 'countdown') {
      if (!ready) return
      resetRound()
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
      const now = performance.now()
      startedAtRef.current = now
      setStartedAt(now)
      setShowGo(true)
      sounds.go()
      after(GO_FLASH_MS, () => setShowGo(false))
      if (mode.end.kind === 'timer') after(mode.end.durationMs, () => finishRound(false))
      else after(mode.end.capMs, () => finishRound(true))
    } else if (phase === 'reveal') {
      after(mode.revealMs, () => {
        if (round + 1 < rounds.length) {
          resetRound()
          setRound(round + 1)
          setPhase('transition')
        } else {
          onComplete(resultsRef.current.slice())
        }
      })
    } else if (phase === 'transition') {
      after(mode.transitionMs, () => setPhase('playing'))
    }

    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [phase, round, ready, paused, rounds.length, mode, resetRound, finishRound, onComplete])

  // Target modes end the moment the sustained score reaches the goal.
  const leadBest = lead.best
  useEffect(() => {
    if (paused || phase !== 'playing' || startedAt === null || mode.end.kind !== 'target') return
    if (leadBest >= mode.end.threshold) finishRound(false)
  }, [leadBest, phase, paused, startedAt, mode.end, finishRound])

  const targetHidden = mode.hideTarget === 'always' || (mode.hideTarget === 'until-go' && phase !== 'playing' && phase !== 'reveal')
  const countdownValue = paused ? null : phase === 'countdown' && ready ? String(count) : phase === 'playing' && showGo ? 'GO!' : null
  const team = spec.turn ? TEAMS[spec.turn.team] : null

  const countdownSubtitle =
    mode.id === 'relay'
      ? turnLabel(spec)
      : mode.id === 'faceoff'
        ? 'P1 ON THE LEFT · P2 ON THE RIGHT'
        : mode.id === 'mystery'
          ? 'FIND THE MYSTERY FACE!'
          : mode.id === 'speed'
            ? 'EMOJI APPEARS AT GO!'
            : undefined

  return (
    <div className="az-bg flex h-full flex-col gap-3 p-3 md:gap-5 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="surface flex items-center gap-3 rounded-2xl px-4 py-2 md:px-6 md:py-3">
          <span className="font-display text-xl whitespace-nowrap text-white md:text-3xl">
            {mode.id === 'relay' ? 'TURN' : 'ROUND'} <span className="text-az-red-tint">{round + 1}</span> / {rounds.length}
          </span>
          <div className="hidden gap-1.5 sm:flex">
            {rounds.map((r, i) => {
              const done = i < round || (i === round && phase === 'reveal')
              const current = i === round && !done
              const visible = mode.hideTarget === 'never' ? i <= round : done
              const turnRing = r.turn ? (r.turn.team === 0 ? 'ring-az-red' : 'ring-azurite') : 'ring-az-red'
              return (
                <span
                  key={i}
                  className={`emoji grid h-8 w-8 place-items-center rounded-full text-lg transition md:h-10 md:w-10 md:text-2xl ${
                    done ? 'bg-white/15' : current ? `bg-az-red/40 ring-2 ${turnRing}` : 'font-display bg-az-night/60 text-cloud/40'
                  } ${r.turn && !current ? `ring-1 ${turnRing}` : ''}`}
                >
                  {visible ? r.expression.emoji : '?'}
                </span>
              )
            })}
          </div>
        </div>
        <div className="hidden text-center 2xl:block">
          <p className="font-display text-2xl tracking-wide whitespace-nowrap text-white">
            EMOJI <span className="text-az-red-tint">CHALLENGE</span>
            <span className="ml-3 rounded-full bg-white/10 px-3 py-0.5 align-middle text-base text-cloud">
              {mode.icon} {mode.name.toUpperCase()}
            </span>
          </p>
          <Attribution className="mt-0.5 text-[0.65rem]! tracking-[0.14em]" />
        </div>
        <div className="flex items-center gap-3">
          {mode.id === 'classic' && <TotalScore total={totalPoints(results)} max={MAX_TOTAL_POINTS} />}
          {mode.end.kind === 'target' && <TimeScore totalMs={totalTime(results)} />}
          {mode.id === 'faceoff' && <VersusScore labels={['P1', 'P2']} scores={[totalPoints(results, 0), totalPoints(results, 1)]} />}
          {mode.id === 'relay' && <VersusScore labels={['RED', 'BLUE']} scores={teamTotals(rounds, results)} />}
          {xrayAllowed && (
            <button
              type="button"
              onClick={() => setXray((v) => !v)}
              aria-pressed={xray}
              title="AI X-Ray (X)"
              className={`font-display flex items-center gap-2 self-stretch rounded-2xl px-4 text-lg transition active:scale-95 focus-visible:outline-2 focus-visible:outline-white md:px-5 md:text-xl ${
                xray ? 'btn-red text-white' : 'surface text-white/85 hover:border-az-red hover:text-white'
              }`}
            >
              <span className="emoji">🔬</span>
              <span className="hidden whitespace-nowrap lg:inline">X-RAY</span>
            </button>
          )}
          <button
            type="button"
            onClick={pause}
            disabled={paused}
            aria-label="Pause game"
            title="Pause (P or Esc)"
            className="surface font-display flex h-full items-center gap-2 self-stretch rounded-2xl px-4 text-lg text-white/85 transition hover:border-az-red hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 md:px-5 md:text-xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            <span className="hidden md:inline">PAUSE</span>
          </button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_minmax(0,1fr)] gap-3 [grid-template-areas:'target_meter'_'camera_camera'] md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,0.8fr)] lg:grid-rows-1 lg:[grid-template-areas:'target_camera_meter']">
        <div className="min-h-0 [grid-area:target]">
          {mode.hideTarget === 'always' ? (
            <MysteryPanel
              key={round}
              expression={expression}
              revealed={phase === 'reveal'}
              startedAt={phase === 'playing' && !paused ? startedAt : null}
              solvedIds={rounds.slice(0, round).map((r) => r.expression.id)}
            />
          ) : (
            <EmojiDisplay
              expression={expression}
              hidden={targetHidden}
              badge={
                team && (
                  <span
                    className={`font-display relative rounded-full px-4 py-1 text-sm text-white md:text-base ${team.tone === 'red' ? 'bg-az-red' : 'bg-azurite ring-2 ring-white/80'}`}
                  >
                    {turnLabel(spec)}
                  </span>
                )
              }
            />
          )}
        </div>
        <div className="min-h-0 [grid-area:camera]">
          <CameraPreview stream={stream} videoRef={videoRef} canvasRef={canvasRef} faces={tracker.players.map((p) => p.faceVisible)} ready={ready}>
            <AnimatePresence>{xray && xrayAllowed && !targetHidden && <XRayPanel key="xray" expression={expression} source={tracker.blendshapesRef} />}</AnimatePresence>
            {DEBUG_ENABLED && <DebugReadout source={tracker.blendshapesRef} />}
          </CameraPreview>
        </div>
        <div className="min-h-0 [grid-area:meter]">
          {mode.hideTarget === 'always' ? (
            <HotColdMeter
              score={lead.live}
              trend={lead.trend}
              faceVisible={lead.faceVisible}
              target={mode.end.kind === 'target' ? mode.end.threshold : 70}
              found={phase === 'reveal' && result !== undefined && !result.timedOut}
            />
          ) : mode.players === 2 ? (
            <FaceOffMeters
              players={tracker.players}
              frozen={phase === 'reveal' && result ? result.scores : null}
              active={!paused && (phase === 'playing' || phase === 'reveal')}
            />
          ) : (
            <LiveScoreMeter
              score={phase === 'reveal' && result && mode.end.kind === 'timer' ? result.scores[0] : lead.live}
              best={phase === 'reveal' && result ? result.scores[0] : lead.best}
              active={!paused && (phase === 'playing' || phase === 'reveal')}
              faceVisible={lead.faceVisible}
              target={mode.end.kind === 'target' ? mode.end.threshold : undefined}
            />
          )}
        </div>
      </main>

      <div className="pr-[7.5rem]">
        {mode.end.kind === 'timer' ? (
          <RoundTimer key={startedAt ?? 'idle'} startedAt={startedAt} durationMs={mode.end.durationMs} idleState={phase === 'reveal' ? 'empty' : 'full'} />
        ) : (
          <Stopwatch
            key={startedAt ?? 'idle'}
            startedAt={startedAt}
            capMs={mode.end.capMs}
            finishedMs={phase === 'reveal' && result ? result.timeMs : null}
            label={mode.id === 'speed' ? `HIT ${mode.end.threshold} TO STOP THE CLOCK` : 'FIND THE FACE TO STOP THE CLOCK'}
          />
        )}
      </div>

      <AnimatePresence>
        {countdownValue && <CountdownOverlay key="countdown" value={countdownValue} subtitle={countdownSubtitle} />}
        {!paused && phase === 'reveal' && result && <PointsPopup key={`reveal-${round}`} {...revealContent(mode, spec, result)} />}
        {!paused && phase === 'transition' && (
          <RoundTransition
            key={`transition-${round}`}
            label={`${mode.id === 'relay' ? 'TURN' : 'ROUND'} ${round + 1} / ${rounds.length}`}
            title={mode.id === 'relay' ? 'PASS THE CAMERA!' : 'GET READY!'}
            subtitle={
              mode.id === 'relay'
                ? `${turnLabel(spec)}, YOU’RE UP!`
                : mode.id === 'mystery'
                  ? 'A brand new mystery face. Hot or cold?'
                  : mode.id === 'speed'
                    ? 'The emoji appears at GO!'
                    : expression.hint
            }
            emoji={mode.id === 'mystery' ? '❓' : mode.id === 'speed' ? '⚡' : expression.emoji}
            tone={team?.tone ?? 'red'}
          />
        )}
        {paused && <PauseOverlay key="pause" onResume={resume} onQuit={onQuit} />}
      </AnimatePresence>
    </div>
  )
}

function revealContent(mode: ModeDefinition, spec: RoundSpec, result: RoundResult) {
  const points = result.scores[0] ?? 0
  const time = result.timeMs ?? 0
  switch (mode.id) {
    case 'speed':
      return result.timedOut
        ? { headline: 'TIME’S UP!', banner: `+${formatTime(time)}`, celebrate: false }
        : { headline: speedReaction(time), banner: `${formatTime(time)}!` }
    case 'mystery':
      return result.timedOut
        ? { emoji: spec.expression.emoji, headline: 'TIME’S UP! IT WAS…', banner: spec.expression.name.toUpperCase(), tone: 'blue' as const, celebrate: false }
        : { emoji: spec.expression.emoji, headline: 'FOUND IT!', banner: formatTime(time) }
    case 'faceoff': {
      const [p1, p2] = result.scores
      if (p1 === p2) return { headline: 'TIE ROUND!', banner: `${p1} VS ${p2}` }
      const p1Wins = p1 > p2
      return { headline: `PLAYER ${p1Wins ? 1 : 2} WINS THE ROUND!`, banner: `${p1} VS ${p2}`, tone: p1Wins ? ('red' as const) : ('blue' as const) }
    }
    case 'relay': {
      const team = TEAMS[spec.turn?.team ?? 0]
      return { headline: `${roundReaction(points)} ${team.name}`, banner: `+${points} POINTS!`, tone: team.tone, celebrate: points >= 45 }
    }
    default:
      return { headline: roundReaction(points), banner: `+${points} POINTS!`, celebrate: points >= 45 }
  }
}

import { useState } from 'react'
import { motion } from 'motion/react'
import { MAX_ROUND_POINTS, MAX_TOTAL_POINTS } from '../lib/expressions'
import { TEAMS, formatTime, teamTotals, totalPoints, totalTime, type ModeDefinition, type RoundResult, type RoundSpec } from '../lib/modes'
import { addEntry, getBoard, rankFor, type BoardId } from '../lib/leaderboard'
import { performanceMessage, timeMessage } from '../lib/scoring'
import { sounds } from '../lib/sound'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { Confetti } from './Confetti'
import { Attribution, BackgroundOrbs } from './Background'
import { InitialsEntry } from './InitialsEntry'
import { LeaderboardPanel } from './LeaderboardPanel'

interface Props {
  mode: ModeDefinition
  rounds: RoundSpec[]
  results: RoundResult[]
  onPlayAgain: () => void
  onMenu: () => void
  starting: boolean
}

const spring = { type: 'spring', stiffness: 240, damping: 18 } as const

export function ResultsScreen({ mode, rounds, results, onPlayAgain, onMenu, starting }: Props) {
  const board: BoardId | null = mode.leaderboard ? (mode.id as BoardId) : null
  const points = totalPoints(results)
  const time = totalTime(results)
  const boardValue = board === 'classic' ? points : time

  const [rank] = useState(() => (board && !(board === 'classic' && points === 0) ? rankFor(board, boardValue) : null))
  const [savedRank, setSavedRank] = useState<number | null>(null)
  const [skipped, setSkipped] = useState(false)
  const [entries, setEntries] = useState(() => (board ? getBoard(board) : []))

  const save = (initials: string) => {
    if (!board) return
    setSavedRank(addEntry(board, initials, boardValue))
    setEntries(getBoard(board))
    sounds.fanfare()
  }

  const enteringInitials = board !== null && rank !== null && savedRank === null && !skipped

  return (
    <div className="az-bg flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
      <BackgroundOrbs />
      <Confetti />

      <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-6 lg:flex-row lg:gap-10">
        <div className="flex min-w-0 flex-col items-center">
          <motion.p
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={spring}
            className="font-display btn-red rounded-2xl px-6 py-2 text-[clamp(1.4rem,min(3.5vw,5vh),2.8rem)] text-white shadow-[0_14px_40px_-8px_rgba(171,5,32,0.9)]"
          >
            BEAR DOWN! <span className="emoji">🐻</span>
          </motion.p>

          <Summary mode={mode} rounds={rounds} results={results} points={points} time={time} />

          <div className="mt-[min(3vh,1.5rem)] flex flex-wrap justify-center gap-3 md:gap-4">
            {rounds.map((r, i) => (
              <RoundCard key={i} index={i} mode={mode} spec={r} result={results[i]} />
            ))}
          </div>

          <div className="mt-[min(4vh,2rem)] flex flex-wrap items-center justify-center gap-4">
            <motion.button
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring, delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onPlayAgain}
              disabled={starting}
              className="btn-red font-display animate-pulse-glow relative z-30 rounded-full px-12 py-[clamp(0.8rem,min(2vw,2.6vh),1.3rem)] text-[clamp(1.4rem,min(2.8vw,4.5vh),2.3rem)] text-white disabled:cursor-wait disabled:opacity-80"
            >
              {starting ? 'GETTING READY…' : 'PLAY AGAIN'}
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              type="button"
              onClick={onMenu}
              disabled={starting}
              className="font-display relative z-30 rounded-full border-2 border-cloud/30 px-8 py-3 text-lg text-cloud transition hover:border-az-red hover:text-white active:scale-95 md:text-xl"
            >
              MAIN MENU
            </motion.button>
          </div>

          <p className="mt-4 max-w-2xl text-sm font-semibold text-cloud/60 md:text-base">
            🤖 How it worked: the AI tracked 478 points on {mode.players === 2 ? 'each face' : 'your face'} and measured movements like smiling, jaw
            opening, and blinking, all right here in your browser.
          </p>
          <Attribution className="mt-2 text-[0.65rem]! md:text-xs!" />
        </div>

        {board && (
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.6 }}
            className="relative z-30 w-full max-w-sm shrink-0"
          >
            {enteringInitials ? (
              <InitialsEntry rank={rank} unit={mode.leaderboard === 'time' ? 'TIME' : 'SCORE'} onSave={save} onSkip={() => setSkipped(true)} />
            ) : (
              <LeaderboardPanel
                board={board}
                title={`${mode.name.toUpperCase()} TOP ${10}`}
                entries={entries}
                highlight={savedRank}
                compact
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function Summary({ mode, rounds, results, points, time }: { mode: ModeDefinition; rounds: RoundSpec[]; results: RoundResult[]; points: number; time: number }) {
  const shownPoints = useAnimatedNumber(points, 1800)
  const shownTime = useAnimatedNumber(Math.round(time / 10), 1800) * 10
  const [a, b] = mode.id === 'relay' ? teamTotals(rounds, results) : [totalPoints(results, 0), totalPoints(results, 1)]
  const shownA = useAnimatedNumber(a, 1800)
  const shownB = useAnimatedNumber(b, 1800)

  let heading = 'CHALLENGE COMPLETE!'
  let message = performanceMessage(points, MAX_TOTAL_POINTS)
  if (mode.end.kind === 'target') {
    heading = mode.id === 'speed' ? 'SPEED RUN COMPLETE!' : 'MYSTERY SOLVED!'
    message = timeMessage(time, rounds.length)
  } else if (mode.players === 2 || mode.id === 'relay') {
    const labels = mode.id === 'relay' ? [TEAMS[0].name, TEAMS[1].name] : ['PLAYER 1', 'PLAYER 2']
    heading = a === b ? 'IT’S A TIE!' : `${a > b ? labels[0] : labels[1]} WINS!`
    message = { title: 'WHAT A MATCH!', subtitle: mode.id === 'relay' ? 'Swap teammates and go for a rematch!' : 'Switch sides and go for a rematch!' }
  }

  const big = 'font-display leading-none tabular-nums text-[clamp(3.5rem,min(10vw,15vh),9rem)]'

  return (
    <>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring, delay: 0.15 }}
        className="font-display title-shadow mt-4 text-[clamp(2rem,min(5vw,7vh),4.5rem)] leading-none text-white"
      >
        {heading}
      </motion.h1>

      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.3 }} className="mt-3">
        {mode.id === 'classic' && (
          <div className="flex items-baseline gap-3">
            <span className={`${big} red-glow-text text-white`}>{shownPoints}</span>
            <span className="font-display text-[clamp(1.8rem,min(4vw,6vh),3.5rem)] text-cloud/60">/ {MAX_TOTAL_POINTS}</span>
          </div>
        )}
        {mode.end.kind === 'target' && <span className={`${big} red-glow-text text-white`}>{formatTime(shownTime)}</span>}
        {(mode.players === 2 || mode.id === 'relay') && (
          <div className="flex items-center gap-4">
            <span className={`${big} rounded-3xl bg-az-red px-5 py-2 text-white ${a >= b ? 'ring-4 ring-white' : 'opacity-80'}`}>{shownA}</span>
            <span className="font-display text-3xl text-cloud/70">VS</span>
            <span className={`${big} rounded-3xl bg-azurite px-5 py-2 text-white ${b >= a ? 'ring-4 ring-white' : 'opacity-80'}`}>{shownB}</span>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-2">
        <p className="font-display text-[clamp(1.3rem,min(3vw,4.5vh),2.5rem)] text-az-red-tint">{message.title}</p>
        <p className="mt-1 text-lg font-bold text-cloud md:text-xl">{message.subtitle}</p>
      </motion.div>
    </>
  )
}

function RoundCard({ index, mode, spec, result }: { index: number; mode: ModeDefinition; spec: RoundSpec; result: RoundResult | undefined }) {
  const pts = result?.scores[0] ?? 0
  let value = `+${pts}`
  let fill = pts / MAX_ROUND_POINTS
  let caption: string = spec.expression.name

  if (mode.end.kind === 'target') {
    const ms = result?.timeMs ?? mode.end.capMs
    value = formatTime(ms)
    fill = 1 - ms / mode.end.capMs
    if (result?.timedOut) caption = `${spec.expression.name} · Time’s up`
  } else if (mode.players === 2) {
    const [p1, p2] = result?.scores ?? [0, 0]
    value = `${p1} · ${p2}`
    fill = Math.max(p1, p2) / MAX_ROUND_POINTS
    caption = p1 === p2 ? 'Tie round' : `Player ${p1 > p2 ? 1 : 2} wins`
  } else if (spec.turn) {
    caption = `${TEAMS[spec.turn.team].short} · P${spec.turn.player}`
  }

  const teamTone = spec.turn ? (spec.turn.team === 0 ? 'border-t-az-red!' : 'border-t-azurite!') : ''

  return (
    <motion.div
      initial={{ y: 60, opacity: 0, rotate: index % 2 ? 6 : -6 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ ...spring, delay: 0.5 + index * 0.12 }}
      className={`surface flex w-32 flex-col items-center rounded-3xl px-3 py-3 md:w-40 md:py-4 ${spec.turn ? `border-t-4 ${teamTone}` : ''}`}
    >
      <span className="emoji text-[clamp(2.5rem,min(5vw,7vh),4rem)]">{spec.expression.emoji}</span>
      <span className="mt-1.5 text-xs font-extrabold text-cloud/80 md:text-sm">{caption}</span>
      <span className="font-display mt-1 text-2xl text-white md:text-3xl">{value}</span>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-az-night/70">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, fill) * 100}%` }}
          transition={{ duration: 1, delay: 0.8 + index * 0.12, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-white to-az-red"
        />
      </div>
    </motion.div>
  )
}

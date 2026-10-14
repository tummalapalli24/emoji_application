import { MAX_ROUND_POINTS, ROUND_COUNT, ROUND_DURATION_MS, pickExpressions, type ExpressionDefinition } from './expressions'

export type ModeId = 'classic' | 'speed' | 'mystery' | 'faceoff' | 'relay'

/** How a round ends: after a fixed time (best score wins), or as soon as a target score is reached. */
export type RoundEnd = { kind: 'timer'; durationMs: number } | { kind: 'target'; threshold: number; capMs: number }

export interface TeamDefinition {
  name: string
  short: string
  tone: 'red' | 'blue'
}

export const TEAMS: [TeamDefinition, TeamDefinition] = [
  { name: 'RED TEAM', short: 'RED', tone: 'red' },
  { name: 'BLUE TEAM', short: 'BLUE', tone: 'blue' },
]

export interface RoundSpec {
  expression: ExpressionDefinition
  /** Team Relay: who is at the camera for this turn. */
  turn?: { team: 0 | 1; player: number }
}

export interface RoundResult {
  /** Best sustained score for each tracked player. */
  scores: number[]
  /** Target modes: time until the match was reached, or the cap if time ran out. */
  timeMs: number | null
  timedOut: boolean
}

export interface ModeDefinition {
  id: ModeId
  name: string
  icon: string
  tagline: string
  details: string
  playersLabel: string
  /** Faces the AI tracks at once. */
  players: 1 | 2
  end: RoundEnd
  /** When the target emoji is visible to the player. */
  hideTarget: 'never' | 'until-go' | 'always'
  leaderboard: 'points' | 'time' | null
  revealMs: number
  transitionMs: number
  planRounds: () => RoundSpec[]
}

const plain = (count = ROUND_COUNT) => pickExpressions(count).map((expression) => ({ expression }))

export const MODES: Record<ModeId, ModeDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    icon: '🎯',
    tagline: 'Score up to 300 points',
    details: `${ROUND_COUNT} Rounds • ${ROUND_DURATION_MS / 1000} Seconds Each • ${ROUND_COUNT * MAX_ROUND_POINTS} Points`,
    playersLabel: '1 PLAYER',
    players: 1,
    end: { kind: 'timer', durationMs: ROUND_DURATION_MS },
    hideTarget: 'never',
    leaderboard: 'points',
    revealMs: 1900,
    transitionMs: 1600,
    planRounds: () => plain(),
  },
  speed: {
    id: 'speed',
    name: 'Speed Run',
    icon: '⚡',
    tagline: 'Fastest time wins',
    details: 'The emoji appears at GO. Hit a 75 match as fast as you can!',
    playersLabel: '1 PLAYER',
    players: 1,
    end: { kind: 'target', threshold: 75, capMs: 12000 },
    hideTarget: 'until-go',
    leaderboard: 'time',
    revealMs: 1700,
    transitionMs: 1500,
    planRounds: () => plain(),
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery Face',
    icon: '❓',
    tagline: 'Warmer or colder?',
    details: 'The emoji is hidden. Follow the hot and cold hints to find it!',
    playersLabel: '1 PLAYER',
    players: 1,
    end: { kind: 'target', threshold: 70, capMs: 25000 },
    hideTarget: 'always',
    leaderboard: 'time',
    revealMs: 2400,
    transitionMs: 1600,
    planRounds: () => plain(),
  },
  faceoff: {
    id: 'faceoff',
    name: 'Face-Off',
    icon: '🆚',
    tagline: '1v1 on one camera',
    details: 'Two players side by side. Best match wins each round!',
    playersLabel: '2 PLAYERS',
    players: 2,
    end: { kind: 'timer', durationMs: ROUND_DURATION_MS },
    hideTarget: 'never',
    leaderboard: null,
    revealMs: 2100,
    transitionMs: 1600,
    planRounds: () => plain(),
  },
  relay: {
    id: 'relay',
    name: 'Team Relay',
    icon: '🤝',
    tagline: '2v2, take turns',
    details: 'Red vs Blue. Teammates take turns at the camera!',
    playersLabel: '2 TEAMS',
    players: 1,
    end: { kind: 'timer', durationMs: ROUND_DURATION_MS },
    hideTarget: 'never',
    leaderboard: null,
    revealMs: 1900,
    transitionMs: 3200,
    // Both teams get the same emoji in each pair of turns so it's fair.
    planRounds: () => {
      const [first, second] = pickExpressions(2)
      return [
        { expression: first, turn: { team: 0, player: 1 } },
        { expression: first, turn: { team: 1, player: 1 } },
        { expression: second, turn: { team: 0, player: 2 } },
        { expression: second, turn: { team: 1, player: 2 } },
      ]
    },
  },
}

export const MODE_ORDER: ModeId[] = ['classic', 'speed', 'mystery', 'faceoff', 'relay']

export const totalPoints = (results: RoundResult[], slot = 0) => results.reduce((a, r) => a + (r?.scores[slot] ?? 0), 0)

export const totalTime = (results: RoundResult[]) => results.reduce((a, r) => a + (r?.timeMs ?? 0), 0)

export function teamTotals(rounds: RoundSpec[], results: RoundResult[]): [number, number] {
  const totals: [number, number] = [0, 0]
  results.forEach((r, i) => {
    const team = rounds[i]?.turn?.team
    if (r && team !== undefined) totals[team] += r.scores[0] ?? 0
  })
  return totals
}

export const formatTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`

export function turnLabel(spec: RoundSpec) {
  return spec.turn ? `${TEAMS[spec.turn.team].name} · PLAYER ${spec.turn.player}` : ''
}

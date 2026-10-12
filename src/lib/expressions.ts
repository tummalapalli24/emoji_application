/**
 * Emoji expression registry.
 *
 * Each expression turns MediaPipe face blendshapes (values 0–1) into a
 * playful 0–100 "match" score. To add a new emoji, add one entry to
 * EXPRESSIONS and include its id in GAME_EXPRESSION_IDS.
 *
 * These scores are a game approximation based on facial movements,
 * not a scientific measure of emotion.
 *
 * Blendshape reference:
 * https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
 */

export type Blendshapes = Record<string, number>

export interface ExpressionDefinition {
  id: string
  emoji: string
  name: string
  /** Short, kid-friendly hint shown under the target emoji. */
  hint: string
  /** Returns a match score from 0 to 100. */
  score: (b: Blendshapes) => number
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Maps `x` linearly from [lo, hi] to [0, 1], clamped. */
const ramp = (x: number, lo: number, hi: number) => clamp01((x - lo) / (hi - lo))

const get = (b: Blendshapes, name: string) => b[name] ?? 0

const avg = (...xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length

/** Eases partial effort upward so the game feels forgiving. */
const forgiving = (x: number) => Math.pow(clamp01(x), 0.8)

const toPercent = (x: number) => Math.round(clamp01(x) * 100)

export const EXPRESSIONS: Record<string, ExpressionDefinition> = {
  happy: {
    id: 'happy',
    emoji: '😀',
    name: 'Big Smile',
    hint: 'Smile as wide as you can!',
    score: (b) => {
      const left = get(b, 'mouthSmileLeft')
      const right = get(b, 'mouthSmileRight')
      const smile = ramp(avg(left, right), 0.12, 0.72)
      const balance = Math.max(left, right) > 0 ? Math.min(left, right) / Math.max(left, right) : 0
      const eyesShut = ramp(Math.min(get(b, 'eyeBlinkLeft'), get(b, 'eyeBlinkRight')), 0.45, 0.8)
      return toPercent(forgiving(smile) * (0.85 + 0.15 * balance) * (1 - 0.2 * eyesShut))
    },
  },

  surprised: {
    id: 'surprised',
    emoji: '😮',
    name: 'Surprised',
    hint: 'Drop your jaw and make an "O"!',
    score: (b) => {
      const jaw = ramp(get(b, 'jawOpen'), 0.05, 0.42)
      const oShape = ramp(Math.max(get(b, 'mouthFunnel'), get(b, 'mouthPucker') * 0.6), 0.03, 0.3)
      const brows = ramp(
        Math.max(get(b, 'browInnerUp'), avg(get(b, 'browOuterUpLeft'), get(b, 'browOuterUpRight'))),
        0.05,
        0.45,
      )
      const smile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.35, 0.75)
      // A wide-open jaw alone scores ~90; raised brows or an "O" shape tops it off.
      const raw = jaw * 0.7 + Math.max(oShape, jaw * 0.7) * 0.1 + Math.max(brows, jaw * 0.5) * 0.2
      return toPercent(forgiving(raw) * (1 - 0.25 * smile))
    },
  },

  relieved: {
    id: 'relieved',
    emoji: '😌',
    name: 'Eyes Closed',
    hint: 'Close both eyes and relax!',
    score: (b) => {
      const left = ramp(get(b, 'eyeBlinkLeft'), 0.28, 0.62)
      const right = ramp(get(b, 'eyeBlinkRight'), 0.28, 0.62)
      const both = Math.min(left, right)
      const softSmile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.05, 0.4)
      const raw = both * 0.8 + avg(left, right) * 0.2 + softSmile * 0.08
      return toPercent(forgiving(raw))
    },
  },
}

/** The emojis used in every game (order is shuffled per game). */
export const GAME_EXPRESSION_IDS = ['happy', 'surprised', 'relieved']

export const ROUND_COUNT = GAME_EXPRESSION_IDS.length
export const ROUND_DURATION_MS = 5000
export const MAX_ROUND_POINTS = 100
export const MAX_TOTAL_POINTS = ROUND_COUNT * MAX_ROUND_POINTS

export function createGameRounds(): ExpressionDefinition[] {
  const rounds = GAME_EXPRESSION_IDS.map((id) => EXPRESSIONS[id])
  for (let i = rounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rounds[i], rounds[j]] = [rounds[j], rounds[i]]
  }
  return rounds
}

export function blendshapesFromCategories(categories: { categoryName: string; score: number }[]): Blendshapes {
  const out: Blendshapes = {}
  for (const c of categories) out[c.categoryName] = c.score
  return out
}

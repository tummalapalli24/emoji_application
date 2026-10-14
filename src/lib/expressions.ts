/**
 * Emoji expression registry.
 *
 * Each expression turns MediaPipe face blendshapes (values 0 to 1) into a
 * playful 0 to 100 "match" score. To add a new emoji, add one entry to
 * EXPRESSIONS and include its id in EXPRESSION_POOL.
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
  /** Clue for Mystery Face mode that doesn't name the emoji. */
  mysteryHint: string
  /** Blendshapes shown in the AI X-Ray panel, with friendly labels. */
  signals: { key: string; label: string }[]
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
    mysteryHint: 'Clue: it’s all about the corners of your mouth.',
    signals: [
      { key: 'mouthSmileLeft', label: 'Smile (left side)' },
      { key: 'mouthSmileRight', label: 'Smile (right side)' },
    ],
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
    mysteryHint: 'Clue: open wide and raise those eyebrows.',
    signals: [
      { key: 'jawOpen', label: 'Jaw open' },
      { key: 'browInnerUp', label: 'Eyebrows up' },
      { key: 'mouthFunnel', label: '"O" mouth shape' },
    ],
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
    mysteryHint: 'Clue: it uses BOTH of your eyes.',
    signals: [
      { key: 'eyeBlinkLeft', label: 'Left eye closed' },
      { key: 'eyeBlinkRight', label: 'Right eye closed' },
    ],
    score: (b) => {
      const left = ramp(get(b, 'eyeBlinkLeft'), 0.28, 0.62)
      const right = ramp(get(b, 'eyeBlinkRight'), 0.28, 0.62)
      const both = Math.min(left, right)
      const softSmile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.05, 0.4)
      const raw = both * 0.8 + avg(left, right) * 0.2 + softSmile * 0.08
      return toPercent(forgiving(raw))
    },
  },

  wink: {
    id: 'wink',
    emoji: '😉',
    name: 'Wink',
    hint: 'Close just ONE eye!',
    mysteryHint: 'Clue: your eyes don’t match.',
    signals: [
      { key: 'eyeBlinkLeft', label: 'Left eye closed' },
      { key: 'eyeBlinkRight', label: 'Right eye closed' },
    ],
    score: (b) => {
      const left = get(b, 'eyeBlinkLeft')
      const right = get(b, 'eyeBlinkRight')
      const closed = ramp(Math.max(left, right), 0.3, 0.62)
      // The other eye must stay open, so closing both eyes doesn't count.
      const otherOpen = 1 - ramp(Math.min(left, right), 0.3, 0.6)
      const smile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.05, 0.45)
      return toPercent(forgiving(closed * otherOpen * 0.9 + closed * otherOpen * smile * 0.1))
    },
  },

  kiss: {
    id: 'kiss',
    emoji: '😘',
    name: 'Blow a Kiss',
    hint: 'Pucker up your lips!',
    mysteryHint: 'Clue: think about your lips. Mwah?',
    signals: [
      { key: 'mouthPucker', label: 'Lips puckered' },
      { key: 'jawOpen', label: 'Jaw open (keep it low)' },
    ],
    score: (b) => {
      const pucker = ramp(Math.max(get(b, 'mouthPucker'), get(b, 'mouthFunnel') * 0.7), 0.12, 0.65)
      const jawPenalty = ramp(get(b, 'jawOpen'), 0.25, 0.5)
      return toPercent(forgiving(pucker) * (1 - 0.5 * jawPenalty))
    },
  },

  angry: {
    id: 'angry',
    emoji: '😠',
    name: 'Angry',
    hint: 'Scrunch your eyebrows down. Grrr!',
    mysteryHint: 'Clue: pull your eyebrows DOWN.',
    signals: [
      { key: 'browDownLeft', label: 'Eyebrows down' },
      { key: 'noseSneerLeft', label: 'Nose scrunch' },
      { key: 'mouthPressLeft', label: 'Lips pressed' },
    ],
    score: (b) => {
      const brows = ramp(avg(get(b, 'browDownLeft'), get(b, 'browDownRight')), 0.05, 0.45)
      const sneer = ramp(avg(get(b, 'noseSneerLeft'), get(b, 'noseSneerRight')), 0.05, 0.4)
      const mouth = ramp(
        Math.max(avg(get(b, 'mouthPressLeft'), get(b, 'mouthPressRight')), avg(get(b, 'mouthFrownLeft'), get(b, 'mouthFrownRight'))),
        0.05,
        0.4,
      )
      const smile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.2, 0.6)
      const raw = brows * 0.7 + Math.max(sneer, mouth, brows * 0.6) * 0.3
      return toPercent(forgiving(raw) * (1 - 0.5 * smile))
    },
  },

  sad: {
    id: 'sad',
    emoji: '☹️',
    name: 'Sad Face',
    hint: 'Frown and look super sad!',
    mysteryHint: 'Clue: turn that smile upside down.',
    signals: [
      { key: 'mouthFrownLeft', label: 'Frown' },
      { key: 'browInnerUp', label: 'Worried eyebrows' },
    ],
    score: (b) => {
      const frown = ramp(avg(get(b, 'mouthFrownLeft'), get(b, 'mouthFrownRight')), 0.03, 0.3)
      const pout = ramp(get(b, 'mouthShrugLower'), 0.1, 0.5)
      const brows = ramp(get(b, 'browInnerUp'), 0.1, 0.5)
      const smile = ramp(avg(get(b, 'mouthSmileLeft'), get(b, 'mouthSmileRight')), 0.15, 0.5)
      const raw = frown * 0.55 + Math.max(pout, frown * 0.6) * 0.2 + Math.max(brows, frown * 0.5) * 0.25
      return toPercent(forgiving(raw) * (1 - 0.6 * smile))
    },
  },
}

/** Every emoji that can appear. Each game randomly picks ROUND_COUNT of them. */
export const EXPRESSION_POOL = ['happy', 'surprised', 'relieved', 'wink', 'kiss', 'angry', 'sad']

export const ROUND_COUNT = 3
export const ROUND_DURATION_MS = 5000
export const MAX_ROUND_POINTS = 100
export const MAX_TOTAL_POINTS = ROUND_COUNT * MAX_ROUND_POINTS

let lastPick = ''

function shuffle<T>(items: T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Picks `count` different random emojis, avoiding an exact repeat of the previous game's set. */
export function pickExpressions(count = ROUND_COUNT): ExpressionDefinition[] {
  let ids = shuffle(EXPRESSION_POOL).slice(0, count)
  for (let tries = 0; tries < 5 && [...ids].sort().join() === lastPick; tries++) {
    ids = shuffle(EXPRESSION_POOL).slice(0, count)
  }
  lastPick = [...ids].sort().join()
  return ids.map((id) => EXPRESSIONS[id])
}

export function blendshapesFromCategories(categories: { categoryName: string; score: number }[]): Blendshapes {
  const out: Blendshapes = {}
  for (const c of categories) out[c.categoryName] = c.score
  return out
}

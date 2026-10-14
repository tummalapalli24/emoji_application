import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { blendshapesFromCategories, type Blendshapes, type ExpressionDefinition } from '../lib/expressions'
import { RoundScorer } from '../lib/scoring'

export interface PlayerState {
  faceVisible: boolean
  live: number
  best: number
  /** Change in live score over roughly the last half second; drives warmer/colder hints. */
  trend: number
}

interface TrackerState {
  ready: boolean
  players: PlayerState[]
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  landmarker: FaceLandmarker
  expression: ExpressionDefinition
  /** Only frames analysed while `recording` is true can set the round's best score. */
  recording: boolean
  /** Number of players tracked at once. With 2, Player 1 is whoever appears on the left of the mirrored preview. */
  players: 1 | 2
}

const TREND_FRAMES = 15
const DOT_COLORS = {
  single: 'rgba(229, 239, 247, 0.6)',
  slots: ['rgba(240, 90, 110, 0.85)', 'rgba(130, 180, 240, 0.85)'],
}

const emptyPlayer = (): PlayerState => ({ faceVisible: false, live: 0, best: 0, trend: 0 })

/**
 * Runs MediaPipe Face Landmarker on every new webcam frame, entirely in the
 * browser. Frames are never stored or uploaded.
 */
export function useExpressionTracker({ videoRef, canvasRef, landmarker, expression, recording, players }: Options) {
  const [state, setState] = useState<TrackerState>(() => ({ ready: false, players: Array.from({ length: players }, emptyPlayer) }))
  const scorers = useRef<RoundScorer[]>(Array.from({ length: players }, () => new RoundScorer()))
  const history = useRef<number[][]>(Array.from({ length: players }, () => []))
  const expressionRef = useRef(expression)
  const recordingRef = useRef(recording)
  /** Latest blendshapes per player, read by the X-Ray and ?debug panels. */
  const blendshapesRef = useRef<(Blendshapes | null)[]>(Array.from({ length: players }, () => null))

  useEffect(() => {
    expressionRef.current = expression
  }, [expression])

  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

  const resetRound = useCallback(() => {
    scorers.current.forEach((s) => s.reset())
    history.current.forEach((h) => (h.length = 0))
    setState((s) => ({ ...s, players: s.players.map(() => emptyPlayer()) }))
  }, [])

  /** Frozen best sustained score for each player. */
  const getBestScores = useCallback(() => scorers.current.map((s) => s.bestScore), [])

  useEffect(() => {
    let raf = 0
    let lastVideoTime = -1
    let lastTimestamp = 0
    let cancelled = false

    const loop = () => {
      if (cancelled) return
      raf = requestAnimationFrame(loop)
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth === 0) return
      if (video.currentTime === lastVideoTime) return
      lastVideoTime = video.currentTime

      const timestamp = Math.max(performance.now(), lastTimestamp + 1)
      lastTimestamp = timestamp

      let result
      try {
        result = landmarker.detectForVideo(video, timestamp)
      } catch (err) {
        console.error('Face detection failed for a frame', err)
        return
      }

      const faces = (result.faceLandmarks ?? [])
        .map((landmarks, i) => ({
          landmarks,
          categories: result.faceBlendshapes?.[i]?.categories,
          cx: landmarks.reduce((a, p) => a + p.x, 0) / Math.max(1, landmarks.length),
        }))
        .filter((f) => f.landmarks.length && f.categories?.length)

      const slots = assignSlots(faces, players)
      const next: PlayerState[] = slots.map((face, i) => {
        const scorer = scorers.current[i]
        const trail = history.current[i]
        if (face) {
          const blendshapes = blendshapesFromCategories(face.categories!)
          blendshapesRef.current[i] = blendshapes
          scorer.push(expressionRef.current.score(blendshapes), recordingRef.current)
        } else {
          blendshapesRef.current[i] = null
          scorer.push(null, false)
        }
        const live = face ? scorer.liveScore : 0
        trail.push(live)
        if (trail.length > TREND_FRAMES) trail.shift()
        return { faceVisible: Boolean(face), live, best: scorer.bestScore, trend: live - trail[0] }
      })

      drawLandmarks(
        canvasRef.current,
        video,
        slots.map((face, i) => (face ? { landmarks: face.landmarks, color: players === 1 ? DOT_COLORS.single : DOT_COLORS.slots[i] } : null)),
      )

      setState((s) => (s.ready && samePlayers(s.players, next) ? s : { ready: true, players: next }))
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [landmarker, videoRef, canvasRef, players])

  return { ...state, resetRound, getBestScores, blendshapesRef }
}

/**
 * Assigns detected faces to player slots by position. The preview is mirrored,
 * so a larger raw x appears further left on screen and belongs to Player 1.
 */
function assignSlots<T extends { cx: number }>(faces: T[], players: 1 | 2): (T | null)[] {
  if (players === 1) return [faces[0] ?? null]
  const sorted = [...faces].sort((a, b) => b.cx - a.cx)
  if (sorted.length >= 2) return [sorted[0], sorted[1]]
  if (sorted.length === 1) return sorted[0].cx >= 0.5 ? [sorted[0], null] : [null, sorted[0]]
  return [null, null]
}

const samePlayers = (a: PlayerState[], b: PlayerState[]) =>
  a.length === b.length &&
  a.every((p, i) => p.faceVisible === b[i].faceVisible && p.live === b[i].live && p.best === b[i].best && p.trend === b[i].trend)

/** Draws a subtle dot mesh so students can "see" what the AI tracks. */
function drawLandmarks(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  faces: ({ landmarks: NormalizedLandmark[]; color: string } | null)[],
) {
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cw = canvas.clientWidth
  const ch = canvas.clientHeight
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr)
    canvas.height = Math.round(ch * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  // Match the video's object-fit: cover crop.
  const vw = video.videoWidth
  const vh = video.videoHeight
  const scale = Math.max(cw / vw, ch / vh)
  const ox = (cw - vw * scale) / 2
  const oy = (ch - vh * scale) / 2

  for (const face of faces) {
    if (!face) continue
    ctx.fillStyle = face.color
    for (let i = 0; i < face.landmarks.length; i += 2) {
      const p = face.landmarks[i]
      ctx.beginPath()
      ctx.arc(p.x * vw * scale + ox, p.y * vh * scale + oy, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

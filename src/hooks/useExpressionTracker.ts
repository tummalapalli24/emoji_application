import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { blendshapesFromCategories, type Blendshapes, type ExpressionDefinition } from '../lib/expressions'
import { RoundScorer } from '../lib/scoring'

export interface TrackerState {
  faceVisible: boolean
  live: number
  best: number
  ready: boolean
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  landmarker: FaceLandmarker
  expression: ExpressionDefinition
  /** Only frames analysed while `recording` is true can set the round's best score. */
  recording: boolean
}

/**
 * Runs MediaPipe Face Landmarker on every new webcam frame, entirely in the
 * browser. Frames are never stored or uploaded.
 */
export function useExpressionTracker({ videoRef, canvasRef, landmarker, expression, recording }: Options) {
  const [state, setState] = useState<TrackerState>({ faceVisible: false, live: 0, best: 0, ready: false })
  const scorer = useRef(new RoundScorer())
  const expressionRef = useRef(expression)
  const recordingRef = useRef(recording)
  /** Latest blendshapes, read by the optional ?debug calibration panel. */
  const blendshapesRef = useRef<Blendshapes | null>(null)

  useEffect(() => {
    expressionRef.current = expression
  }, [expression])

  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

  const resetRound = useCallback(() => {
    scorer.current.reset()
    setState((s) => ({ ...s, live: 0, best: 0 }))
  }, [])

  /** Returns the frozen best stable score for the round. */
  const getBestScore = useCallback(() => scorer.current.bestScore, [])

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

      const categories = result.faceBlendshapes?.[0]?.categories
      const landmarks = result.faceLandmarks?.[0]
      const faceVisible = Boolean(categories?.length && landmarks?.length)

      if (faceVisible) {
        const blendshapes = blendshapesFromCategories(categories!)
        blendshapesRef.current = blendshapes
        scorer.current.push(expressionRef.current.score(blendshapes), recordingRef.current)
      } else {
        blendshapesRef.current = null
        scorer.current.push(null, false)
      }

      drawLandmarks(canvasRef.current, video, faceVisible ? landmarks! : null)

      const live = faceVisible ? scorer.current.liveScore : 0
      const best = scorer.current.bestScore
      setState((s) =>
        s.faceVisible === faceVisible && s.live === live && s.best === best && s.ready
          ? s
          : { faceVisible, live, best, ready: true },
      )
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [landmarker, videoRef, canvasRef])

  return { ...state, resetRound, getBestScore, blendshapesRef }
}

/** Draws a subtle dot mesh so students can "see" what the AI tracks. */
function drawLandmarks(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, landmarks: NormalizedLandmark[] | null) {
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
  if (!landmarks) return

  // Match the video's object-fit: cover crop.
  const vw = video.videoWidth
  const vh = video.videoHeight
  const scale = Math.max(cw / vw, ch / vh)
  const ox = (cw - vw * scale) / 2
  const oy = (ch - vh * scale) / 2

  ctx.fillStyle = 'rgba(229, 239, 247, 0.6)'
  for (let i = 0; i < landmarks.length; i += 2) {
    const p = landmarks[i]
    ctx.beginPath()
    ctx.arc(p.x * vw * scale + ox, p.y * vh * scale + oy, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

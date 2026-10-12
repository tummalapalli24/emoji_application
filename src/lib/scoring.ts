/**
 * Tracks the live (smoothed) score and the best *stable* score for a round.
 *
 * A score only counts toward the round's best once it has been sustained:
 * we average the last `windowSize` consecutive face-detected frames, so a
 * single-frame spike can't win the round. Missing faces break the streak.
 */
export class RoundScorer {
  private readonly windowSize: number
  private readonly smoothing: number
  private window: number[] = []
  private live = 0
  private best = 0

  constructor(windowSize = 8, smoothing = 0.3) {
    this.windowSize = windowSize
    this.smoothing = smoothing
  }

  reset() {
    this.window = []
    this.live = 0
    this.best = 0
  }

  /** Feed one frame. Pass `null` when no face was detected. */
  push(raw: number | null, recordBest: boolean) {
    if (raw === null) {
      this.window = []
      this.live += (0 - this.live) * (this.smoothing * 0.5)
      return
    }
    this.live += (raw - this.live) * this.smoothing
    this.window.push(raw)
    if (this.window.length > this.windowSize) this.window.shift()
    if (recordBest && this.window.length === this.windowSize) {
      const mean = this.window.reduce((a, x) => a + x, 0) / this.windowSize
      this.best = Math.max(this.best, mean)
    }
  }

  get liveScore() {
    return Math.round(this.live)
  }

  get bestScore() {
    return Math.round(this.best)
  }
}

export function performanceMessage(total: number, max: number) {
  const pct = total / max
  if (pct >= 0.9) return { title: 'EMOJI LEGEND!', subtitle: 'Your face is basically a keyboard. Incredible!' }
  if (pct >= 0.75) return { title: 'EXPRESSION EXPERT!', subtitle: 'The AI could read you like a book.' }
  if (pct >= 0.55) return { title: 'FACE ACE!', subtitle: 'Great matching! Can you beat it next time?' }
  if (pct >= 0.3) return { title: 'NICE MOVES!', subtitle: 'Go bigger with your expressions to score more!' }
  return { title: 'WARMING UP!', subtitle: 'Exaggerate each face. The AI loves drama!' }
}

export function roundReaction(points: number) {
  if (points >= 90) return 'PERFECT!'
  if (points >= 70) return 'AWESOME!'
  if (points >= 45) return 'NICE!'
  if (points > 0) return 'GOOD TRY!'
  return 'NO FACE FOUND'
}

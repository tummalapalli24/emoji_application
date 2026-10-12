/** Tiny Web Audio synth for arcade-style feedback. Muted by default. */

let ctx: AudioContext | null = null
let muted = true

export function setMuted(value: boolean) {
  muted = value
  if (!value) getCtx()?.resume()
}

function getCtx(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'square', gain = 0.06) {
  const c = getCtx()
  if (!c || muted) return
  const t = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

export const sounds = {
  tick: () => tone(660, 0, 0.12, 'square', 0.05),
  go: () => {
    tone(880, 0, 0.12)
    tone(1320, 0.1, 0.25)
  },
  roundEnd: () => tone(440, 0, 0.18, 'triangle', 0.08),
  points: (points: number) => {
    const notes = points >= 70 ? [523, 659, 784, 1047] : points >= 40 ? [523, 659, 784] : [392, 523]
    notes.forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.08))
  },
  fanfare: () => {
    ;[523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.28, 'triangle', 0.08))
  },
  click: () => tone(1000, 0, 0.05, 'sine', 0.05),
}

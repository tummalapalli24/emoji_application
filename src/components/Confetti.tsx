import { useEffect, useRef } from 'react'

const COLORS = ['#AB0520', '#AB0520', '#FFFFFF', '#FFFFFF', '#1E5288', '#E5EFF7', '#0C234B']

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  color: string
  shape: 'rect' | 'circle'
}

/** Lightweight canvas confetti: two bursts, then a gentle rain that fades out. */
export function Confetti({ durationMs = 5000 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const w = () => window.innerWidth
    const h = () => window.innerHeight
    const pieces: Piece[] = []
    const make = (x: number, y: number, angle: number, speed: number): Piece => ({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 7 + Math.random() * 9,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.3 ? 'rect' : 'circle',
    })
    for (let i = 0; i < 90; i++) {
      pieces.push(make(0, h() * 0.75, -Math.PI / 3 + (Math.random() - 0.5) * 0.6, 12 + Math.random() * 10))
      pieces.push(make(w(), h() * 0.75, (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.6, 12 + Math.random() * 10))
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed < durationMs * 0.7 && pieces.length < 400) {
        for (let i = 0; i < 2; i++) pieces.push(make(Math.random() * w(), -20, Math.PI / 2, 2 + Math.random() * 2))
      }
      ctx.clearRect(0, 0, w(), h())
      const fade = Math.max(0, Math.min(1, (durationMs + 1500 - elapsed) / 1500))
      ctx.globalAlpha = fade
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]
        p.vy += 0.25
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx + Math.sin((now + i * 50) / 400) * 0.6
        p.y += p.vy
        p.rotation += p.spin
        if (p.y > h() + 40) {
          pieces.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (fade > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [durationMs])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-20 h-full w-full" />
}

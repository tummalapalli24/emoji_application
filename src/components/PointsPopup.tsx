import { motion } from 'motion/react'

/** Deterministic 0 to 1 jitter so the burst looks random but renders stably. */
const jitter = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const SPARK_COLORS = ['#AB0520', '#FFFFFF', '#E5EFF7', '#AB0520', '#1E5288']

interface Props {
  /** Small line above the banner, e.g. "PERFECT!" */
  headline: string
  /** Big banner text, e.g. "+85 POINTS!" */
  banner: string
  /** Optional emoji shown above the headline (Mystery Face reveal). */
  emoji?: string
  tone?: 'red' | 'blue'
  /** Bigger spark burst for great results. */
  celebrate?: boolean
}

/** Energetic end-of-round banner with a red/white spark burst. */
export function PointsPopup({ headline, banner, emoji, tone = 'red', celebrate = true }: Props) {
  const count = celebrate ? 22 : 10
  const sparks = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + jitter(i, 1) * 0.3
    const distance = 170 + jitter(i, 2) * 150
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 8 + jitter(i, 3) * 12,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      star: i % 3 === 0,
    }
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center">
      <div className="relative grid place-items-center">
        <motion.span
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 3.2, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`absolute h-40 w-40 rounded-full border-8 ${tone === 'red' ? 'border-az-red' : 'border-azurite'}`}
        />
        {sparks.map((s) => (
          <motion.span
            key={s.id}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: s.x, y: s.y, scale: 1, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.95, ease: [0.1, 0.8, 0.3, 1] }}
            className="absolute"
            style={{ width: s.size, height: s.size }}
          >
            {s.star ? (
              <svg viewBox="0 0 24 24" className="h-full w-full" fill={s.color}>
                <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
              </svg>
            ) : (
              <span className="block h-full w-full rounded-full" style={{ background: s.color }} />
            )}
          </motion.span>
        ))}
        <motion.div
          initial={{ y: 40, scale: 0.4, opacity: 0 }}
          animate={{ y: [40, 0, 0, -70], scale: [0.4, 1.15, 1, 0.95], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, times: [0, 0.18, 0.75, 1], ease: 'easeOut' }}
          className="relative text-center"
        >
          {emoji && <div className="emoji mb-2 text-8xl drop-shadow-[0_14px_30px_rgba(0,0,0,0.5)] md:text-9xl">{emoji}</div>}
          <p className="font-display title-shadow text-3xl text-white md:text-5xl">{headline}</p>
          <p
            className={`font-display mt-2 inline-block rounded-3xl border-4 border-white px-6 py-2 text-5xl text-white md:px-10 md:text-8xl ${
              tone === 'red' ? 'bg-az-red shadow-[0_0_60px_rgba(171,5,32,0.9)]' : 'bg-azurite shadow-[0_0_60px_rgba(30,82,136,0.9)]'
            }`}
          >
            {banner}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

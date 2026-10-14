import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

interface Props {
  score: number
  best: number
  /** True while the round is counting points. */
  active: boolean
  faceVisible: boolean
  /** Speed Run: score that stops the clock, drawn as a marker on the ring. */
  target?: number
}

const WHITE = [255, 255, 255]
const AZ_RED = [171, 5, 32]

/** Blends white (0) → Arizona Red (100). */
function scoreColor(score: number) {
  const t = Math.min(1, Math.max(0, score / 100))
  const [r, g, b] = WHITE.map((w, i) => Math.round(w + (AZ_RED[i] - w) * t))
  return `rgb(${r}, ${g}, ${b})`
}

function encouragement(score: number) {
  if (score >= 75) return 'ON FIRE!'
  if (score >= 50) return 'SO CLOSE!'
  if (score >= 25) return 'KEEP GOING!'
  return 'GO BIGGER!'
}

export function LiveScoreMeter({ score, best, active, faceVisible, target }: Props) {
  const shown = useAnimatedNumber(score, 250)
  const stroke = scoreColor(shown)
  const radius = 84
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - shown / 100)

  return (
    <section className="surface flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-[2rem] p-4 lg:gap-4 lg:p-6">
      <p className="font-display text-base tracking-wide text-cloud/80 md:text-lg xl:text-2xl">{active ? 'MATCH' : 'WARM UP'}</p>
      <div className="relative aspect-square w-full max-w-[9.5rem] md:max-w-[11rem] xl:max-w-[15rem]">
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full -rotate-90"
          style={{ filter: `drop-shadow(0 0 ${8 + shown * 0.18}px rgba(171,5,32,${0.25 + shown * 0.006}))` }}
        >
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(229,239,247,0.12)" strokeWidth="18" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          {target !== undefined && (
            <line
              x1={100 + 70 * Math.cos((2 * Math.PI * target) / 100)}
              y1={100 + 70 * Math.sin((2 * Math.PI * target) / 100)}
              x2={100 + 98 * Math.cos((2 * Math.PI * target) / 100)}
              y2={100 + 98 * Math.sin((2 * Math.PI * target) / 100)}
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl text-white tabular-nums md:text-6xl xl:text-7xl">{shown}</span>
          <span className="font-display -mt-1 text-xs text-cloud/60 md:text-sm">/ 100</span>
        </div>
      </div>
      <p className="font-display h-7 text-center text-sm text-white md:text-base xl:text-xl">{faceVisible ? encouragement(shown) : 'NO FACE'}</p>
      <div
        className={`rounded-full border border-az-red/70 bg-az-red/25 px-4 py-1.5 text-sm font-extrabold tracking-wide text-white transition-opacity xl:text-base ${active ? 'opacity-100' : 'opacity-0'}`}
      >
        {target !== undefined ? (
          <>HIT {target} TO STOP THE CLOCK</>
        ) : (
          <>
            BEST: <span className="tabular-nums">{best}</span>
          </>
        )}
      </div>
    </section>
  )
}

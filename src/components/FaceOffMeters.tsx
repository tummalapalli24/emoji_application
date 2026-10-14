import type { PlayerState } from '../hooks/useExpressionTracker'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

interface Props {
  players: PlayerState[]
  /** Frozen round scores to show during the reveal. */
  frozen: number[] | null
  active: boolean
}

function PlayerBar({ label, tone, player, frozen, active }: { label: string; tone: 'red' | 'blue'; player: PlayerState; frozen: number | null; active: boolean }) {
  const shown = useAnimatedNumber(frozen ?? player.live, 250)
  const best = frozen ?? player.best
  const fill = tone === 'red' ? 'bg-az-red' : 'bg-azurite'
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className={`font-display rounded-lg px-2.5 py-0.5 text-sm text-white md:text-base ${fill}`}>{label}</span>
        <span className="font-display text-4xl text-white tabular-nums md:text-5xl">{shown}</span>
      </div>
      <div className="relative mt-2 h-5 overflow-hidden rounded-full bg-az-night/70 ring-1 ring-cloud/10 md:h-6">
        <div className={`absolute inset-y-0 left-0 rounded-full ${fill} shadow-[0_0_18px_rgba(255,255,255,0.25)]`} style={{ width: `${shown}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between text-xs font-extrabold tracking-wide text-cloud/70 md:text-sm">
        <span>{frozen !== null || player.faceVisible ? '' : 'SHOW YOUR FACE!'}</span>
        <span className={active ? '' : 'opacity-0'}>BEST: {best}</span>
      </p>
    </div>
  )
}

/** Live match bars for both Face-Off players. */
export function FaceOffMeters({ players, frozen, active }: Props) {
  return (
    <section className="surface flex h-full min-h-0 flex-col justify-center gap-5 rounded-[2rem] p-4 lg:gap-8 lg:p-6">
      <p className="font-display text-center text-base tracking-wide text-cloud/80 md:text-lg xl:text-2xl">{active ? 'MATCH' : 'WARM UP'}</p>
      <PlayerBar label="PLAYER 1" tone="red" player={players[0]} frozen={frozen?.[0] ?? null} active={active} />
      <PlayerBar label="PLAYER 2" tone="blue" player={players[1]} frozen={frozen?.[1] ?? null} active={active} />
    </section>
  )
}

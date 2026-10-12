/** Slowly drifting Arizona Blue / Red light orbs behind each screen. */
export function BackgroundOrbs() {
  return (
    <>
      <div className="orb animate-drift -top-[15vh] -left-[10vw] h-[55vh] w-[55vh] bg-az-red/30" />
      <div className="orb animate-drift top-[10vh] -right-[12vw] h-[60vh] w-[60vh] bg-azurite/60 [animation-delay:-6s]" />
      <div className="orb animate-drift -bottom-[25vh] left-[25vw] h-[50vh] w-[70vh] bg-az-red/15 [animation-delay:-11s]" />
    </>
  )
}

/** Small, text-only program attribution. */
export function Attribution({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs font-extrabold tracking-[0.16em] text-cloud/60 md:text-sm ${className}`}>
      UNIVERSITY OF ARIZONA <span className="text-az-red-tint">|</span> COMPUTER SCIENCE AMBASSADORS
    </p>
  )
}

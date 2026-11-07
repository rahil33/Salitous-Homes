const words = ['Bespoke interiors', 'Turnkey projects', '3D visualisation', 'Furniture selection', 'Home staging', 'Project execution', 'Karnataka & Tamil Nadu']

// Slow, endlessly looping ribbon used as a divider between sections.
export function Marquee() {
  const row = (hidden: boolean) => (
    <div className="marquee-row" aria-hidden={hidden}>
      {words.map((word) => <span key={word}>{word}<i /></span>)}
    </div>
  )
  return (
    <div className="marquee" role="presentation">
      <div className="marquee-track">{row(false)}{row(true)}</div>
    </div>
  )
}

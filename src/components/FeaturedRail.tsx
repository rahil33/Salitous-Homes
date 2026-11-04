import { Link } from 'react-router-dom'

const rail = [
  { src: '/assets/portfolio/concepts/pooja-wall-2.webp', label: 'Pooja wall' },
  { src: '/assets/portfolio/concepts/living-styling-1.webp', label: 'Living room' },
  { src: '/assets/portfolio/concepts/tv-units-1.webp', label: 'TV unit' },
  { src: '/assets/portfolio/concepts/foyer-area-1.webp', label: 'Foyer' },
  { src: '/assets/portfolio/concepts/headboards-3.webp', label: 'Bedroom' },
  { src: '/assets/portfolio/concepts/bar-unit-1.webp', label: 'Bar unit' },
  { src: '/assets/portfolio/concepts/focal-wall-1.webp', label: 'Focal wall' },
  { src: '/assets/portfolio/concepts/crockery-bar-6.webp', label: 'Kitchen arch' },
  { src: '/assets/portfolio/completed/living-tv-1.webp', label: 'Delivered TV unit' },
  { src: '/assets/portfolio/concepts/master-panelling-3.webp', label: 'Master suite' },
  { src: '/assets/portfolio/concepts/feature-walls-1.webp', label: 'Feature wall' },
  { src: '/assets/portfolio/completed/kitchens-2.webp', label: 'Delivered kitchen' },
]

// Slowly drifting strip of favourite images at the top of the Projects page.
export function FeaturedRail() {
  const row = (hidden: boolean) => (
    <div className="rail-row" aria-hidden={hidden}>
      {rail.map((item) => (
        <Link key={item.src} to="/projects#portfolio" className="rail-item group" tabIndex={hidden ? -1 : 0}>
          <img src={item.src} alt={hidden ? '' : item.label} loading="lazy" decoding="async" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  )
  return (
    <div className="rail" role="region" aria-label="Featured work">
      <div className="rail-track">{row(false)}{row(true)}</div>
    </div>
  )
}

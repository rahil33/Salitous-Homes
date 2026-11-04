import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

type Tile = { area: string; label: string; src: string; position?: string }

// Hand-picked favourites from the portfolio. The class in `area` places each tile in the grid (see index.css).
const tiles: Tile[] = [
  { area: 'a', label: 'Living rooms', src: '/assets/portfolio/concepts/living-styling-1.webp', position: '50% 55%' },
  { area: 'b', label: 'Pooja walls', src: '/assets/portfolio/concepts/pooja-wall-1.webp', position: '50% 40%' },
  { area: 'c', label: 'Bedrooms', src: '/assets/portfolio/concepts/headboards-3.webp', position: '50% 60%' },
  { area: 'd', label: 'Kitchens & bars', src: '/assets/portfolio/concepts/crockery-bar-6.webp', position: '50% 50%' },
  { area: 'e', label: 'Foyers', src: '/assets/portfolio/concepts/foyer-area-1.webp', position: '50% 45%' },
  { area: 'f', label: 'Focal walls', src: '/assets/portfolio/concepts/focal-wall-1.webp', position: '50% 45%' },
  { area: 'g', label: 'Master suites', src: '/assets/portfolio/concepts/master-panelling-3.webp', position: '50% 55%' },
  { area: 'h', label: 'Delivered kitchens', src: '/assets/portfolio/completed/kitchens-2.webp', position: '50% 30%' },
  { area: 'i', label: 'Delivered TV units', src: '/assets/portfolio/completed/living-tv-1.webp', position: '50% 50%' },
]

export function SignatureSpaces() {
  return (
    <section className="signature mx-auto max-w-7xl px-6 pb-24 pt-8 md:px-10 md:pb-32 lg:px-12" aria-labelledby="signature-title">
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <ScrollReveal>
          <p className="section-kicker">Signature spaces</p>
          <h2 id="signature-title" className="section-heading mt-5 max-w-2xl">A closer look at the <span className="serif font-medium italic">details.</span></h2>
        </ScrollReveal>
        <ScrollReveal direction="right" delay={100}>
          <p className="max-w-sm text-sm leading-relaxed text-taupe">Arched pooja walls, fluted TV units, warm cove lighting. A few favourites from our portfolio of concepts and delivered homes.</p>
        </ScrollReveal>
      </div>

      <div className="signature-grid">
        {tiles.map((tile, index) => (
          <ScrollReveal key={tile.src} delay={(index % 3) * 90} className={`signature-tile signature-${tile.area}`}>
            <Link to="/projects#portfolio" className="signature-link group" aria-label={`${tile.label}: view the portfolio`}>
              <img src={tile.src} alt={tile.label} loading="lazy" decoding="async" style={{ objectPosition: tile.position }} />
              <span className="signature-label">
                <small>{String(index + 1).padStart(2, '0')}</small>
                {tile.label}
                <ArrowUpRight size={16} />
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-12">
        <Link to="/projects#portfolio" className="text-link">See the full portfolio <ArrowRight size={15} /></Link>
      </ScrollReveal>
    </section>
  )
}

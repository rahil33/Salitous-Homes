import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { portfolioBy } from '../data/portfolio'
import { ScrollReveal } from './ScrollReveal'

const pick = (cat: 'completed' | 'concepts' | 'drawings', id: string) => portfolioBy(cat).find((s) => s.id === id)!.images[0]
const cards = [
  { title: 'Completed projects', text: 'Finished kitchens, TV units, wardrobes and pooja spaces.', img: pick('completed', 'kitchens') },
  { title: 'Design concepts', text: 'Living rooms, foyers, pooja walls and bedrooms.', img: pick('concepts', 'living-room') },
  { title: '2D drawings & floor plans', text: 'Dimensioned plans and elevations for site execution.', img: pick('drawings', 'key-plans') },
]

export function PortfolioPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-12">
      <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <ScrollReveal><p className="section-kicker">The portfolio</p><h2 className="section-heading mt-5 max-w-xl">From drawing board to finished home.</h2></ScrollReveal>
        <ScrollReveal direction="right" delay={100}><p className="max-w-sm text-sm leading-relaxed text-taupe">Designed for luxury. Built for comfort. See concepts, working drawings and the finished result.</p></ScrollReveal>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <ScrollReveal key={c.title} delay={i * 100}>
            <Link to="/projects#portfolio" className="portfolio-card group block overflow-hidden rounded-2xl bg-ivory/60 shadow-[0_4px_20px_rgba(41,51,44,0.06)]">
              <div className="aspect-[4/3] overflow-hidden"><img src={c.img.src} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]" /></div>
              <div className="p-6"><h3 className="font-display text-xl font-bold text-walnut">{c.title}</h3><p className="mt-2 text-sm text-taupe">{c.text}</p></div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
      <ScrollReveal className="mt-12"><Link to="/projects#portfolio" className="text-link">Explore the full portfolio <ArrowRight size={15} /></Link></ScrollReveal>
    </section>
  )
}

import { useState } from 'react'
import { portfolio, portfolioBy, specs, type PortfolioSection } from '../data/portfolio'
import { Lightbox } from './Lightbox'
import { ScrollReveal } from './ScrollReveal'

type Tab = 'completed' | 'concepts' | 'drawings' | 'materials'
const tabs: { value: Tab; label: string; blurb: string }[] = [
  { value: 'completed', label: 'Completed projects', blurb: 'Finished interiors delivered by the Salitous Homes team: kitchens, TV units, wardrobes, pooja and dining spaces.' },
  { value: 'concepts', label: 'Design concepts', blurb: 'Mood boards, living rooms, foyers, pooja walls, crockery units, wardrobes and vanities, crafted to balance luxury, comfort and function.' },
  { value: 'drawings', label: '2D drawings & floor plans', blurb: 'Key plans and dimensioned 2D elevations that guide production and site execution.' },
  { value: 'materials', label: 'Materials & specs', blurb: 'Premium laminates, natural stone finishes and warm wood tones, curated for lasting quality and a luxurious feel.' },
]

function Section({ s, onOpen }: { s: PortfolioSection; onOpen: (s: PortfolioSection, i: number) => void }) {
  const drawing = s.cat === 'drawings'
  return (
    <ScrollReveal className="mb-16">
      <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <h3 className="font-display text-2xl font-bold text-walnut md:text-3xl">{s.title}</h3>
        {s.sub && <p className="text-xs uppercase tracking-[.16em] text-taupe">{s.sub}</p>}
      </div>
      <div className={drawing ? 'grid gap-4' : 'columns-1 gap-4 sm:columns-2 lg:columns-3'}>
        {s.images.map((img, i) => (
          <button key={img.src} type="button" onClick={() => onOpen(s, i)} aria-label={`Open ${s.title} image ${i + 1}`}
            className={`group mb-4 block w-full overflow-hidden rounded-2xl bg-ivory/60 text-left shadow-[0_4px_20px_rgba(41,51,44,0.06)] ${drawing ? '' : 'break-inside-avoid'}`}>
            <img src={img.src} alt={`${s.title} ${i + 1}`} width={img.w} height={img.h} loading="lazy" decoding="async" className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    </ScrollReveal>
  )
}

export function PortfolioGallery({ initial = 'completed' }: { initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial)
  const [box, setBox] = useState<{ s: PortfolioSection; i: number } | null>(null)
  const current = tabs.find((t) => t.value === tab)!
  const list = portfolioBy(tab)
  return (
    <div id="portfolio">
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Portfolio sections">
        {tabs.map((t) => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} className={`filter-pill ${tab === t.value ? 'is-active' : ''}`}>
            {t.label}<span>{portfolio.filter((s) => s.cat === t.value).reduce((n, s) => n + s.images.length, 0)}</span>
          </button>
        ))}
      </div>
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-taupe">{current.blurb}</p>
      {tab === 'materials' && (
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {specs.map((sp) => (
            <div key={sp.title} className="glass-strong rounded-2xl p-7">
              <h3 className="font-display text-xl font-bold text-walnut">{sp.title}</h3>
              <dl className="mt-4 space-y-3 text-sm text-taupe">{sp.items.map(([k, v]) => <div key={k}><dt className="inline font-semibold text-walnut">{k}: </dt><dd className="inline">{v}</dd></div>)}</dl>
            </div>
          ))}
        </div>
      )}
      {list.map((s) => <Section key={s.id} s={s} onOpen={(sec, i) => setBox({ s: sec, i })} />)}
      {box && <Lightbox images={box.s.images} index={box.i} title={box.s.title} onClose={() => setBox(null)} onIndex={(i) => setBox({ s: box.s, i })} />}
    </div>
  )
}

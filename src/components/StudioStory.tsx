import { ScrollReveal } from './ScrollReveal'

const blocks = [
  { t: 'Who we are', p: 'At Salitous Homes, we create luxurious, functional and thoughtfully designed interiors that reflect your lifestyle and vision. Specializing in residential and commercial spaces, we offer end-to-end interior design and execution, from concept development and space planning to material selection and turnkey project delivery.' },
  { t: 'Our expertise', p: 'Residential and commercial interiors, modular kitchens, custom furniture, lighting and turnkey solutions: complete interior excellence.' },
  { t: 'Our vision', p: 'To create luxurious, functional and timeless interiors that enrich everyday living while reflecting the unique personality and lifestyle of every homeowner.' },
  { t: 'Our mission', p: 'To deliver personalized interior solutions with exceptional craftsmanship, premium materials and seamless execution, ensuring every client experiences quality, trust and lasting value.' },
  { t: 'Why choose Salitous?', p: 'Innovative design, premium craftsmanship, transparent pricing, timely execution and end-to-end project management, for interiors that are elegant, functional and built to last.' },
]
const steps = [['01', 'Consultation', 'Understanding your needs and preferences.'], ['02', 'Planning', 'Creating design concepts and layouts.'], ['03', 'Execution', 'Implementing the design with careful attention.'], ['04', 'Final touch', 'Refining details to complete the space.']]
const services = [['Residential design', 'Design solutions for comfortable and modern living spaces.'], ['Office design', 'Functional layouts designed to support productivity and workflow.'], ['Space planning', 'Organizing layouts to maximize space efficiency.'], ['Styling & décor', 'Enhancing spaces with balanced colors, furniture and decor.']]

export function StudioStory() {
  return (
    <div className="mt-24 space-y-24">
      <div className="grid gap-10 md:grid-cols-2">
        {blocks.map((b, i) => <ScrollReveal key={b.t} delay={i * 60}><h2 className="font-display text-2xl font-bold text-walnut">{b.t}</h2><p className="mt-3 text-sm leading-relaxed text-taupe">{b.p}</p></ScrollReveal>)}
      </div>
      <div>
        <ScrollReveal><p className="section-kicker">Our process</p></ScrollReveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d], i) => <ScrollReveal key={n} delay={i * 80}><div className="glass-strong h-full rounded-2xl p-6"><span className="text-copper text-xs font-bold tracking-[.2em]">{n}</span><h3 className="mt-3 font-display text-xl font-bold text-walnut">{t}</h3><p className="mt-2 text-sm text-taupe">{d}</p></div></ScrollReveal>)}
        </div>
      </div>
      <div>
        <ScrollReveal><p className="section-kicker">What we design</p></ScrollReveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {services.map(([t, d], i) => <ScrollReveal key={t} delay={i * 80}><h3 className="font-display text-xl font-bold text-walnut">{t}</h3><p className="mt-1 text-sm text-taupe">{d}</p></ScrollReveal>)}
        </div>
      </div>
    </div>
  )
}

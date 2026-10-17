import { ScrollReveal } from './ScrollReveal'

const principles = [
  {
    number: '01',
    title: 'A room should work beautifully.',
    description: 'Layouts begin with the way you move, rest, gather and make the space your own.',
  },
  {
    number: '02',
    title: 'Materials should feel like home.',
    description: 'Tactile finishes, thoughtful colour and considered details bring warmth without visual noise.',
  },
  {
    number: '03',
    title: 'Every detail belongs together.',
    description: 'From built-ins to the final soft layer, the choices connect into one considered interior.',
  },
]

export function DesignPrinciples() {
  return (
    <section className="design-principles mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-12" aria-labelledby="principles-title">
      <div className="mb-14 grid gap-8 md:grid-cols-[1fr_.7fr] md:items-end">
        <ScrollReveal>
          <p className="section-kicker">The Salitous point of view</p>
          <h2 id="principles-title" className="section-heading mt-5 max-w-2xl">A home should feel like <span className="serif font-medium italic">you.</span></h2>
        </ScrollReveal>
        <ScrollReveal direction="right">
          <p className="max-w-md text-sm leading-relaxed text-taupe">We look for the quiet balance between beautiful details and the way a home actually lives.</p>
        </ScrollReveal>
      </div>
      <div className="principle-grid">
        {principles.map((principle, index) => (
          <ScrollReveal key={principle.number} delay={index * 90}>
            <article className="principle-card">
              <span className="principle-number">{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}

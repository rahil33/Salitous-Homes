import { ScrollReveal } from './ScrollReveal'

export function About() {
  return (
    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
      <ScrollReveal>
        <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
          About Us
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-walnut font-bold leading-[1.15]">
          Crafting Spaces That
          <br />
          Elevate Living
        </h2>
        <p className="mt-6 text-taupe leading-relaxed">
          Salitous Homes is a premium interior design studio specializing in
          bespoke interiors, turnkey projects, home staging, and 3D visualization.
          We operate across Karnataka and Tamil Nadu, creating spaces that
          blend functionality with sophisticated aesthetics.
        </p>
        <p className="mt-4 text-taupe leading-relaxed">
          Salitous Homes: Bespoke interiors, turnkey projects, and expert home staging.
          We handle everything from 3D visualization to furniture selection and execution.
          Message us to discuss your project requirements or to schedule a site visit.
        </p>
      </ScrollReveal>

      <div className="space-y-5">
        <ScrollReveal delay={100}>
          <div className="glass rounded-2xl p-7 shadow-[0_4px_16px_rgba(41,51,44,0.04)] hover:shadow-[0_6px_24px_rgba(41,51,44,0.06)] transition-all duration-500">
          <div className="w-10 h-10 rounded-xl neu-raised-sm flex items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-copper/60" />
          </div>
          <h3 className="font-serif text-lg text-walnut font-semibold mb-2">Our Philosophy</h3>
          <p className="text-sm text-taupe leading-relaxed">
            We believe that great design enhances lifestyle. Every space tells a
            story, and we are committed to crafting narratives that resonate
            with those who inhabit them.
          </p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <div className="glass rounded-2xl p-7 shadow-[0_4px_16px_rgba(41,51,44,0.04)] hover:shadow-[0_6px_24px_rgba(41,51,44,0.06)] transition-all duration-500">
          <div className="w-10 h-10 rounded-xl neu-raised-sm flex items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-sm bg-copper/60" />
          </div>
          <h3 className="font-serif text-lg text-walnut font-semibold mb-2">Our Regions</h3>
          <p className="text-sm text-taupe leading-relaxed">
            We serve clients across Karnataka and Tamil Nadu, bringing premium
            interior design solutions to both bustling cities and serene locales.
          </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

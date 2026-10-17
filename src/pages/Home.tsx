import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { Services } from '../components/Services'
import { PackagesPreview } from '../components/PackagesPreview'
import { Footer } from '../components/Footer'
import { ProjectFilter } from '../components/ProjectFilter'
import { ScrollReveal } from '../components/ScrollReveal'
import { DesignPrinciples } from '../components/DesignPrinciples'
import { PortfolioPreview } from '../components/PortfolioPreview'
import { StudioFAQ } from '../components/StudioFAQ'

export function Home() {
  return (
    <div>
      <Navbar />
      <div id="site-intro"><Hero /></div>
      <main>
        <DesignPrinciples />

        <section id="work" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-12">
          <div className="mb-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <ScrollReveal>
              <div><p className="section-kicker">Selected work</p><h2 className="section-heading mt-5 max-w-xl">Spaces with their own <span className="serif font-medium italic">rhythm.</span></h2></div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={100}><p className="max-w-sm text-sm leading-relaxed text-taupe">A selection of homes shaped around the people who live in them, from the first plan to the finishing layer.</p></ScrollReveal>
          </div>
          <ProjectFilter limit={6} editorial />
          <ScrollReveal className="mt-12"><Link to="/projects" className="text-link">View all projects <ArrowRight size={15} /></Link></ScrollReveal>
        </section>

        <PortfolioPreview />

        <section className="soft-panel px-6 py-24 md:px-10 md:py-32 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
              <ScrollReveal><p className="section-kicker">What we do</p><h2 className="section-heading mt-5 max-w-2xl">From considered plans to <span className="serif font-medium italic">finished rooms.</span></h2></ScrollReveal>
              <ScrollReveal direction="right" delay={100}><p className="max-w-md text-sm leading-relaxed text-taupe">Design support for the big picture and the details that make it yours.</p></ScrollReveal>
            </div>
            <Services limit={4} />
            <ScrollReveal className="mt-10"><Link to="/services" className="text-link">Explore all services <ArrowRight size={15} /></Link></ScrollReveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-12">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <ScrollReveal><p className="section-kicker">Simple starting points</p><h2 className="section-heading mt-5">A package for the way you live.</h2></ScrollReveal>
            <ScrollReveal direction="right" delay={100}><p className="max-w-sm text-sm leading-relaxed text-taupe">Flexible design support for different home sizes and finish preferences.</p></ScrollReveal>
          </div>
          <PackagesPreview />
          <ScrollReveal className="mt-12"><Link to="/packages" className="text-link">Compare packages <ArrowRight size={15} /></Link></ScrollReveal>
        </section>

        <StudioFAQ />

        <section className="dark-panel px-6 py-24 md:px-10 md:py-32 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_auto] md:items-end">
            <ScrollReveal><p className="eyebrow eyebrow-light">A good place to begin</p><h2 className="display-title mt-5 max-w-3xl text-5xl font-extrabold md:text-7xl">Tell us about the space you have in mind.</h2><p className="mt-6 max-w-lg text-white/65">Share a few details. We’ll help you find a clear next step.</p></ScrollReveal>
            <ScrollReveal direction="right" delay={100}><Link to="/start-project" className="btn-primary">Start your project <ArrowRight size={15} /></Link></ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

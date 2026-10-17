import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PortfolioGallery } from '../components/PortfolioGallery'
import { ArrowRight } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProjectFilter } from '../components/ProjectFilter'
import { ScrollReveal } from '../components/ScrollReveal'

export function Projects() {
  const { hash } = useLocation()
  useEffect(() => { if (hash === '#portfolio') setTimeout(() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }), 150) }, [hash])
  return <div><Navbar /><main className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:px-10 md:pb-36 md:pt-40 lg:px-12"><div className="mb-14 grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-end"><ScrollReveal><p className="section-kicker">Portfolio / 2026</p><h1 className="section-heading mt-5 max-w-2xl">Rooms with their own <span className="whimsy">rhythm.</span></h1></ScrollReveal><ScrollReveal direction="right" delay={100}><p className="max-w-md text-sm leading-relaxed text-taupe">Browse completed interiors across Karnataka and Tamil Nadu. Tap a region to filter the collection.</p></ScrollReveal></div><ProjectFilter /><div className="mt-24"><ScrollReveal><p className="section-kicker">Full portfolio</p><h2 className="section-heading mt-5 mb-10 max-w-2xl">Designed for luxury. Built for comfort.</h2></ScrollReveal><PortfolioGallery /></div><ScrollReveal className="mt-20"><div className="dark-panel flex flex-col gap-8 p-8 md:flex-row md:items-end md:justify-between md:p-12"><div><p className="eyebrow eyebrow-light">Ready to transform your space?</p><h2 className="display-title mt-4 max-w-xl text-4xl font-extrabold md:text-6xl">Let’s design the next room.</h2></div><Link to="/start-project" className="btn-primary shrink-0">Start a project <ArrowRight size={15} /></Link></div></ScrollReveal></main><Footer /></div>
}

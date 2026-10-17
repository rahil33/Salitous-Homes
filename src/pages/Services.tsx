import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Services } from '../components/Services'
import { ScrollReveal } from '../components/ScrollReveal'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="max-w-2xl mb-16">
            <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
              What We Do
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-walnut font-bold leading-[1.1]">
              Our Services
            </h1>
            <p className="mt-5 text-taupe max-w-lg leading-relaxed">
              Comprehensive interior design and execution services tailored to your vision.
              From concept to completion, we craft spaces that inspire.
            </p>
          </ScrollReveal>

          <Services />

          <ScrollReveal delay={100} className="mt-20">
            <div className="glass-strong rounded-2xl p-10 md:p-14 text-center shadow-[0_4px_20px_rgba(41,51,44,0.05)]">
            <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-3 font-medium">
              Ready to Begin?
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-walnut font-bold mb-4">
              Let's Create Something Beautiful
            </h2>
            <p className="text-taupe mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Every project begins with a conversation. Tell us about your space
              and we'll bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block neu-button text-cream font-medium px-8 py-3.5 rounded-full text-[13px] tracking-wide"
              >
                START YOUR PROJECT
              </Link>
              <Link
                to="/packages"
                className="inline-block glass text-walnut font-medium px-8 py-3.5 rounded-full text-[13px] tracking-wide hover:bg-[rgba(246,245,239,0.7)] transition-all duration-300 border border-beige/40"
              >
                VIEW PACKAGE DETAILS
              </Link>
            </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

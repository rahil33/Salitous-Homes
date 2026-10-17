import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PackageCard } from '../components/PackageCard'
import type { PackageTier } from '../data/packages'
import { Link } from 'react-router-dom'
import { ScrollReveal } from '../components/ScrollReveal'

type BHK = '1' | '2' | '3'

export function PackagesPage() {
  const [activeBHK, setActiveBHK] = useState<BHK>('1')
  const tiers: PackageTier[] = ['essential', 'standard', 'premium']

  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-12">
            <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
              Package options
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-walnut font-bold">
              Design Packages
            </h1>
            <p className="mt-4 text-taupe max-w-xl mx-auto leading-relaxed">
              Tailored packages for 1 BHK, 2 BHK, and 3 BHK homes.
            </p>
          </ScrollReveal>

          <div className="flex justify-center mb-12">
            <div className="glass-strong rounded-full px-2 py-2 flex gap-1 shadow-[0_2px_12px_rgba(41,51,44,0.05)]">
              {(['1', '2', '3'] as BHK[]).map((b, index) => (
                <ScrollReveal key={b} delay={index * 90} className="inline-flex">
                  <button
                    onClick={() => setActiveBHK(b)}
                    className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                      activeBHK === b
                        ? 'neu-button text-cream shadow-[0_2px_8px_rgba(41,51,44,0.15)]'
                        : 'text-charcoal/60 hover:text-walnut hover:bg-cream/50'
                    }`}
                  >
                    {b} BHK
                  </button>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier, index) => (
              <ScrollReveal key={`${activeBHK}-${tier}`} delay={index * 100} className="h-full">
                <PackageCard bhk={activeBHK} tier={tier} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-16 text-center">
            <p className="text-taupe text-sm mb-6">
              Ready to get started? Discuss your project with us today.
            </p>
            <Link
              to="/contact"
              className="inline-block neu-button text-cream font-medium px-10 py-3.5 rounded-full text-[13px] tracking-wide"
            >
              START YOUR PROJECT
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

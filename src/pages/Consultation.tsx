import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ConsultationCTA } from '../components/Consultation'
import { ScrollReveal } from '../components/ScrollReveal'

export function ConsultationPage() {
  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <ConsultationCTA />
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

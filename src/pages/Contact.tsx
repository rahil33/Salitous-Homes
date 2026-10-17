import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Contact } from '../components/Contact'
import { ScrollReveal } from '../components/ScrollReveal'

export function ContactPage() {
  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <Contact />
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

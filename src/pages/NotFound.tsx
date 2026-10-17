import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ScrollReveal } from '../components/ScrollReveal'

export function NotFoundPage() {
  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20 min-h-screen flex items-center justify-center">
        <ScrollReveal className="text-center px-6">
          <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
            Error
          </p>
          <h1 className="font-display text-6xl md:text-7xl text-walnut font-bold mb-4">404</h1>
          <p className="text-taupe text-lg mb-8">The page you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-block bg-walnut/90 text-cream font-medium px-8 py-3 rounded-full text-[13px] tracking-wide hover:bg-walnut transition-all duration-300 hover:shadow-[0_4px_12px_rgba(41,51,44,0.15)]"
          >
            Go to Home
          </Link>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  )
}

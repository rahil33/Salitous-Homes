import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { WHATSAPP_LINK } from '../lib/contact'
import { readInquiry, submitInquiry } from '../lib/inquiry'
import { useState } from 'react'
import { Send } from 'lucide-react'
import { ScrollReveal } from '../components/ScrollReveal'

export function StartProjectPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'auto' | 'fallback'>('idle')
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    const result = await submitInquiry(readInquiry(form))
    setStatus(result)
    if (result === 'auto') form.reset()
  }

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-taupe/60 focus:outline-none transition-all duration-300 neu-inset"

  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-ivory/40">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-12">
            <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
              Get Started
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-walnut font-bold">
              Start Your Project
            </h1>
            <p className="mt-4 text-taupe max-w-xl mx-auto leading-relaxed">
              Share your project details and we'll get in touch to discuss your interior design needs.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100} className="max-w-lg mx-auto">
            <form
            onSubmit={handleSubmit}
            className="space-y-4 glass-strong rounded-2xl p-7 shadow-[0_4px_20px_rgba(41,51,44,0.05)]"
          >
            <div>
              <label htmlFor="sp-name" className="sr-only">Name</label>
              <input
                id="sp-name"
                name="name"
                type="text"
                placeholder="Your name"
                className={inputClass}
                style={{ border: '1px solid rgba(129,141,123,0.15)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
                required
              />
            </div>
            <div>
              <label htmlFor="sp-email" className="sr-only">Email</label>
              <input
                id="sp-email"
                name="email"
                type="email"
                placeholder="Your email"
                className={inputClass}
                style={{ border: '1px solid rgba(129,141,123,0.15)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
                required
              />
            </div>
            <div>
              <label htmlFor="sp-phone" className="sr-only">Phone</label>
              <input
                id="sp-phone"
                name="phone"
                type="tel"
                placeholder="Phone number"
                className={inputClass}
                style={{ border: '1px solid rgba(129,141,123,0.15)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
                required
              />
            </div>
            <div>
              <label htmlFor="sp-type" className="sr-only">Project Type</label>
              <select
                id="sp-type"
                name="project-type"
                className={inputClass}
                style={{ border: '1px solid rgba(129,141,123,0.15)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
              </select>
            </div>
            <div>
              <label htmlFor="sp-message" className="sr-only">Message</label>
              <textarea
                id="sp-message"
                name="message"
                rows={4}
                placeholder="Tell us about your project"
                className={`${inputClass} resize-none`}
                style={{ border: '1px solid rgba(129,141,123,0.15)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full neu-button text-cream font-medium py-3 rounded-full text-[13px] tracking-wide flex items-center justify-center gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {status === 'sending' ? 'Sending…' : 'Submit Project Request'}
            </button>
            <p className="text-[11px] text-taupe/60 text-center">
              {status === 'auto' ? '✓ Thank you! We have sent you a confirmation on WhatsApp.' : status === 'fallback' ? 'Opened WhatsApp/email with your details — please send to complete.' : "You'll get an instant confirmation on WhatsApp."}
            </p>
            </form>
          </ScrollReveal>

          <div className="mt-8 text-center">
            <p className="text-sm text-taupe">
              Or reach us directly on{' '}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:text-brown transition-colors duration-300"
              >
                WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

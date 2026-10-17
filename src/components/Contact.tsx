import { useState } from 'react'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { CONTACT_EMAIL, CONTACT_PHONES, WHATSAPP_LINK } from '../lib/contact'
import { readInquiry, submitInquiry } from '../lib/inquiry'

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'auto' | 'fallback'>('idle')
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    const result = await submitInquiry(readInquiry(form))
    setStatus(result)
    if (result === 'auto') form.reset()
  }

  return (
    <div className="grid md:grid-cols-2 gap-12 md:gap-16">
      <div>
        <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-4 font-medium">
          Contact
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-walnut font-bold leading-tight">
          Let's Start a
          <br />
          Conversation
        </h2>
        <p className="mt-4 text-taupe leading-relaxed">
          Ready to transform your space? Get in touch with us today.
        </p>

        <div className="mt-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl neu-raised-sm flex items-center justify-center flex-shrink-0">
              <Mail className="h-[18px] w-[18px] text-copper" />
            </div>
            <div>
              <p className="text-sm font-medium text-walnut">Email</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-taupe hover:text-copper transition-colors duration-300">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl neu-raised-sm flex items-center justify-center flex-shrink-0">
              <Phone className="h-[18px] w-[18px] text-copper" />
            </div>
            <div>
              <p className="text-sm font-medium text-walnut">Phone</p>
              {CONTACT_PHONES.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="block text-sm text-taupe hover:text-copper transition-colors duration-300">{p.display}</a>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl neu-raised-sm flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-[18px] w-[18px] text-copper" />
            </div>
            <div>
              <p className="text-sm font-medium text-walnut">WhatsApp</p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-taupe hover:text-copper transition-colors duration-300"
              >
                Chat with us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 glass-strong rounded-2xl p-7 shadow-[0_4px_16px_rgba(41,51,44,0.04)]">
        <div>
          <label htmlFor="contact-name" className="sr-only">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            placeholder="Your name"
            className="w-full rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-taupe/60 focus:outline-none transition-all duration-300 neu-inset focus:border-copper/40"
            style={{ border: '1px solid rgba(129,141,123,0.15)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="Your email"
            className="w-full rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-taupe/60 focus:outline-none transition-all duration-300 neu-inset"
            style={{ border: '1px solid rgba(129,141,123,0.15)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="sr-only">WhatsApp number</label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            placeholder="Your WhatsApp number"
            className="w-full rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-taupe/60 focus:outline-none transition-all duration-300 neu-inset"
            style={{ border: '1px solid rgba(129,141,123,0.15)' }}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="sr-only">Message</label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            placeholder="Your message"
            className="w-full rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-taupe/60 focus:outline-none resize-none transition-all duration-300 neu-inset"
            style={{ border: '1px solid rgba(129,141,123,0.15)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(105,122,100,0.4)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6), 0 0 0 3px rgba(105,122,100,0.08)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(129,141,123,0.15)'; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px rgba(129,141,123,0.18), inset -2px -2px 5px rgba(255,255,255,0.6)' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full neu-button text-cream font-medium py-3 rounded-full text-[13px] tracking-wide"
        >
          {status === 'sending' ? 'Sending…' : 'Send Message'}
        </button>
        <p className="text-[11px] text-taupe/60 text-center">
          {status === 'auto' ? '✓ Thank you! We have sent you a confirmation on WhatsApp.' : status === 'fallback' ? 'Opened WhatsApp/email with your details — please send to complete.' : "You'll get an instant confirmation on WhatsApp."}
        </p>
      </form>
    </div>
  )
}

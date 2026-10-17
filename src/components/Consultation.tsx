import { Mail, MessageCircle } from 'lucide-react'
import { CONTACT_EMAIL, WHATSAPP_LINK } from '../lib/contact'
import { Link } from 'react-router-dom'

export function ConsultationCTA() {
  return (
    <div className="glass-strong rounded-2xl p-8 md:p-12 text-center shadow-[0_4px_20px_rgba(41,51,44,0.05)] hover:shadow-[0_8px_30px_rgba(41,51,44,0.08)] transition-all duration-500">
      <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-3 font-medium">
        Consultation
      </p>
      <h2 className="font-display text-3xl md:text-4xl text-walnut font-bold mb-4">
        Book a Consultation
      </h2>
      <p className="text-taupe mb-8 max-w-xl mx-auto leading-relaxed text-sm">
        Let's discuss your interior design project. Share your vision and we'll
        guide you through the process from concept to completion.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center justify-center gap-2 neu-button text-cream font-medium px-8 py-3.5 rounded-full text-[13px]"
        >
          <Mail className="h-4 w-4" />
          Email Us
        </a>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 glass text-walnut font-medium px-8 py-3.5 rounded-full text-[13px] hover:bg-[rgba(246,245,239,0.7)] transition-all duration-300 border border-beige/40"
        >
          <MessageCircle className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      </div>

      <div className="mt-6">
        <Link
          to="/start-project"
          className="text-[13px] text-copper hover:text-brown transition-colors duration-300"
        >
          Or fill out our project inquiry form →
        </Link>
      </div>
    </div>
  )
}

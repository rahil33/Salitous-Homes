import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { subscribeScroll } from '../lib/scrollFrame'
import { WHATSAPP_LINK } from '../lib/contact'

// WhatsApp shortcut that appears once the visitor has scrolled past the hero.
export function FloatingContact() {
  const [scrolled, setScrolled] = useState(false)
  const [inJourney, setInJourney] = useState(false)
  const visible = scrolled && !inJourney

  useEffect(() => {
    return subscribeScroll((y, vh) => setScrolled(y > vh * 0.9))
  }, [])

  // Stay out of the way of the pinned design-journey section.
  useEffect(() => {
    const journey = document.getElementById('interior-journey')
    if (!journey || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInJourney(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(journey)
    return () => observer.disconnect()
  }, [])

  return (
    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="Chat with Salitous Homes on WhatsApp" className={`floating-contact ${visible ? 'is-visible' : ''}`} tabIndex={visible ? 0 : -1}>
      <MessageCircle size={20} />
      <span>Chat with us</span>
    </a>
  )
}

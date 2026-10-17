import { CONTACT_EMAIL, WHATSAPP_NUMBER } from './contact'

export type Inquiry = { name: string; email: string; phone: string; type?: string; message: string }

export const readInquiry = (form: HTMLFormElement): Inquiry => {
  const d = new FormData(form)
  const g = (k: string) => String(d.get(k) ?? '').trim()
  return { name: g('name'), email: g('email'), phone: g('phone'), type: g('project-type') || undefined, message: g('message') }
}

/** Sends the inquiry to /api/inquiry (WhatsApp auto-reply + team notification).
 *  If the API is unavailable, falls back to opening WhatsApp / email with the details prefilled. */
export async function submitInquiry(q: Inquiry): Promise<'auto' | 'fallback'> {
  try {
    const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })
    if (res.ok) return 'auto'
  } catch { /* fall through */ }
  const text = `Hello Salitous Homes,\nName: ${q.name}\nEmail: ${q.email}\nPhone: ${q.phone}${q.type ? `\nProject: ${q.type}` : ''}\n\n${q.message}`
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Inquiry from ' + q.name)}&body=${encodeURIComponent(text)}`
  return 'fallback'
}

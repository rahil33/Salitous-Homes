// Vercel serverless endpoint: POST /api/inquiry  (called by the Contact and Start-a-Project forms)
//  1) sends the customer an approved WhatsApp template (confirmation)
//  2) alerts the Salitous team on WhatsApp via an approved template (works outside the 24h window)
// Env vars: see .env.example
import { alertTeam, configured, normalizePhone, once, param, sendTemplate } from '../server/whatsapp.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const { name, email, phone, type, message } = req.body || {}
  if (!name || !email || !phone || !message) return res.status(400).json({ error: 'Missing fields' })
  if (!configured()) return res.status(503).json({ error: 'WhatsApp not configured' })

  const to = normalizePhone(phone)
  if (!to) return res.status(400).json({ error: 'Invalid phone number' })

  const lead = {
    name: String(name).slice(0, 60),
    email: String(email).slice(0, 100),
    phone: `+${to}`,
    project: type ? String(type).slice(0, 60) : 'Not specified',
    message: String(message).slice(0, 500),
  }

  // Only one customer confirmation per number per 10 minutes, so the form can't be used to spam someone.
  // The team is still alerted for every submission.
  const sendConfirmation = await once(`inquiry:${to}`, 600)

  const [customerOk, teamOk] = await Promise.all([
    sendConfirmation
      ? sendTemplate(to, process.env.WHATSAPP_TEMPLATE || 'inquiry_received', [param(lead.name, 60)])
      : true,
    alertTeam(lead),
  ])

  // Succeed if either message went out so a lead is never lost. Only when both fail do we return an error,
  // which makes the website fall back to opening WhatsApp / email with the details prefilled.
  if (customerOk || teamOk) return res.status(200).json({ ok: true, customerConfirmed: customerOk, teamNotified: teamOk })
  return res.status(502).json({ error: 'WhatsApp send failed' })
}

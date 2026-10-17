// Shared helpers for the WhatsApp Cloud API endpoints (api/inquiry.js, api/whatsapp-webhook.js).
// Server-side only: never import this from src/.
import crypto from 'node:crypto'

const graphUrl = () =>
  `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v23.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

export const configured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)

export const digits = (s) => String(s || '').replace(/\D/g, '')

/** "98765 43210", "09876543210", "+91 98765 43210", "0091..." -> "919876543210". Returns '' if it doesn't look valid. */
export function normalizePhone(input) {
  let d = digits(input).replace(/^00/, '')
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if (d.length === 10) d = (process.env.DEFAULT_COUNTRY_CODE || '91') + d
  return d.length >= 11 && d.length <= 15 ? d : ''
}

/** Template variables can't be empty and can't contain newlines, tabs or runs of 4+ spaces. */
export const param = (value, max = 200) => {
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' · ')
    .replace(/ {4,}/g, '   ')
    .trim()
    .slice(0, max)
  return { type: 'text', text: text || '-' }
}

/** POSTs to the Cloud API. Returns true if Meta accepted the message. Logs failures (last 4 digits only, no message text). */
export async function send(body) {
  try {
    const res = await fetch(graphUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    })
    if (!res.ok) console.error('WhatsApp send failed', res.status, `…${String(body.to).slice(-4)}`, await res.text().catch(() => ''))
    return res.ok
  } catch (err) {
    console.error('WhatsApp send error', err)
    return false
  }
}

/** Free-form text. Only delivered if the recipient messaged your business number in the last 24 hours. */
export const sendText = (to, text) => send({ to, type: 'text', text: { body: text, preview_url: false } })

/** Approved template. Works any time, including outside the 24-hour window. */
export const sendTemplate = (to, name, params = [], lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en') => {
  const template = { name, language: { code: lang } }
  if (params.length) template.components = [{ type: 'body', parameters: params }]
  return send({ to, type: 'template', template })
}

/** Team numbers that receive lead alerts (TEAM_WHATSAPP_NUMBER, comma-separated). */
export const teamNumbers = () =>
  String(process.env.TEAM_WHATSAPP_NUMBER || '')
    .split(',')
    .map(normalizePhone)
    .filter(Boolean)

/**
 * Alerts the team about a new lead. Uses the approved team template (WHATSAPP_TEAM_TEMPLATE) so it arrives at any time.
 * Without a template it falls back to plain text, which only arrives inside the 24-hour window.
 * Returns true if at least one team member's message was accepted.
 */
export async function alertTeam({ name, phone, email, project, message }) {
  const template = process.env.WHATSAPP_TEAM_TEMPLATE
  const results = await Promise.all(
    teamNumbers().map((to) =>
      template
        ? sendTemplate(to, template, [param(name, 60), param(phone, 30), param(email, 100), param(project, 60), param(message, 400)])
        : sendText(to, `New Salitous Homes inquiry\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nProject: ${project}\n\n${message}`),
    ),
  )
  return results.some(Boolean)
}

const seen = new Map()
/**
 * Returns true the first time `key` is seen within `ttlSec` seconds, false afterwards.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set (survives cold starts);
 * otherwise falls back to per-instance memory, which is best-effort only on serverless.
 * Keys are hashed so phone numbers aren't stored.
 */
export async function once(key, ttlSec) {
  const hashed = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32)
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    try {
      const res = await fetch(`${url}/set/${hashed}/1/EX/${ttlSec}/NX`, { headers: { Authorization: `Bearer ${token}` } })
      return (await res.json()).result === 'OK'
    } catch (err) {
      console.error('Upstash error, using in-memory fallback', err)
    }
  }
  const now = Date.now()
  for (const [k, expires] of seen) if (expires < now) seen.delete(k)
  if (seen.has(hashed)) return false
  seen.set(hashed, now + ttlSec * 1000)
  return true
}

/** Verifies Meta's X-Hub-Signature-256 header. If WHATSAPP_APP_SECRET isn't set, verification is skipped. */
export function validSignature(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return true
  const expected = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex'))
  const actual = Buffer.from(String(header || ''))
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

/** Reads the unparsed request body (needed for signature checks). Empty if the host already consumed the stream. */
export async function readRawBody(req) {
  if (typeof req.rawBody === 'string' || Buffer.isBuffer(req.rawBody)) return Buffer.from(req.rawBody)
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

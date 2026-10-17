// Vercel serverless endpoint: /api/whatsapp-webhook
// Meta calls this when a customer sends a WhatsApp message to the Salitous Homes number.
//  - GET  : one-time webhook verification handshake
//  - POST : inbound message -> auto-reply to the customer + alert the team
// Env vars: see .env.example
import { alertTeam, configured, once, readRawBody, sendText, validSignature } from '../server/whatsapp.js'

// A customer who sends several messages in a row only triggers one team alert per hour.
const ALERT_COOLDOWN_SEC = 60 * 60
// ...and only one auto-reply per 12 hours, so an ongoing chat isn't answered by a bot every time.
const REPLY_COOLDOWN_SEC = 12 * 60 * 60

const defaultReply = (name) =>
  `Hi ${name}, thank you for messaging Salitous Homes! 🏡 We've received your message and our design team will get back to you shortly. You can also reach us at info@salitoushomes.com.`

async function handleMessage(message, name) {
  if (message.type === 'reaction') return // don't auto-reply to a 👍
  if (!(await once(`msg:${message.id}`, 24 * 60 * 60))) return // Meta re-delivers webhooks; ignore repeats

  const text = message.type === 'text' ? message.text?.body : message[message.type]?.caption || `[${message.type} message]`

  // 1) Auto-reply. Free-form text is allowed here because the customer just messaged us (24h window is open).
  if (process.env.AUTO_REPLY !== 'off' && (await once(`reply:${message.from}`, REPLY_COOLDOWN_SEC))) {
    const custom = process.env.AUTO_REPLY_TEXT
    await sendText(message.from, custom ? custom.replaceAll('{name}', name) : defaultReply(name))
  }

  // 2) Alert the team (template, so it arrives even if they haven't messaged the business number today).
  if (await once(`alert:${message.from}`, ALERT_COOLDOWN_SEC)) {
    await alertTeam({ name, phone: `+${message.from}`, email: '-', project: 'Direct WhatsApp message', message: text || '-' })
  }
}

export default async function handler(req, res) {
  // --- Verification handshake (Meta > WhatsApp > Configuration > Webhook > Verify and save) ---
  if (req.method === 'GET') {
    const q = new URL(req.url, 'http://localhost').searchParams
    if (q.get('hub.mode') === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN && q.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(q.get('hub.challenge'))
    }
    return res.status(403).send('Forbidden')
  }
  if (req.method !== 'POST') return res.status(405).end()

  // --- Read + authenticate the payload ---
  const raw = await readRawBody(req)
  let payload
  try {
    if (raw.length) {
      if (!validSignature(raw, req.headers['x-hub-signature-256'])) return res.status(401).end()
      payload = JSON.parse(raw.toString('utf8'))
    } else {
      // The host already parsed the body, so the signature can't be checked.
      if (process.env.WHATSAPP_APP_SECRET) console.warn('Webhook body was pre-parsed; signature not verified')
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    }
  } catch {
    return res.status(400).end()
  }
  if (!configured()) return res.status(200).end() // nothing we can do; 200 stops Meta retrying

  // --- Process messages ---
  const jobs = []
  for (const entry of payload?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue // ignores e.g. smb_message_echoes (messages you send from the phone app)
      const value = change.value ?? {}
      if (value.metadata?.phone_number_id && value.metadata.phone_number_id !== process.env.WHATSAPP_PHONE_NUMBER_ID) continue

      for (const status of value.statuses ?? []) {
        if (status.status === 'failed') console.error('WhatsApp delivery failed', status.errors?.[0]?.code, status.errors?.[0]?.title)
      }
      for (const message of value.messages ?? []) {
        const name = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name || 'there'
        jobs.push(handleMessage(message, name))
      }
    }
  }
  // Serverless functions freeze once the response is sent, so finish the work first.
  const results = await Promise.allSettled(jobs)
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Webhook job failed', r.reason))
  return res.status(200).json({ ok: true })
}

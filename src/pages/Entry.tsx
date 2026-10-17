import { useState } from 'react'
import { Home } from './Home'

const seen = () => { try { return sessionStorage.getItem('salitous-entered') === '1' } catch { return true } }

export function Entry() {
  const [entered] = useState(seen)
  if (entered) return <Home />
  return <iframe src="/animate/index.html" title="Salitous Homes walkthrough" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0 }} />
}

import { useEffect, useRef } from 'react'
import { subscribeScroll } from '../lib/scrollFrame'

// Thin brass line along the top of the page that fills as you scroll.
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let max = 0
    const measure = () => { max = document.documentElement.scrollHeight - window.innerHeight }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(document.body)
    const unsubscribe = subscribeScroll((y) => {
      const value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
      ref.current?.style.setProperty('--scroll', value.toFixed(4))
    })
    return () => { unsubscribe(); observer?.disconnect() }
  }, [])

  return <div ref={ref} className="scroll-progress" aria-hidden="true"><i /></div>
}

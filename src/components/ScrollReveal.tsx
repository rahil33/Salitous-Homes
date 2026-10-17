import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
}

let revealObserver: IntersectionObserver | null = null

function getRevealObserver() {
  if (!revealObserver && typeof IntersectionObserver !== 'undefined') {
    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      }
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })
  }
  return revealObserver
}

export function ScrollReveal(props: ScrollRevealProps) {
  const { children, className = '', delay = 0, direction = 'up' } = props
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = getRevealObserver()
    if (!observer) {
      element.classList.add('is-visible')
      return
    }
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [])

  return (
    <div ref={ref} className={`reveal reveal-${direction} ${className}`} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

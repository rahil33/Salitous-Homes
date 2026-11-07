/**
 * One shared scroll scheduler for the whole page.
 *
 * Every scroll-driven effect used to attach its own listener and read layout (getBoundingClientRect / scrollHeight)
 * on every scroll frame. Because each effect also writes styles, the browser was forced to re-calculate layout several
 * times per frame, which is what makes scroll-heavy pages feel laggy. Here:
 *   - there is a single passive listener and a single requestAnimationFrame per frame,
 *   - listeners receive scrollY / viewport height and must not read layout,
 *   - element positions are measured once (and again only when the layout changes) via `trackBox`.
 */

export type ScrollListener = (scrollY: number, viewportHeight: number) => void

const listeners = new Set<ScrollListener>()
let frame = 0
let bound = false

const run = () => {
  frame = 0
  const y = window.scrollY
  const vh = window.innerHeight
  listeners.forEach((listener) => listener(y, vh))
}
const request = () => { if (!frame) frame = window.requestAnimationFrame(run) }

export function subscribeScroll(listener: ScrollListener) {
  listeners.add(listener)
  if (!bound) {
    bound = true
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
  }
  listener(window.scrollY, window.innerHeight)
  return () => {
    listeners.delete(listener)
    if (!listeners.size && bound) {
      bound = false
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      if (frame) { window.cancelAnimationFrame(frame); frame = 0 }
    }
  }
}

/** Document position of an element, measured once and refreshed only when layout changes. */
export function trackBox(el: HTMLElement) {
  const box = { top: 0, height: 0 }
  const measure = () => {
    const rect = el.getBoundingClientRect()
    box.top = rect.top + window.scrollY
    box.height = rect.height
    request()
  }
  measure()
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
  observer?.observe(el)
  observer?.observe(document.body)
  window.addEventListener('resize', measure)
  return {
    box,
    stop() {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    },
  }
}

/** Scroll progress (0 to 1) through a tall section that contains a sticky child. */
export function sectionProgress(box: { top: number; height: number }, scrollY: number, viewportHeight: number) {
  const distance = box.height - viewportHeight
  return distance > 0 ? Math.min(1, Math.max(0, (scrollY - box.top) / distance)) : 0
}

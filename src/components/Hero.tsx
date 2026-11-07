import { useEffect, useRef } from 'react'
import { ArrowDownRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const HERO_VIDEO = '/assets/projects/karnataka/videos/hero-loop.mp4'
const HERO_POSTER = '/assets/projects/karnataka/videos/hero-poster.webp'
type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } }

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // Gentle parallax: the media drifts and the copy fades as the visitor scrolls into the journey.
  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      section.style.setProperty('--hero-p', Math.min(1, Math.max(0, window.scrollY / window.innerHeight)).toFixed(4))
    }
    const request = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', request, { passive: true })
    return () => {
      window.removeEventListener('scroll', request)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia('(max-width: 767px)')
    if (reducedMotion.matches || mobile.matches || (navigator as NavigatorWithConnection).connection?.saveData) return

    let hasLoaded = false
    let isVisible = false
    let disposed = false
    const startAfterPaint = window.setTimeout(() => {
      if (!disposed && isVisible && !document.hidden && !hasLoaded) {
        hasLoaded = true
        video.src = HERO_VIDEO
        video.load()
        void video.play().catch(() => undefined)
      }
    }, 250)
    const playWhenReady = () => {
      if (hasLoaded && isVisible && !document.hidden && !reducedMotion.matches) void video.play().catch(() => undefined)
    }
    const visibilityChange = () => {
      if (document.hidden) video.pause()
      else playWhenReady()
    }
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) playWhenReady()
      else video.pause()
    }, { threshold: 0.05 })
    observer.observe(video)
    video.addEventListener('loadeddata', playWhenReady)
    document.addEventListener('visibilitychange', visibilityChange)
    return () => {
      disposed = true
      window.clearTimeout(startAfterPaint)
      observer.disconnect()
      video.removeEventListener('loadeddata', playWhenReady)
      document.removeEventListener('visibilitychange', visibilityChange)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  return (
    <section ref={sectionRef} className="hero relative overflow-hidden">
      <div className="hero-media">
        <video ref={videoRef} muted loop playsInline preload="none" poster={HERO_POSTER} aria-hidden="true" />
        <div className="hero-grid absolute inset-0" />
      </div>
      <div className="hero-content relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-end px-6 pb-16 pt-28 md:px-10 md:pb-20 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-end lg:gap-20">
          <div className="max-w-5xl">
            <p className="hero-rise eyebrow eyebrow-light mb-7" style={{ animationDelay: '.15s' }}>Bespoke interiors · Karnataka &amp; Tamil Nadu</p>
            <h1 className="display-title max-w-5xl text-[clamp(4.2rem,10vw,9.7rem)] font-extrabold uppercase">
              <span className="hero-line"><span style={{ animationDelay: '.3s' }}>Homes with a</span></span>
              <span className="hero-line"><span className="hero-script" style={{ animationDelay: '.48s' }}>point of view.</span></span>
            </h1>
          </div>
          <div className="hero-side hero-rise" style={{ animationDelay: '.8s' }}>
            <p className="max-w-xs text-base leading-relaxed text-white/70 md:text-lg">Thoughtful interiors for people who want their everyday spaces to feel considered, comfortable, and unmistakably their own.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/start-project" className="btn-primary">Start a project <ArrowRight size={15} /></Link>
              <Link to="/projects" className="btn-light">Explore work</Link>
            </div>
          </div>
        </div>
      </div>
      <a
        href="#interior-journey"
        onClick={(event) => { event.preventDefault(); document.getElementById('interior-journey')?.scrollIntoView({ behavior: 'smooth' }) }}
        className="hero-cue hero-rise absolute bottom-7 right-6 z-10 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-white/70 md:right-10"
        style={{ animationDelay: '1.2s' }}
      >
        Explore the design journey <span className="hero-cue-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/30"><ArrowDownRight size={15} /></span>
      </a>
    </section>
  )
}

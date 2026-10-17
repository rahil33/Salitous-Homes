import { useEffect, useRef } from 'react'
import { ArrowDownRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const HERO_VIDEO = '/assets/projects/karnataka/videos/hero-loop.mp4'
const HERO_POSTER = '/assets/projects/karnataka/videos/hero-poster.webp'
type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } }

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)

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
    <section className="hero relative overflow-hidden">
      <div className="hero-media">
        <video ref={videoRef} muted loop playsInline preload="none" poster={HERO_POSTER} aria-hidden="true" />
        <div className="hero-grid absolute inset-0" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-end px-6 pb-16 pt-28 md:px-10 md:pb-20 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-end lg:gap-20">
          <div className="max-w-5xl">
            <p className="eyebrow eyebrow-light mb-7">Bespoke interiors · Karnataka &amp; Tamil Nadu</p>
            <h1 className="display-title max-w-5xl text-[clamp(4.2rem,10vw,9.7rem)] font-extrabold uppercase">
              Homes with a <span className="hero-script">point of view.</span>
            </h1>
          </div>
          <div className="hero-side">
            <p className="max-w-xs text-base leading-relaxed text-white/70 md:text-lg">Thoughtful interiors for people who want their everyday spaces to feel considered, comfortable, and unmistakably their own.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/start-project" className="btn-primary">Start a project <ArrowRight size={15} /></Link>
              <Link to="/projects" className="btn-light">Explore work</Link>
            </div>
          </div>
        </div>
      </div>
      <a href="#interior-journey" className="absolute bottom-7 right-6 z-10 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-white/70 md:right-10">
        Explore the design journey <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30"><ArrowDownRight size={15} /></span>
      </a>
    </section>
  )
}

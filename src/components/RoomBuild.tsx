import { useEffect, useRef, useState } from 'react'
import { CAMERAS, STAGES, createInteriorScene } from '../three/interiorScene'
import { detectQuality } from '../three/gpuTier'
import type { InteriorScene } from '../three/interiorScene'
import { sectionProgress, subscribeScroll, trackBox } from '../lib/scrollFrame'

const stageAt = (p: number) => STAGES.reduce((acc, stage, i) => (p >= stage.from ? i : acc), 0)
const cameraAt = (p: number) => CAMERAS.reduce((acc, cam, i) => (p >= cam.at - 0.04 && i < CAMERAS.length ? i : acc), 0)

const fallbackImages = [
  '/assets/portfolio/concepts/living-styling-1.webp',
  '/assets/portfolio/concepts/tv-units-1.webp',
  '/assets/portfolio/concepts/pooja-wall-2.webp',
]

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export function RoomBuild() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const [stage, setStage] = useState(0)
  const [camera, setCamera] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !webglAvailable()) {
      setFallback(true)
      return
    }

    let scene: InteriorScene | null = null
    let building = false
    let target = 0
    let current = 0
    let frame = 0
    let visible = false
    let lastStage = -1
    let lastCam = -1
    let disposed = false
    let lastTime = 0
    let slowFrames = 0
    let measured = 0
    let downgrades = 0

    const compact = window.matchMedia('(max-width: 767px)').matches

    const { box, stop: stopTracking } = trackBox(section)
    const progressFromScroll = () => sectionProgress(box, window.scrollY, window.innerHeight)

    const tick = (now: number) => {
      frame = 0
      if (!scene || !visible) { lastTime = 0; return }
      const diff = target - current
      const animating = Math.abs(diff) >= 0.0003
      current = animating ? current + diff * 0.14 : target
      scene.setProgress(current)
      scene.render()

      // Judge smoothness by the real time between frames (GPU time never shows up in CPU timers).
      if (animating && lastTime && downgrades < 2) {
        measured++
        if (now - lastTime > 38) slowFrames++
        if (measured === 24) {
          if (slowFrames > 9) { scene.degrade(); downgrades++ }
          measured = 0
          slowFrames = 0
        }
      }
      lastTime = animating ? now : 0

      const s = stageAt(current)
      const c = cameraAt(current)
      if (s !== lastStage) { lastStage = s; setStage(s) }
      if (c !== lastCam) { lastCam = c; setCamera(c) }
      if (current !== target) frame = window.requestAnimationFrame(tick)
    }
    const request = () => { if (!frame && scene) frame = window.requestAnimationFrame(tick) }

    const unsubscribeScroll = subscribeScroll((y, vh) => { target = sectionProgress(box, y, vh); request() })
    const onResize = () => {
      if (!scene) return
      scene.resize(canvas.clientWidth, canvas.clientHeight)
      request()
    }

    // The scene is prepared in small slices well before it is needed (see createInteriorScene),
    // so by the time the section scrolls into view there is nothing heavy left to do.
    const build = () => {
      if (scene || building || disposed) return
      building = true
      createInteriorScene(canvas, { pixelRatio: compact ? 1 : 1.25, shadows: !compact, quality: detectQuality() })
        .then((created) => {
          if (disposed) { created.dispose(); return }
          scene = created
          scene.resize(canvas.clientWidth, canvas.clientHeight)
          target = current = progressFromScroll()
          setReady(true)
          if (visible) request()
        })
        .catch(() => setFallback(true))
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) { target = progressFromScroll(); request() }
    }, { rootMargin: '5% 0px 5% 0px' })
    observer.observe(section)

    // start preparing when the visitor is roughly four screens away (or the browser is idle after they start scrolling)
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { preload.disconnect(); build() }
    }, { rootMargin: '400% 0px 400% 0px' })
    preload.observe(section)

    const onLost = (event: Event) => { event.preventDefault(); setFallback(true) }
    canvas.addEventListener('webglcontextlost', onLost)
    window.addEventListener('resize', onResize)
    return () => {
      disposed = true
      observer.disconnect()
      preload.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      unsubscribeScroll()
      stopTracking()
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
      scene?.dispose()
    }
  }, [])

  const current = STAGES[stage]
  const cam = CAMERAS[camera]

  if (fallback) {
    return (
      <section className="room-static" aria-labelledby="room-title">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 lg:px-12">
          <p className="section-kicker">How a room comes together</p>
          <h2 id="room-title" className="section-heading mt-5 max-w-3xl">From bare shell to a finished, <span className="serif font-medium italic">lived-in room.</span></h2>
          <div className="room-static-grid">
            {fallbackImages.map((src) => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}
          </div>
          <ol className="room-static-steps">
            {STAGES.map((s, i) => <li key={s.title}><b>{String(i + 1).padStart(2, '0')}</b><span>{s.title}</span><p>{s.text}</p></li>)}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="room" aria-labelledby="room-title">
      <div className="room-sticky">
        <canvas ref={canvasRef} className={`room-canvas ${ready ? 'is-ready' : ''}`} role="img" aria-label="A 3D living room being designed step by step as you scroll" />

        <div className={`room-head ${stage === 0 ? 'is-shown' : ''}`}>
          <p className="room-kicker"><span />How a room comes together</p>
          <h2 id="room-title">Watch a living room get <em>designed.</em></h2>
        </div>

        <div className="room-cam" aria-hidden="true">
          <i /><i /><i /><i />
          <span>Cam {String(camera + 1).padStart(2, '0')}</span>
          {cam.label}
        </div>

        <div className="room-card" aria-live="polite">
          <p><b>{String(stage + 1).padStart(2, '0')}</b> / {String(STAGES.length).padStart(2, '0')}</p>
          <h3>{current.title}</h3>
          <p className="room-card-text">{current.text}</p>
        </div>

        <div className="room-steps" aria-hidden="true">
          {STAGES.map((s, i) => <span key={s.title} className={i === stage ? 'is-active' : i < stage ? 'is-done' : ''}>{s.title}</span>)}
        </div>
        <p className="room-note">Illustrative 3D concept, not a specific project.</p>
      </div>
    </section>
  )
}

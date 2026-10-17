import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { responsiveProjectImage, type Project } from '../data/projects'

export function ProjectSlideshow({ project }: { project: Project }) {
  const [current, setCurrent] = useState(0)
  const touchStart = useRef<number | null>(null)
  const touchEnd = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())

  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach((video) => {
      if (!video.paused) {
        video.pause()
      }
    })
  }, [])

  const playCurrentVideo = useCallback(() => {
    const video = videoRefs.current.get(current)
    if (video && video.paused) {
      video.play().catch(() => {})
    }
  }, [current])

  const next = useCallback(() => {
    pauseAllVideos()
    setCurrent((c) => {
      const nextIdx = c === project.media.length - 1 ? 0 : c + 1
      return nextIdx
    })
  }, [project.media.length, pauseAllVideos])

  const prev = useCallback(() => {
    pauseAllVideos()
    setCurrent((c) => {
      const prevIdx = c === 0 ? project.media.length - 1 : c - 1
      return prevIdx
    })
  }, [project.media.length, pauseAllVideos])

  const goToSlide = useCallback((idx: number) => {
    pauseAllVideos()
    setCurrent(idx)
  }, [pauseAllVideos])

  useEffect(() => {
    playCurrentVideo()
  }, [current, playCurrentVideo])

  useEffect(() => {
    return () => {
      pauseAllVideos()
    }
  }, [pauseAllVideos])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev])

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null
    touchStart.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return
    const distance = touchStart.current - touchEnd.current
    if (Math.abs(distance) > 50) {
      if (distance > 0) next()
      else prev()
    }
  }

  const maxThumbnails = 8
  const mediaItems = project.media
  const showThumbnails = mediaItems.length > maxThumbnails

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      tabIndex={0}
      role="region"
      aria-label="Project media slideshow"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-espresso/5 border border-beige/30"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {mediaItems.map((media, i) => (
            <div key={i} className="min-w-full flex items-center justify-center bg-espresso/5 p-4">
              {media.type === 'video' ? (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(i, el)
                    } else {
                      videoRefs.current.delete(i)
                    }
                  }}
                  src={i === current ? media.src : undefined}
                  poster={media.poster}
                  controls
                  muted
                  playsInline
                  loop
                  preload="none"
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <img
                  src={media.src}
                  {...responsiveProjectImage(media.src)}
                  alt={media.alt}
                  loading={i === current ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {mediaItems.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass-strong flex items-center justify-center hover:bg-[rgba(246,245,239,0.85)] transition-all duration-300 shadow-[0_2px_12px_rgba(41,51,44,0.1)] neu-raised-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4 text-charcoal" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass-strong flex items-center justify-center hover:bg-[rgba(246,245,239,0.85)] transition-all duration-300 shadow-[0_2px_12px_rgba(41,51,44,0.1)] neu-raised-sm"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4 text-charcoal" />
          </button>

          {showThumbnails ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {mediaItems.map((media, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    current === i ? 'border-copper opacity-100 shadow-[0_0_0_2px_rgba(105,122,100,0.15)]' : 'border-transparent opacity-40 hover:opacity-65'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                >
                  {media.type === 'video' ? (
                    <div className="w-full h-full bg-espresso/10 flex items-center justify-center text-xs text-walnut/50">
                      ▶
                    </div>
                  ) : (
                    <img src={media.src} {...responsiveProjectImage(media.src)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 glass-strong rounded-full px-3 py-1.5">
              {mediaItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    current === i ? 'bg-copper w-5 h-1.5' : 'bg-walnut/20 w-1.5 h-1.5 hover:bg-walnut/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          <div className="mt-3 text-center text-[11px] text-taupe/60 tracking-wide">
            {current + 1} / {mediaItems.length}
          </div>
        </>
      )}
    </div>
  )
}

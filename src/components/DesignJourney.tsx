import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type Chapter = {
  number: string
  label: string
  title: string
  accent: string
  text: string
  img: string
  alt: string
  position?: string
}

const chapters: Chapter[] = [
  {
    number: '01',
    label: 'Listen',
    title: 'We start with how you',
    accent: 'live.',
    text: 'A relaxed conversation about your routines, your taste and your budget, before a single line is drawn.',
    img: '/assets/projects/tamil-nadu/images/tamil-nadu-image-01',
    alt: 'Dining room interior',
    position: '50% 62%',
  },
  {
    number: '02',
    label: 'Plan',
    title: 'See every room before it',
    accent: 'exists.',
    text: 'Dimensioned drawings, floor plans and 3D visualisation, so the decisions are made on paper and not on site.',
    img: '/assets/projects/karnataka/images/karnataka-image-48',
    alt: 'Living room with designed ceiling',
  },
  {
    number: '03',
    label: 'Craft',
    title: 'Made to fit, down to the',
    accent: 'detail.',
    text: 'Kitchens, wardrobes, TV units and pooja spaces detailed and built around your measurements and your way of living.',
    img: '/assets/projects/karnataka/images/karnataka-image-37',
    alt: 'Kitchen with warm under-cabinet lighting',
  },
  {
    number: '04',
    label: 'Live',
    title: 'Handed over, ready to',
    accent: 'come home to.',
    text: 'Turnkey delivery means the home you receive is finished, right down to the final soft layer.',
    img: '/assets/projects/tamil-nadu/images/tamil-nadu-image-09',
    alt: 'Bedroom with cove lighting',
  },
]

// Share of the scroll distance used to open the frame before the chapters begin.
const OPEN_END = 0.17
const CURTAIN_START = 0.93

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function DesignJourney() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0

    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const distance = rect.height - window.innerHeight
      if (distance <= 0) return
      const p = clamp(-rect.top / distance)
      const open = easeOut(clamp(p / OPEN_END))
      const local = clamp((p - OPEN_END) / (1 - OPEN_END)) * chapters.length
      const index = Math.min(chapters.length - 1, Math.floor(local))
      el.style.setProperty('--p', p.toFixed(4))
      el.style.setProperty('--open', open.toFixed(4))
      el.style.setProperty('--chapter-p', (local - index).toFixed(4))
      el.style.setProperty('--rail', clamp((p - OPEN_END) / (1 - OPEN_END)).toFixed(4))
      el.style.setProperty('--curtain', clamp((p - CURTAIN_START) / (1 - CURTAIN_START)).toFixed(4))
      setActive((prev) => (prev === index ? prev : index))
      setOpened((prev) => (prev === open > 0.92 ? prev : open > 0.92))
    }
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section ref={ref} id="interior-journey" className={`journey ${opened ? 'is-open' : ''}`} aria-labelledby="journey-title">
      <div className="journey-sticky">
        <p className="journey-ghost" aria-hidden="true">Design<br />journey</p>

        <div className="journey-frame">
          {chapters.map((chapter, index) => (
            <img
              key={chapter.number}
              className={`journey-img ${index === active ? 'is-active' : ''}`}
              src={`${chapter.img}-1280.webp`}
              srcSet={`${chapter.img}-800.webp 800w, ${chapter.img}-1280.webp 1280w`}
              sizes="100vw"
              alt={index === active ? chapter.alt : ''}
              aria-hidden={index !== active}
              style={{ objectPosition: chapter.position ?? '50% 50%' }}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
          <div className="journey-shade" />
        </div>

        <div className="journey-intro">
          <p className="journey-kicker"><span />The design journey</p>
          <h2 id="journey-title" className="journey-intro-title">
            Every home begins with a <span className="journey-script">conversation.</span>
          </h2>
          <p className="journey-scroll-cue"><i />Keep scrolling</p>
        </div>

        <div className="journey-ui">
          <div className="journey-chapters">
            {chapters.map((chapter, index) => (
              <article key={chapter.number} className={`journey-chapter ${index === active ? 'is-active' : ''}`}>
                <p className="journey-chapter-kicker">
                  <b>{chapter.number}</b><span /> {chapter.label}
                </p>
                <h3>{chapter.title} <em className="journey-script">{chapter.accent}</em></h3>
                <p className="journey-chapter-text">{chapter.text}</p>
                {index === chapters.length - 1 && (
                  <Link to="/start-project" className="btn-primary journey-cta" tabIndex={index === active ? 0 : -1}>Start your project <ArrowRight size={15} /></Link>
                )}
              </article>
            ))}
          </div>

          <div className="journey-rail">
            <ol aria-label="Design journey progress">
              {chapters.map((chapter, index) => (
                <li key={chapter.number} className={index === active ? 'is-active' : index < active ? 'is-done' : ''}>
                  <span>{chapter.number}</span>{chapter.label}
                </li>
              ))}
            </ol>
            <i className="journey-rail-line"><b /></i>
          </div>
        </div>

        <div className="journey-curtain" aria-hidden="true" />
      </div>
    </section>
  )
}

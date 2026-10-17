import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PortfolioImage } from '../data/portfolio'

type Props = { images: PortfolioImage[]; index: number; title: string; onClose: () => void; onIndex: (i: number) => void }

export function Lightbox({ images, index, title, onClose, onIndex }: Props) {
  const go = (d: number) => onIndex((index + d + images.length) % images.length)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev }
  })
  const img = images[index]
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} /></button>
      {images.length > 1 && <>
        <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft size={24} /></button>
        <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight size={24} /></button>
      </>}
      <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={`${title} ${index + 1}`} width={img.w} height={img.h} className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain" />
        <figcaption className="text-xs tracking-[.15em] text-white/70">{title} · {index + 1} / {images.length}</figcaption>
      </figure>
    </div>
  )
}

import { services } from '../data/services'
import { Palette, KeyRound, Home, Box, Armchair, HardHat, MapPin, Ruler, type LucideIcon } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const iconMap: Record<string, LucideIcon> = { palette: Palette, key: KeyRound, home: Home, cube: Box, armchair: Armchair, 'hard-hat': HardHat, 'map-pin': MapPin, ruler: Ruler }

const homepageServices = ['Bespoke Interior Design', 'Turnkey Interior Projects', '3D Visualization', 'Furniture Selection']

export function Services({ limit }: { limit?: number } = {}) {
  const visibleServices = limit ? services.filter((service) => homepageServices.includes(service.title)).slice(0, limit) : services
  return (
    <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10 md:grid-cols-2 lg:grid-cols-4">
      {visibleServices.map((service, index) => {
        const Icon = iconMap[service.icon] || Palette
        return <ScrollReveal key={service.title} delay={index * 90} className="h-full"><article className="service-card group h-full bg-cream p-7 transition-colors duration-300 hover:bg-ivory md:p-8"><div className="service-icon mb-14 flex h-11 w-11 items-center justify-center rounded-full border border-copper/35 text-copper"><Icon size={19} strokeWidth={1.5} /></div><p className="mb-3 text-[11px] font-bold tracking-[.18em] text-taupe">0{index + 1}</p><h3 className="serif text-xl text-walnut">{service.title}</h3><p className="mt-3 text-sm leading-relaxed text-taupe">{service.description}</p></article></ScrollReveal>
      })}
    </div>
  )
}

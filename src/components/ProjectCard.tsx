import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { responsiveProjectImage, type Project } from '../data/projects'
import { ScrollReveal } from './ScrollReveal'

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  return (
    <ScrollReveal delay={index * 80} className="h-full">
      <Link to={`/projects/${project.id}`} className="project-card group block h-full">
        <div className="project-image relative">
          <img src={project.thumbnail} {...responsiveProjectImage(project.thumbnail)} alt={project.name} loading="lazy" decoding="async" />
          <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-walnut opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
        </div>
        <div className="flex items-start justify-between border-b border-black/10 py-5">
          <div><h3 className="serif text-xl text-walnut">{project.name}</h3><p className="mt-1 text-[11px] font-bold uppercase tracking-[.18em] text-taupe">{project.region === 'karnataka' ? 'Karnataka' : 'Tamil Nadu'}</p></div>
          <span className="pt-1 text-xs text-taupe">0{index + 1}</span>
        </div>
      </Link>
    </ScrollReveal>
  )
}

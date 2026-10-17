import { useState } from 'react'
import { projects } from '../data/projects'
import { ProjectCard } from './ProjectCard'
import { ScrollReveal } from './ScrollReveal'

type Filter = 'all' | 'karnataka' | 'tamil-nadu'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All spaces' },
  { value: 'karnataka', label: 'Karnataka' },
  { value: 'tamil-nadu', label: 'Tamil Nadu' },
]

export function ProjectFilter({ limit, editorial = false }: { limit?: number; editorial?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = filter === 'all' ? projects : projects.filter((project) => project.region === filter)
  const visible = limit ? filtered.slice(0, limit) : filtered

  return <div>
    <div className="mb-10 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter projects by region">
      {filters.map((item, index) => <ScrollReveal key={item.value} delay={index * 90} className="inline-flex"><button type="button" role="tab" aria-selected={filter === item.value} onClick={() => setFilter(item.value)} className={`filter-pill ${filter === item.value ? 'is-active' : ''}`}>{item.label}<span>{item.value === 'all' ? projects.length : projects.filter((project) => project.region === item.value).length}</span></button></ScrollReveal>)}
    </div>
    <div className={`grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3 ${editorial ? 'homepage-project-grid' : ''}`} key={filter}>{visible.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div>
    {limit && filtered.length > limit && <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-taupe">Showing {limit} of {filtered.length} spaces · <a className="text-copper underline" href="/projects">View all</a></p>}
  </div>
}

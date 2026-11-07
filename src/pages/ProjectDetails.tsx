import { useParams, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProjectSlideshow } from '../components/ProjectSlideshow'
import { projects } from '../data/projects'
import { ArrowLeft } from 'lucide-react'
import { ScrollReveal } from '../components/ScrollReveal'

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div>
        <Navbar />
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl text-walnut font-bold mb-4">Project Not Found</h1>
            <Link to="/projects" className="text-copper hover:text-brown text-[13px] transition-colors duration-300">
              Back to Projects
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="mb-8">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-[13px] text-taupe hover:text-walnut transition-colors duration-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Link>
          </ScrollReveal>

          <ScrollReveal className="mb-8">
            <p className="text-copper text-[11px] tracking-[0.3em] uppercase mb-2 font-medium">
              {project.region === 'karnataka' ? 'Karnataka' : 'Tamil Nadu'}
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-walnut font-bold">
              {project.name}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <ProjectSlideshow project={project} />
          </ScrollReveal>

          <ScrollReveal className="mt-14 text-center">
            <p className="text-taupe text-sm mb-6">
              Interested in a similar transformation for your home?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block neu-button text-cream font-medium px-10 py-3.5 rounded-full text-[13px] tracking-wide"
              >
                START YOUR PROJECT
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

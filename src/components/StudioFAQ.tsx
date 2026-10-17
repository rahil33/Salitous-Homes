import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const questions = [
  {
    question: 'Can I see the design before execution begins?',
    answer: 'Yes. Salitous offers 3D visualizations and walkthroughs so you can explore the interior direction before execution starts.',
  },
  {
    question: 'Do you offer both design and turnkey projects?',
    answer: 'Yes. Services include bespoke interior design as well as turnkey project execution. The right scope depends on your space and brief.',
  },
  {
    question: 'Where does Salitous Homes work?',
    answer: 'The studio serves projects across Karnataka and Tamil Nadu.',
  },
  {
    question: 'How do I get started?',
    answer: 'Share a few details about your space, location and ideas through the project enquiry form. The team can then discuss a suitable next step with you.',
  },
]

export function StudioFAQ() {
  return (
    <section className="faq-section soft-panel px-6 py-24 md:px-10 md:py-32 lg:px-12" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <ScrollReveal>
          <p className="section-kicker">A few useful details</p>
          <h2 id="faq-title" className="section-heading mt-5 max-w-lg">Before we begin.</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-taupe">A little about the work, the design process and how to start a conversation.</p>
          <Link to="/start-project" className="text-link mt-8 inline-flex">Tell us about your space <span aria-hidden="true">↗</span></Link>
        </ScrollReveal>
        <div className="faq-list">
          {questions.map((item, index) => (
            <ScrollReveal key={item.question} delay={index * 100}>
              <details className="faq-item" open={index === 0}>
                <summary><span>{item.question}</span><ChevronDown className="faq-chevron" size={18} strokeWidth={1.7} /></summary>
                <p>{item.answer}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

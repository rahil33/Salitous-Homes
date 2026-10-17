import { PackageCard } from './PackageCard'
import { ScrollReveal } from './ScrollReveal'

export function PackagesPreview() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <ScrollReveal>
        <PackageCard bhk="1" tier="essential" />
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <PackageCard bhk="1" tier="standard" />
      </ScrollReveal>
      <ScrollReveal delay={160}>
        <PackageCard bhk="1" tier="premium" />
      </ScrollReveal>
    </div>
  )
}

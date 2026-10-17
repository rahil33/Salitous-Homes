import { packages, type PackageTier } from '../data/packages'
import { Check } from 'lucide-react'

export function PackageCard({
  bhk,
  tier,
}: {
  bhk: '1' | '2' | '3'
  tier: PackageTier
}) {
  const pkg = packages[bhk][tier]

  const isPremium = tier === 'premium'

  return (
    <div className={`rounded-2xl p-6 transition-all duration-500 ${
      isPremium
        ? 'glass-strong shadow-[0_8px_30px_rgba(41,51,44,0.08),0_4px_12px_rgba(105,122,100,0.06)] border border-copper/15 hover:shadow-[0_12px_40px_rgba(41,51,44,0.1)]'
        : 'glass shadow-[0_4px_16px_rgba(41,51,44,0.04)] hover:shadow-[0_8px_30px_rgba(41,51,44,0.08)] hover:-translate-y-0.5'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] font-medium text-copper uppercase tracking-[0.15em]">
          {bhk} BHK
        </span>
        <span className={`text-[11px] font-medium uppercase tracking-[0.15em] ${
          isPremium ? 'text-copper' : 'text-taupe/70'
        }`}>
          {tier}
        </span>
      </div>

      <ul className="space-y-2.5">
        {pkg.inclusions.map((inc, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-charcoal/75">
            <Check className="h-3.5 w-3.5 mt-0.5 text-copper/80 flex-shrink-0" />
            <span>{inc.title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

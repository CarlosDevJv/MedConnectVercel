import { LandingFinalCta } from '@/features/marketing/components/LandingFinalCta'
import { LandingFooter } from '@/features/marketing/components/LandingFooter'
import { LandingHero } from '@/features/marketing/components/LandingHero'
import { LandingImpact } from '@/features/marketing/components/LandingImpact'
import { LandingIntegrated } from '@/features/marketing/components/LandingIntegrated'
import { LandingModules } from '@/features/marketing/components/LandingModules'
import { LandingNav } from '@/features/marketing/components/LandingNav'
import { LandingPricing } from '@/features/marketing/components/LandingPricing'
import { LandingProblems } from '@/features/marketing/components/LandingProblems'
import { LandingProfiles } from '@/features/marketing/components/LandingProfiles'
import { LandingSecurity } from '@/features/marketing/components/LandingSecurity'

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingProblems />
        <LandingIntegrated />
        <LandingProfiles />
        <LandingModules />
        <LandingImpact />
        <LandingSecurity />
        <LandingPricing />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}

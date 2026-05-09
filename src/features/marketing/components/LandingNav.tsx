import { Link } from 'react-router-dom'

import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { useAuth } from '@/features/auth/useAuth'

const navLinkClass =
  'text-sm font-medium text-[var(--color-foreground)]/88 hover:text-[var(--color-accent-ink)]'

export function LandingNav() {
  const { status } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <BrandWordmark size="md" />
        </Link>

        <nav aria-label="Principal" className="hidden md:flex flex-1 items-center justify-center gap-10">
          <a href="#plataforma" className={navLinkClass}>
            Plataforma
          </a>
          <a href="#solucoes" className={navLinkClass}>
            Soluções
          </a>
          <a href="#sobre" className={navLinkClass}>
            Sobre nós
          </a>
        </nav>

        {status === 'authenticated' ? (
          <div className="ml-auto flex shrink-0 items-center md:ml-6">
            <Link
              to="/app"
              className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-accent-ink)] hover:bg-[var(--color-muted)]"
            >
              Painel
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  )
}

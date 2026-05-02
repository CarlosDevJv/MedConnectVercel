import * as React from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'

import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

const navLinkClass =
  'text-sm font-medium text-[var(--color-foreground)]/88 hover:text-[var(--color-accent-ink)]'

export function LandingNav() {
  const { status } = useAuth()
  const [searchOpen, setSearchOpen] = React.useState(false)

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

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:flex-none md:gap-3">
          <div className={cn('flex items-center', searchOpen ? 'rounded-full bg-[var(--color-muted)] pl-3 pr-1' : '')}>
            {!searchOpen ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir pesquisa"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                <Search className="h-5 w-5 text-[var(--color-accent-solid)]" />
              </button>
            ) : (
              <label className="flex min-w-0 max-w-[min(100vw-10rem,220px)] items-center gap-2 sm:max-w-xs">
                <Search className="h-4 w-4 shrink-0 text-[var(--color-accent-solid)]" aria-hidden />
                <input
                  autoFocus
                  type="search"
                  placeholder="Buscar…"
                  aria-label="Buscar no site"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
                  onBlur={() => setSearchOpen(false)}
                />
              </label>
            )}
          </div>

          {status === 'authenticated' ? (
            <Link
              to="/app"
              className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-accent-ink)] hover:bg-[var(--color-muted)]"
            >
              Painel
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-accent-ink)] hover:bg-[var(--color-muted)]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

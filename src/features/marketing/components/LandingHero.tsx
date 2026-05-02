import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'

const HERO_BG_URL = `${import.meta.env.BASE_URL}landing-hero-medical-team.png`

export function LandingHero() {
  return (
    <section
      id="plataforma"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[min(78svh,52rem)] flex-col justify-center overflow-hidden pb-20 pt-28 sm:pb-24 sm:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div
          className="hero-ken-burns-motion absolute inset-x-[-8%] bottom-[-8%] top-0 origin-top bg-cover bg-top transition-none"
          style={{ backgroundImage: `url(${HERO_BG_URL})` }}
          aria-hidden="true"
          role="presentation"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[color-mix(in_srgb,var(--color-background)_96%,white)] via-[color-mix(in_srgb,var(--color-background)_82%,transparent)] to-[color-mix(in_srgb,var(--color-accent-soft)_22%,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-accent-ink)]/[0.06] via-transparent to-[var(--color-background)]/[0.94]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[var(--color-background)] to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--color-surface)_78%,transparent)]/90 p-1 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border)] backdrop-blur-md sm:p-0 sm:bg-transparent sm:shadow-none sm:ring-0 sm:backdrop-blur-none">
          <div className="rounded-[calc(var(--radius-lg)-2px)] px-4 py-6 sm:p-0 sm:py-0">
            <h1
              id="hero-heading"
              className="font-display text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:[text-shadow:0_2px_24px_rgb(255_255_255/0.5)] sm:text-5xl lg:text-[3rem] lg:leading-[1.12]"
            >
              Aumente sua{' '}
              <span className="text-[var(--color-accent-ink)]">
                eficiência e sua receita
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-foreground)]/90 sm:text-[var(--color-muted-foreground)]">
              Centralize sua agenda, pacientes, comunicações e faturamento em uma única plataforma intuitiva e completa.
              Simplifique sua gestão e foque no que importa: seus pacientes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-solid)] px-8 text-base font-semibold text-white shadow-md hover:bg-[var(--color-accent-solid-hover)]"
              >
                Experimente grátis
              </Link>
              <a
                href="#solucoes"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-8 text-base font-semibold text-[var(--color-accent-ink)] shadow-sm backdrop-blur-sm hover:bg-[var(--color-surface)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
                  <Play className="h-4 w-4 fill-current" aria-hidden />
                </span>
                Veja como funciona
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

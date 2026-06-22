import { contactMailtoHref } from '@/features/marketing/data'

export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-t border-[var(--color-border)] bg-[var(--color-accent-ink)] py-20"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 id="final-cta-heading" className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Pronto para transformar sua clínica?
        </h2>
        <p className="mt-4 text-lg text-white/90">
          Use o botão Iniciar no topo da página para abrir o cadastro. Prefere uma demonstração antes?
        </p>
        <p className="mt-10">
          <a
            href={contactMailtoHref}
            className="text-sm font-semibold text-white/95 underline-offset-4 hover:underline"
          >
            Agendar demonstração guiada por email
          </a>
        </p>
      </div>
    </section>
  )
}

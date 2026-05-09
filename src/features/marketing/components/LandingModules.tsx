import { CalendarRange, FileText } from 'lucide-react'

export function LandingModules() {
  return (
    <section aria-labelledby="modules-heading" className="bg-[var(--color-background)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="modules-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Todos os módulos que <span className="text-[var(--color-accent-ink)]">você precisa</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Da marcação inicial ao arquivo clínico MediConnect cobre núcleos operacionais com menos dispersão e mais
          rastreio em todo o ciclo da clínica.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <CalendarRange className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="mt-8 text-xl font-semibold text-[var(--color-foreground)]">Agenda inteligente</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Filtros por profissional sala e especialidade com confirmação integrada ocupação sempre visível recepção e
              consultório lado a lado sempre no mesmo lugar.
            </p>
          </article>
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <FileText className="h-7 w-7" aria-hidden />
            </span>
            <h3 className="mt-8 text-xl font-semibold text-[var(--color-foreground)]">Laudos e pacientes</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Cadastro de pacientes e relatórios médicos conforme os recursos publicados na documentação RiseUP (Apidog).
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

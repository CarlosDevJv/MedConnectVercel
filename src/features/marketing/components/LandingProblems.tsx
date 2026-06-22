import { CalendarX2, MessageCircleWarning, Timer } from 'lucide-react'

export function LandingProblems() {
  return (
    <section
      aria-labelledby="problems-heading"
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="problems-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Problemas que você enfrenta{' '}
          <span className="text-[var(--color-accent-ink)]">todos os dias</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Atrasos comunicação dispersa e agenda mal alinhada consomem fôlego da equipe ainda antes do meio do expediente.
        </p>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          <li className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <Timer className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-5 text-[17px] font-semibold text-[var(--color-foreground)]">Atrasos no atendimento</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Quando recepção e consultório não enxergam o mesmo estado real filas aumentam médico espera paciente
              volta frustrado porque ninguém fecha informação rápido.
            </p>
          </li>
          <li className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <CalendarX2 className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-5 text-[17px] font-semibold text-[var(--color-foreground)]">Agendamentos perdidos</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Conflitos de horário marcações sobrescritas manualmente ou lembretes fora do sistema deixam ocupação sempre
              incerta quando a agenda acelera.
            </p>
          </li>
          <li className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <MessageCircleWarning className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-5 text-[17px] font-semibold text-[var(--color-foreground)]">Falha na comunicação</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Sem um canal único de história paciente médico secretária e gestão vivem versões paralelas aumentando erro e
              tempo gasto repetindo dados.
            </p>
          </li>
        </ul>
      </div>
    </section>
  )
}

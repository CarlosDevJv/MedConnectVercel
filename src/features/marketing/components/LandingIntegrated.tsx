import { CalendarRange, MessagesSquare } from 'lucide-react'

export function LandingIntegrated() {
  return (
    <section aria-labelledby="integrated-heading" className="bg-[var(--color-surface-sidebar)] py-20">
      <div id="solucoes" className="mx-auto max-w-7xl px-4 scroll-mt-28 sm:px-6 lg:px-8">
        <h2
          id="integrated-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Tudo integrado, uma <span className="text-[var(--color-accent-ink)]">única plataforma</span>.
        </h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--color-muted-foreground)]">
          Agenda, prontuário, comunicações e indicadores compartilham a mesma base no MediConnect — menos planilhas
          paralelas, menos retrabalho e menos risco de informação perdida entre setores.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <CalendarRange className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-[var(--color-foreground)]">Agenda inteligente</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Reúne ocupação de profissionais e salas, confirmação em fluxo único e histórico disponível antes do
              atendimento para reduzir faltas e retrabalho.
            </p>
          </article>
          <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-solid)]">
              <MessagesSquare className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-[var(--color-foreground)]">Comunicação automática</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Mensagens automáticas acompanham o fluxo dos agendamentos e ficam ligadas ao prontuário para equipe médica ter
              trilho rastreável conforme as políticas da sua clínica.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

import { BarChart3, CalendarDays, ClipboardList } from 'lucide-react'

export function LandingProfiles() {
  return (
    <section aria-labelledby="profiles-heading" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="profiles-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Cada perfil com sua <span className="text-[var(--color-accent-ink)]">experiência dedicada</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Cada papel vê apenas o necessário ao seu dia sem perder padronização: médicos focam consulta secretárias na agenda
          e administradores nos números e governança.
        </p>

        <div className="mt-10 grid gap-4 border-t border-[var(--color-border)] pt-8 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sidebar)] p-5">
            <CalendarDays className="h-7 w-7 text-[var(--color-accent-solid)]" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-[var(--color-foreground)]">Atendimento ágil</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              Próximo paciente, status da fila e atalhos para laudos e relatórios sem telas que distraiam do consultório.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sidebar)] p-5">
            <ClipboardList className="h-7 w-7 text-[var(--color-accent-solid)]" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-[var(--color-foreground)]">Gestão eficiente</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              Confirmações, documentação e comunicação reunidos num fluxo só para reduzir ligações e retrabalho.
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sidebar)] p-5">
            <BarChart3 className="h-7 w-7 text-[var(--color-accent-solid)]" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-[var(--color-foreground)]">Visão estratégica</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              KPIs consolidados sobre ocupação, produtividade e uso de recurso sempre auditáveis.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

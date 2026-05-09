import * as React from 'react'
import { BarChart3, CalendarDays, ClipboardList } from 'lucide-react'

type ProfileTab = 'medicos' | 'secretarias' | 'admin'

export function LandingProfiles() {
  const [tab, setTab] = React.useState<ProfileTab>('medicos')

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

        <div className="mt-10 flex flex-wrap gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-sidebar)] p-1.5 sm:inline-flex">
          {(
            [
              { id: 'medicos' as const, label: 'Médicos' },
              { id: 'secretarias' as const, label: 'Secretárias' },
              { id: 'admin' as const, label: 'Administradores' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-colors ${tab === item.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm ring-1 ring-[var(--color-border)]'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 border-t border-[var(--color-border)] pt-8 md:grid-cols-3">
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

        <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {tab === 'medicos' && 'Painel exemplo — médico'}
            {tab === 'secretarias' && 'Painel exemplo — recepção'}
            {tab === 'admin' && 'Painel exemplo — gestão'}
          </p>
          <p className="mt-3 text-[15px] text-[var(--color-muted-foreground)]">
            Filtros, painéis e atalhos mudam conforme o perfil escolhido — ilustração de referência apenas.
          </p>
          {tab === 'medicos' ? (
            <ul className="mt-5 list-disc space-y-1.5 pl-5 text-[15px] text-[var(--color-foreground)]">
              <li>Pacientes (cadastro API)</li>
              <li>Gestão de laudos</li>
              <li>Agendamentos próprios</li>
              <li>Comunicação com pacientes</li>
              <li>Relatórios médicos</li>
            </ul>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="h-28 rounded-[var(--radius-md)] bg-[var(--color-muted)]/80 ring-1 ring-[var(--color-border)]" />
            <div className="h-28 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-border)]" />
          </div>
        </div>
      </div>
    </section>
  )
}

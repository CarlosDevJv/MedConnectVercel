import { CheckCircle2 } from 'lucide-react'

import { useAuth } from '@/features/auth/useAuth'
import { ROLE_LABELS, pickPrimaryRole } from '@/types/user'

export function HomePlaceholder() {
  const { userInfo } = useAuth()
  const role = pickPrimaryRole(userInfo?.roles)
  const fullName = userInfo?.profile?.full_name ?? userInfo?.user?.email ?? ''

  return (
    <div className="mx-auto max-w-3xl">
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sessão autenticada
      </span>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] mt-4 sm:text-4xl">
        Bem-vindo de volta, {fullName?.split(' ')?.[0] || 'usuário'}.
      </h1>

      <p className="mt-3 text-[var(--color-muted-foreground)]">
        Esta é uma área temporária só para validar o fluxo de autenticação. As telas de Agenda,
        Pacientes, Médicos e Relatórios entram nas próximas etapas.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Email
          </dt>
          <dd className="mt-1.5 text-sm text-[var(--color-foreground)]">
            {userInfo?.user?.email ?? '—'}
          </dd>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Papel
          </dt>
          <dd className="mt-1.5 text-sm text-[var(--color-foreground)]">{ROLE_LABELS[role]}</dd>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Roles ativas
          </dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {(userInfo?.roles ?? []).map((r) => (
              <span
                key={r}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 py-0.5 text-xs text-[var(--color-foreground)]"
              >
                {ROLE_LABELS[r]}
              </span>
            ))}
            {(!userInfo?.roles || userInfo.roles.length === 0) && (
              <span className="text-xs text-[var(--color-muted-foreground)]">Nenhuma role atribuída.</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

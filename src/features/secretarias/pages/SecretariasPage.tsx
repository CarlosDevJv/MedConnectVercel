import { Clock, Info, KeyRound } from 'lucide-react'

import { CreateUserWithPasswordForm } from '@/features/users/components/CreateUserWithPasswordForm'

export function SecretariasPage() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Equipe
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Secretárias</h1>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          >
            <KeyRound className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg leading-tight text-[var(--color-foreground)]">
            Nova secretária
          </h2>
        </div>

        <CreateUserWithPasswordForm />
      </section>

      <aside className="flex items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-5 text-sm text-[var(--color-muted-foreground)]">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-[var(--color-foreground)]">Listagem e edição em breve</p>
          <p>
            A API ainda não expõe um endpoint público para listar usuários. Assim que ficar
            disponível, a tabela com todas as secretárias e os controles de edição/desativação
            aparecerão aqui.
          </p>
        </div>
      </aside>

      <aside className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted-foreground)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-[var(--color-foreground)]">Permissões da secretária</p>
          <p>
            Pode visualizar e editar pacientes, gerenciar agendamentos e atender pelo chat. Não
            acessa a lista de laudos (relatórios médicos) nem indicadores restritos a gestores.
          </p>
        </div>
      </aside>
    </div>
  )
}

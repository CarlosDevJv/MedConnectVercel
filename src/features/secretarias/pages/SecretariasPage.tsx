import { Clock, Info, KeyRound, UserPlus } from 'lucide-react'

import { SecretariaInviteForm } from '@/features/secretarias/components/SecretariaInviteForm'
import { CreateUserWithPasswordForm } from '@/features/users/components/CreateUserWithPasswordForm'

export function SecretariasPage() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Equipe
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Secretárias e usuários</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Convide por Magic Link ou crie conta com senha e CPF (login imediato). Papéis: secretaria,
          paciente ou usuário básico. Profissionais com CRM e senha inicial:{' '}
          <strong>Médicos</strong> → <strong>Senha + CRM</strong> ou cadastro rápido no drawer.
        </p>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          >
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg text-[var(--color-foreground)]">
              Convidar nova secretária
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Preencha os dados — enviaremos um Magic Link por email para que ela conclua o
              cadastro.
            </p>
          </div>
        </div>

        <SecretariaInviteForm />
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          >
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg text-[var(--color-foreground)]">
              Cadastro com senha (login na hora)
            </h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Email confirmado automaticamente pela API — a pessoa acessa com a senha que você definir
              aqui. O endpoint <code className="rounded-md bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-xs">
                create-user-with-password
              </code>{' '}
              exige CPF válido (11 dígitos).
            </p>
          </div>
        </div>

        <CreateUserWithPasswordForm />
      </section>

      <aside className="flex items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-5 text-sm text-[var(--color-muted-foreground)]">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-[var(--color-foreground)]">
            Listagem e edição em breve
          </p>
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
            tem acesso a relatórios médicos nem ao painel administrativo.
          </p>
        </div>
      </aside>
    </div>
  )
}

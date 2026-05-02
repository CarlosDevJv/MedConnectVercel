import { Copy, RefreshCcw } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import type { UserRole } from '@/types/user'

const ALL_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria', 'paciente', 'user']

const SENSITIVE_KEYS = new Set(['access_token', 'refresh_token'])

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(
    value,
    (key, val) => {
      if (SENSITIVE_KEYS.has(key) && typeof val === 'string') {
        return val.length > 20 ? `${val.slice(0, 12)}…${val.slice(-6)}` : val
      }
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val as object)) return '[Circular]'
        seen.add(val as object)
      }
      return val
    },
    2
  )
}

interface SectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <header className="mb-3 flex flex-col gap-0.5">
        <h2 className="font-display text-base text-[var(--color-foreground)]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  )
}

interface JsonBlockProps {
  data: unknown
  emptyLabel?: string
}

function JsonBlock({ data, emptyLabel }: JsonBlockProps) {
  const text = data === null || data === undefined ? '' : safeStringify(data)

  async function copy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado para a área de transferência.')
    } catch {
      toast.error('Não consegui copiar. Selecione e copie manualmente.')
    }
  }

  if (!text) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
        {emptyLabel ?? 'Sem dados.'}
      </p>
    )
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        className="absolute right-2 top-2 h-7 px-2 text-xs"
      >
        <Copy className="h-3.5 w-3.5" />
        Copiar
      </Button>
      <pre className="max-h-[420px] overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-3 pr-20 text-[11px] leading-relaxed text-[var(--color-foreground)]">
        <code>{text}</code>
      </pre>
    </div>
  )
}

export function WhoAmIPage() {
  const { session, userInfo, status, refreshUserInfo, debug } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)

  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]">
        Página de diagnóstico disponível apenas em modo de desenvolvimento.
      </div>
    )
  }

  const roles = userInfo?.roles ?? []
  const accessToken = session?.access_token ?? ''
  const tokenPreview = accessToken
    ? `${accessToken.slice(0, 16)}…${accessToken.slice(-8)}`
    : '—'

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshUserInfo()
      toast.success('userInfo recarregado.')
    } catch (error) {
      toast.error('Falha ao recarregar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido.',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const fullDump = {
    status,
    sessionPresent: !!session,
    tokenPreview,
    debug,
    userInfo,
  }

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Diagnóstico (dev only)
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">
            Who Am I — Auth debug
          </h1>
          <Button type="button" variant="outline" onClick={handleRefresh} loading={refreshing}>
            <RefreshCcw className="h-4 w-4" />
            Recarregar /user-info
          </Button>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Use esta tela para identificar por que as roles podem não estar chegando. Copie o JSON
          completo no fim da página e envie no chat para análise.
        </p>
      </header>

      <Section
        title="Resumo"
        subtitle="O que os guards e o sidebar enxergam agora."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Auth status
            </dt>
            <dd className="font-mono text-sm text-[var(--color-foreground)]">{status}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Session
            </dt>
            <dd className="font-mono text-sm text-[var(--color-foreground)]">
              {session ? 'presente' : 'ausente'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Email
            </dt>
            <dd className="text-sm text-[var(--color-foreground)]">
              {userInfo?.user?.email ?? session?.user?.email ?? '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              User ID
            </dt>
            <dd className="font-mono text-xs text-[var(--color-foreground)]">
              {userInfo?.user?.id ?? session?.user?.id ?? '—'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3 sm:col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Roles efetivas
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {roles.length === 0 ? (
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  Nenhuma role atribuída.
                </span>
              ) : (
                roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-2.5 py-0.5 font-mono text-xs text-[var(--color-accent)]"
                  >
                    {r}
                  </span>
                ))
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 overflow-hidden rounded-md border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)]/40 text-left text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-3 py-2">Guard / role</th>
                <th className="px-3 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {ALL_ROLES.map((role) => {
                const allowed = roles.includes(role)
                return (
                  <tr key={role}>
                    <td className="px-3 py-2 font-mono text-xs">useHasRole('{role}')</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          allowed
                            ? 'inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
                            : 'inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700'
                        }
                      >
                        {allowed ? 'permitido' : 'negado'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td className="px-3 py-2 font-mono text-xs">
                  useCanManagePatients (admin/gestor/secretaria)
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      roles.some((r) => ['admin', 'gestor', 'secretaria'].includes(r))
                        ? 'inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
                        : 'inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700'
                    }
                  >
                    {roles.some((r) => ['admin', 'gestor', 'secretaria'].includes(r))
                      ? 'permitido'
                      : 'negado'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Resposta de /functions/v1/user-info"
        subtitle={
          debug?.userInfoRemote?.ok === false
            ? `Falhou (status ${debug.userInfoRemote.error.status ?? '—'}). Caiu no fallback do JWT.`
            : debug?.userInfoRemote?.ok === true
              ? 'Sucesso (200). Esta é a resposta crua usada para hidratar o userInfo.'
              : 'Ainda não carregado.'
        }
      >
        <JsonBlock
          data={
            debug?.userInfoRemote?.ok === true
              ? debug.userInfoRemote.raw
              : debug?.userInfoRemote?.ok === false
                ? debug.userInfoRemote.error
                : null
          }
          emptyLabel="Aguardando primeira chamada de /user-info."
        />
      </Section>

      <Section
        title="JWT decodificado"
        subtitle="Payload do access_token. Olhe app_metadata.roles / app_metadata.role para ver o que o backend pôs no token."
      >
        <JsonBlock
          data={debug?.session?.accessTokenPayload ?? null}
          emptyLabel="Sem session.access_token."
        />
      </Section>

      <Section
        title="Session.user metadata"
        subtitle="app_metadata e user_metadata diretamente do Supabase Auth."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              app_metadata
            </p>
            <JsonBlock data={debug?.session?.appMetadata ?? null} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              user_metadata
            </p>
            <JsonBlock data={debug?.session?.userMetadata ?? null} />
          </div>
        </div>
      </Section>

      <Section
        title="userInfo hidratado (estado final)"
        subtitle="O que o resto do app está consumindo via useAuth()."
      >
        <JsonBlock data={userInfo} />
      </Section>

      <Section
        title="Dump completo (cole isto no chat)"
        subtitle="JSON com tudo acima reunido. Tokens são truncados automaticamente."
      >
        <JsonBlock data={fullDump} />
      </Section>
    </div>
  )
}

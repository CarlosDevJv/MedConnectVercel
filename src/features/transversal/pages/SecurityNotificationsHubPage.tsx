import { ArrowRight, Bell, Layers, Mail, Smartphone } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SmsChannelPanel } from '@/features/communications/components/SmsChannelPanel'
import { summarizeGapsMarkdown } from '@/features/transversal/backendContractFollowup'
import { useHasRole } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

type HubTabId = 'sms' | 'push' | 'email' | 'reminders'

const TABS: { id: HubTabId; label: string; icon: typeof Bell }[] = [
  { id: 'sms', label: 'SMS (API)', icon: Smartphone },
  { id: 'push', label: 'Push', icon: Bell },
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'reminders', label: 'Lembretes', icon: Layers },
]

/** Mesmos papéis do módulo Mensagens standalone. */
const SMS_ALLOWED = ['admin', 'gestor', 'medico', 'secretaria'] as const

export function SecurityNotificationsHubPage() {
  const canUseSmsApi = useHasRole(...SMS_ALLOWED)
  const [tab, setTab] = React.useState<HubTabId>(() => (canUseSmsApi ? 'sms' : 'push'))

  React.useEffect(() => {
    if (!canUseSmsApi && tab === 'sms') setTab('push')
  }, [canUseSmsApi, tab])

  function copyGapsSummary() {
    const text = summarizeGapsMarkdown()
    void navigator.clipboard.writeText(text).then(
      () => toast.success('Checklist copiado'),
      () => toast.error('Não foi possível copiar.')
    )
  }

  return (
    <div className="relative mx-auto max-w-[1100px]">
      {/* Camada estrutural: faixa tipo “ribbon” */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[min(18vw,8rem)] top-[-2rem] h-[calc(100%+4rem)] w-2 skew-y-[2deg] bg-emerald-700/85"
      />

      <header className="relative mb-10 flex flex-col gap-5 border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-9 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
        <div
          aria-hidden="true"
          className="dot-pattern absolute inset-0 opacity-[0.14]"
        />
        <div className="relative flex max-w-xl flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-900/85">
            Seção 3 · transversal
          </p>
          <h1 className="font-display text-[2.35rem] font-medium italic leading-tight tracking-tight text-[var(--color-foreground)]">
            Segurança &amp; canais de aviso
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            O que já existe no front segue apenas o contrato publicado na API central. Para itens não publicados mantemos placeholders explícitos
            — sem simular dados.
          </p>
        </div>
        <div className="relative flex shrink-0 flex-col gap-2 sm:items-end">
          <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link to="/app/privacidade" className="inline-flex items-center gap-2">
              Privacidade e LGPD <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-xs text-[var(--color-muted-foreground)]" onClick={() => copyGapsSummary()}>
            Copiar checklist de backlog (markdown)
          </Button>
        </div>
      </header>

      <nav
        className="mb-8 flex snap-x gap-2 overflow-x-auto pb-1"
        aria-label="Canais e notificações"
        role="tablist"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const disabledSms = t.id === 'sms' && !canUseSmsApi
          const active = tab === t.id && !disabledSms
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabledSms}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex snap-start items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2.5 text-left text-[13px] font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/50',
                disabledSms && 'cursor-not-allowed opacity-35'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t.label}
            </button>
          )
        })}
      </nav>

      <div role="tabpanel" className="animate-fade-in-up-delay-1">
        {tab === 'sms' && canUseSmsApi && (
          <>
            <Alert variant="info" className="mb-6 border-emerald-200/80 bg-emerald-50/60">
              <AlertTitle>Uso autorizado pela API atual</AlertTitle>
              <AlertDescription>
                Envio e leitura de histórico condicionadas a <code>send-sms</code> / <code>sms_logs</code> e permissões Supabase —
                igual à página <Link to="/app/mensagens" className="font-medium underline-offset-4 hover:underline">Mensagens</Link>.
              </AlertDescription>
            </Alert>
            <SmsChannelPanel variant="embedded" />
          </>
        )}

        {tab === 'sms' && !canUseSmsApi && (
          <Alert variant="warning">
            <AlertTitle>SMS sem permissão nesta conta</AlertTitle>
            <AlertDescription>
              Apenas papéis de equipe (admin, gestor, médico, secretaria) utilizam este canal conforme política atual do aplicativo e da API publicada.
            </AlertDescription>
          </Alert>
        )}

        {tab === 'push' && (
          <ComingSoonPane
            title="Push notifications"
            body={
              <>
                Centro de permissões browser, subscriptions e serviço push (FCM/APNs ou similar) devem coexistir na API antes de liberar dados reais aqui.
              </>
            }
          />
        )}

        {tab === 'email' && (
          <ComingSoonPane
            title="Alertas por e-mail"
            body={
              <>
                Fora dos fluxos de autenticação já existentes, ainda não há fila nem modelos institucionais de e‑mail —
                depende do backend e políticas da clínica.
              </>
            }
          />
        )}

        {tab === 'reminders' && (
          <ComingSoonPane
            title="Lembretes internos"
            body={
              <>
                Requer modelo no backend (prioridade, público-alvo e confirmação de leitura). UI pura sem API viraria cenário fantasioso —
                preferimos ficar só com placeholders até o modelo existir.
              </>
            }
          />
        )}
      </div>

      <aside className="mt-14 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 px-6 py-8 text-sm text-[var(--color-muted-foreground)] animate-fade-in-up-delay-2">
        <h2 className="font-display mb-2 text-[15px] font-medium text-[var(--color-foreground)]">
          Controle de acesso já coberto pela stack atual
        </h2>
        <p className="mb-4 leading-relaxed">
          Login com JWT Supabase; perfil e roles vindos dos endpoints já integrados nos guards de rota —
          registros tipo “log de atividades granular” ficam neste arquivo de backlog (copiar via botão no topo até evolução do produto).
        </p>
        <hr className="mb-4 border-[var(--color-border)]" />
        <p className="text-xs leading-relaxed opacity-95">
          <strong className="text-[var(--color-foreground)]">Backup · criptografia · LGPD institucional</strong>{' '}
          — página dedicada ao texto fixo jurídico em{' '}
          <Link to="/app/privacidade" className="font-medium text-[var(--color-accent)] underline-offset-4 hover:underline">
            Privacidade
          </Link>
          .
        </p>
      </aside>
    </div>
  )
}

function ComingSoonPane({
  title,
  body,
}: {
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 shadow-[12px_12px_0_0_var(--color-muted)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <h3 className="font-display text-xl italic text-[var(--color-foreground)]">{title}</h3>
        <span className="rounded border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          aguardando API
        </span>
      </div>
      <p className="max-w-[60ch] text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
      <Alert variant="default">
        <AlertTitle>Sem mock de dados falsos</AlertTitle>
        <AlertDescription>
          Quando os serviços de notificação forem disponibilizados no backend, substituímos este painel por telas funcionais usando o mesmo padrão de{' '}
          <code>@/lib/apiClient</code>.
        </AlertDescription>
      </Alert>
    </div>
  )
}

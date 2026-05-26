import { ArrowRight, Bell, Layers, Mail, Smartphone } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'


import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SmsChannelPanel } from '@/features/communications/components/SmsChannelPanel'
import { useHasRole } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'

type HubTabId = 'sms' | 'push' | 'email' | 'reminders'

const TABS: { id: HubTabId; label: string; icon: typeof Bell }[] = [
  { id: 'sms', label: 'SMS', icon: Smartphone },
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



  return (
    <div className="relative mx-auto max-w-[1100px]">

      <header className="relative mb-10 flex flex-col gap-5 border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-9 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
        <div
          aria-hidden="true"
          className="dot-pattern absolute inset-0 opacity-[0.14]"
        />
        <div className="relative flex max-w-xl flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            Configurações
          </p>
          <h1 className="font-display text-[2.35rem] font-medium leading-tight tracking-tight text-[var(--color-foreground)]">
            Segurança &amp; canais de aviso
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Configure os canais de comunicação e as preferências de segurança da sua conta corporativa.
          </p>
        </div>
        <div className="relative flex shrink-0 flex-col gap-2 sm:items-end">
          <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link to="/app/privacidade" className="inline-flex items-center gap-2">
              Privacidade e LGPD <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/90 text-[var(--color-accent)] font-semibold'
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
            <Alert variant="info" className="mb-6">
              <AlertTitle>Canal de SMS habilitado</AlertTitle>
              <AlertDescription>
                Envio e histórico de mensagens de texto SMS integrados à sua conta corporativa. O uso segue o mesmo fluxo da página de <Link to="/app/mensagens" className="font-medium underline-offset-4 hover:underline">Mensagens</Link>.
              </AlertDescription>
            </Alert>
            <SmsChannelPanel variant="embedded" />
          </>
        )}

        {tab === 'sms' && !canUseSmsApi && (
          <Alert variant="warning">
            <AlertTitle>SMS sem permissão nesta conta</AlertTitle>
            <AlertDescription>
              Apenas profissionais autorizados da equipe de saúde têm permissão para utilizar o canal de SMS.
            </AlertDescription>
          </Alert>
        )}

        {tab === 'push' && (
          <ComingSoonPane
            title="Notificações no navegador"
            body={
              <>
                As notificações diretamente no seu navegador serão disponibilizadas em breve. Você poderá autorizar o recebimento de alertas em tempo real sobre consultas e laudos.
              </>
            }
          />
        )}

        {tab === 'email' && (
          <ComingSoonPane
            title="Alertas por e-mail"
            body={
              <>
                As notificações e alertas por e-mail estão sendo preparadas pela equipe técnica. Em breve você poderá configurar o recebimento de avisos diretamente em sua caixa de entrada.
              </>
            }
          />
        )}

        {tab === 'reminders' && (
          <ComingSoonPane
            title="Lembretes internos"
            body={
              <>
                Avisos e lembretes internos dentro da plataforma. Esse recurso permitirá visualizar alertas importantes sobre suas atividades diretamente no painel do sistema.
              </>
            }
          />
        )}
      </div>

      <aside className="mt-14 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 px-6 py-8 text-sm text-[var(--color-muted-foreground)] animate-fade-in-up-delay-2">
        <h2 className="font-display mb-2 text-[15px] font-medium text-[var(--color-foreground)]">
          Segurança e controle de acesso integrado
        </h2>
        <p className="mb-4 leading-relaxed">
          O acesso ao sistema é protegido por criptografia moderna e controle rigoroso de permissões. Cada usuário visualiza apenas as informações autorizadas de acordo com o seu perfil profissional (médico, secretaria, gestor ou paciente).
        </p>
        <hr className="mb-4 border-[var(--color-border)]" />
        <p className="text-xs leading-relaxed opacity-95">
          <strong className="text-[var(--color-foreground)]">Privacidade e LGPD institucional</strong>{' '}
          — consulte as diretrizes jurídicas completas na página de{' '}
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
        <h3 className="font-display text-xl text-[var(--color-foreground)]">{title}</h3>
        <span className="rounded border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          em breve
        </span>
      </div>
      <p className="max-w-[60ch] text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
      <Alert variant="default">
        <AlertTitle>Funcionalidade em desenvolvimento</AlertTitle>
        <AlertDescription>
          Assim que o serviço de notificações for configurado para a sua clínica, este painel será substituído pelas telas definitivas de configuração.
        </AlertDescription>
      </Alert>
    </div>
  )
}

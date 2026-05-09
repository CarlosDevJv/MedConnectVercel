import { Loader2, MessageCircle, Send } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSmsServiceDisabled } from '@/features/communications/api'
import { useSendSmsMutation } from '@/features/communications/hooks'
import { toE164Preferred } from '@/features/communications/utils/phone'
import { cn } from '@/lib/cn'

const MSG_MAX = 1000

export type SmsChannelPanelVariant = 'standalone' | 'embedded'

interface SmsChannelPanelProps {
  variant?: SmsChannelPanelVariant
}

export function SmsChannelPanel({ variant = 'standalone' }: SmsChannelPanelProps) {
  const embedded = variant === 'embedded'

  const [phoneRaw, setPhoneRaw] = React.useState('')
  const [patientId, setPatientId] = React.useState('')
  const [message, setMessage] = React.useState('')

  const sendMutation = useSendSmsMutation()

  const charsLeft = MSG_MAX - message.length
  const phoneE164Preview = phoneRaw.trim() ? toE164Preferred(phoneRaw) : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const phone_number = toE164Preferred(phoneRaw)
    const digits = phone_number.replace(/\D/g, '')
    if (digits.length < 11) {
      toast.error('Telefone inválido', { description: 'Informe DDD + número (Brasil) ou E.164 completo (+…).' })
      return
    }
    if (!message.trim()) {
      toast.error('Mensagem vazia')
      return
    }
    const pid = patientId.trim()
    try {
      await sendMutation.mutateAsync({
        phone_number,
        message: message.slice(0, MSG_MAX),
        ...(pid ? { patient_id: pid } : {}),
      })
      toast.success('SMS enviado', { description: 'A operadora registrou o envio com sucesso.' })
      setMessage('')
    } catch (err) {
      if (isSmsServiceDisabled(err)) {
        toast.error('SMS indisponível', {
          description:
            'O serviço de envio está temporariamente desabilitado no servidor. Consulte o suporte técnico.',
        })
        return
      }
      const description = err instanceof Error ? err.message : 'Erro ao enviar.'
      toast.error('Falha no envio', { description })
    }
  }

  const formBlock = (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn(
        'relative flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)]',
        embedded
          ? 'bg-[var(--color-surface)] p-5'
          : 'bg-[var(--color-background)]/80 p-5 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm'
      )}
    >
      <div className="space-y-2">
        <Label htmlFor={embedded ? 'hub-sms-phone' : 'sms-phone'}>Destinatário (telefone)</Label>
        <Input
          id={embedded ? 'hub-sms-phone' : 'sms-phone'}
          autoComplete="tel"
          placeholder="(11) 98765-4321 ou +5511987654321"
          value={phoneRaw}
          onChange={(e) => setPhoneRaw(e.target.value)}
        />
        {phoneE164Preview.startsWith('+') && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Envio como{' '}
            <span className="font-medium text-[var(--color-foreground)]">{phoneE164Preview}</span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={embedded ? 'hub-sms-patient' : 'sms-patient'}>ID do paciente (opcional)</Label>
        <Input
          id={embedded ? 'hub-sms-patient' : 'sms-patient'}
          placeholder="UUID do paciente (opcional)"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={embedded ? 'hub-sms-body' : 'sms-body'}>Mensagem</Label>
        <textarea
          id={embedded ? 'hub-sms-body' : 'sms-body'}
          rows={5}
          maxLength={MSG_MAX}
          placeholder="Ex.: Lembrete: consulta amanhã às 14h na clínica."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(
            'w-full resize-y rounded-[10px] border bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-foreground)]',
            'border-[var(--color-border)] outline-none placeholder:text-[var(--color-muted-foreground)]/70',
            'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30',
            charsLeft < 0 && 'border-[var(--color-destructive)]'
          )}
        />
        <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
          <span>Máx. {MSG_MAX} caracteres.</span>
          <span aria-live="polite">{Math.max(charsLeft, 0)} restantes</span>
        </div>
      </div>
      <Button type="submit" size="lg" disabled={sendMutation.isPending}>
        {sendMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar SMS
          </>
        )}
      </Button>
    </form>
  )

  if (embedded) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 border-l-[3px] border-emerald-600/90 pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/90">Canal disponível</p>
          <h3 className="font-display text-xl font-medium italic text-[var(--color-foreground)]">SMS (Twilio)</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Envio de mensagens pela integração configurada pelo MediConnect (<code className="text-xs">send-sms</code>).
          </p>
        </div>
        {formBlock}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1150px] flex-col gap-10">
      <section
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]',
          'bg-[var(--color-surface)] px-6 py-8 sm:px-10 sm:py-10 animate-fade-in-up'
        )}
      >
        <div aria-hidden="true" className="dot-pattern pointer-events-none absolute inset-0 opacity-[0.22]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gradient-to-bl from-teal-200/50 via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] opacity-70 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                SMS · Twilio
              </span>
            </div>
            <h1 className="font-display text-[2.05rem] font-medium italic leading-[1.12] tracking-tight text-[var(--color-foreground)] sm:text-[2.35rem]">
              Canal de comunicação
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Envio de SMS para lembretes e comunicações rápidas. Histórico detalhado de disparos dependerá de recursos
              habilitados no ambiente da clínica.
            </p>
          </div>

          {formBlock}
        </div>
      </section>
    </div>
  )
}

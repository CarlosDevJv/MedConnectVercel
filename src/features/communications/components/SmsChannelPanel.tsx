import { AlertCircle, Loader2, MessageCircle, RefreshCcw, Send } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isSmsServiceDisabled } from '@/features/communications/api'
import { useSendSmsMutation, useSmsLogsQuery } from '@/features/communications/hooks'
import { toE164Preferred } from '@/features/communications/utils/phone'
import { formatDateTime } from '@/features/patients/utils/format'
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

  const logsQuery = useSmsLogsQuery(40)
  const sendMutation = useSendSmsMutation()

  const charsLeft = MSG_MAX - message.length
  const phoneE164Preview = phoneRaw.trim() ? toE164Preferred(phoneRaw) : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const phone_number = toE164Preferred(phoneRaw)
    const digits = phone_number.replace(/\D/g, '')
    if (digits.length < 11) {
      toast.error('Telefone inválido', { description: 'Informe DDD + número (Brasil) ou E.164 completo (+...).' })
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
            'O serviço de envio está temporariamente desabilitado no servidor (consulte o backend / Apidog).',
        })
        return
      }
      const description = err instanceof Error ? err.message : 'Erro ao enviar.'
      toast.error('Falha no envio', { description })
    }
  }

  const rows = logsQuery.data?.rows ?? []
  const logNote = logsQuery.data?.unavailableReason

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
          placeholder="UUID — para vincular ao prontuário"
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
          <span>Máx. {MSG_MAX} caracteres (contrato da API).</span>
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

  const historyBlock = (
    <section className="flex animate-fade-in-up-delay-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-[var(--color-foreground)]">
            Histórico recente
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Registros em <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-xs">sms_logs</code>{' '}
            quando habilitados no Supabase.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void logsQuery.refetch()}
          disabled={logsQuery.isFetching}
        >
          <RefreshCcw className={cn('mr-2 h-3.5 w-3.5', logsQuery.isFetching && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {logNote && (
        <Alert variant="warning" icon={<AlertCircle className="h-4 w-4" aria-hidden />}>
          <AlertTitle>Histórico não carregado</AlertTitle>
          <AlertDescription>{logNote}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[148px]">Quando</TableHead>
              <TableHead className="min-w-[120px]">Destino</TableHead>
              <TableHead className="w-[140px]">Paciente</TableHead>
              <TableHead>Texto / SID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm text-[var(--color-muted-foreground)]">
                  Carregando histórico…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm text-[var(--color-muted-foreground)]">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const rid = row.id != null ? String(row.id) : `row-${idx}`
                const when = row.created_at ? formatDateTime(String(row.created_at)) : '—'
                const phone = row.phone_number != null ? String(row.phone_number) : '—'
                const patient = row.patient_id != null ? String(row.patient_id).slice(0, 8) + '…' : '—'
                const snippet =
                  typeof row.message === 'string' ? row.message : (row.body as string | undefined) ?? '—'
                const sid =
                  typeof row.sid === 'string'
                    ? row.sid
                    : typeof row.twilio_sid === 'string'
                      ? row.twilio_sid
                      : null
                return (
                  <TableRow key={rid}>
                    <TableCell className="align-top text-xs text-[var(--color-muted-foreground)]">
                      {when}
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs">{phone}</TableCell>
                    <TableCell className="align-top font-mono text-xs">{patient}</TableCell>
                    <TableCell className="align-top text-sm">
                      <span className="line-clamp-2 text-[var(--color-foreground)]">{snippet}</span>
                      {sid && (
                        <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">SID · {sid}</p>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )

  if (embedded) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 border-l-[3px] border-emerald-600/90 pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800/90">Canal disponível · API</p>
          <h3 className="font-display text-xl font-medium italic text-[var(--color-foreground)]">SMS (Twilio)</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Único envio textual contratado hoje na documentação RiseUP/APidog (<code>/functions/v1/send-sms</code>).
            WhatsApp próprio ou e-mails transacionais exigem novos endpoints.
          </p>
        </div>
        {formBlock}
        {historyBlock}
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
        <div
          aria-hidden="true"
          className="dot-pattern pointer-events-none absolute inset-0 opacity-[0.22]"
        />
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
              Envio transacional via SMS (contrato RiseUP). WhatsApp dedicado e e-mails de laudo ainda não estão nesta API
              — use este módulo para lembretes e avisos textuais enquanto o backend evolui a doc operacional.
            </p>
          </div>

          {formBlock}
        </div>
      </section>

      {historyBlock}
    </div>
  )
}

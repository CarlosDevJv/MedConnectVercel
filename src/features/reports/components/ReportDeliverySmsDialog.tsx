import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSmsServiceDisabled } from '@/features/communications/api'
import { useSendSmsMutation } from '@/features/communications/hooks'
import { toE164Preferred } from '@/features/communications/utils/phone'
import { getPatient } from '@/features/patients/api'
import type { EnrichedReport } from '@/features/reports/types'
import { cn } from '@/lib/cn'

interface ReportDeliverySmsDialogProps {
  report: EnrichedReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function defaultSmsBody(report: EnrichedReport): string {
  const who = report.patient_name ?? 'Paciente'
  const ref = report.order_number ?? report.exam ?? 'laudo'
  return `Olá ${who}, seu laudo (${ref}) está disponível na plataforma MediConnect. Por favor acesse sua área do paciente.`
}

export function ReportDeliverySmsDialog({ report, open, onOpenChange }: ReportDeliverySmsDialogProps) {
  const sendMutation = useSendSmsMutation()
  const [phoneRaw, setPhoneRaw] = React.useState('')
  const [body, setBody] = React.useState('')
  const [loadingPatient, setLoadingPatient] = React.useState(false)

  React.useEffect(() => {
    if (!report || !open) return
    const r = report

    async function load() {
      setLoadingPatient(true)
      try {
        const patient = await getPatient(r.patient_id)
        setPhoneRaw(patient.phone_mobile ?? '')
      } catch {
        setPhoneRaw('')
        toast.error('Não foi possível obter o telefone do paciente.')
      } finally {
        setLoadingPatient(false)
      }
      setBody(defaultSmsBody(r))
    }

    void load()
  }, [report, open])

  async function submit() {
    if (!report) return
    const phone_number = toE164Preferred(phoneRaw)
    const digits = phone_number.replace(/\D/g, '')
    if (digits.length < 11) {
      toast.error('Informe um telefone válido com DDD.', { description: 'O número será normalizado para E.164 quando possível.' })
      return
    }
    if (!body.trim()) {
      toast.error('Mensagem vazia')
      return
    }
    try {
      await sendMutation.mutateAsync({
        phone_number,
        patient_id: report.patient_id,
        message: body.slice(0, 1000),
      })
      toast.success('SMS de aviso enviado.')
      onOpenChange(false)
    } catch (e) {
      if (isSmsServiceDisabled(e)) {
        toast.error('SMS indisponível no servidor.', {
          description: 'O envio está desabilitado no backend; veja documentação Apidog (503 service-disabled).',
        })
        return
      }
      toast.error('Falha ao enviar SMS', { description: e instanceof Error ? e.message : 'Erro.' })
    }
  }

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Protocolo de entrega (SMS)</DialogTitle>
          <DialogDescription>
            Envia aviso textual ao paciente usando o mesmo endpoint <code>/functions/v1/send-sms</code>. Para PDF por
            e-mail será necessário outro endpoint (doc 2.5).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="delivery-phone">Telefone do paciente</Label>
            <Input
              id="delivery-phone"
              autoComplete="tel"
              value={phoneRaw}
              disabled={loadingPatient}
              onChange={(e) => setPhoneRaw(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery-body">Mensagem</Label>
            <textarea
              id="delivery-body"
              rows={4}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={cn(
                'w-full resize-none rounded-[10px] border bg-[var(--color-surface)] px-3.5 py-3 text-sm',
                'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30'
              )}
            />
          </div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            Destino normalizado para envio:{' '}
            <span className="font-medium text-[var(--color-foreground)]">
              {phoneRaw.trim() ? toE164Preferred(phoneRaw) : '—'}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={sendMutation.isPending || loadingPatient}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              'Enviar SMS'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

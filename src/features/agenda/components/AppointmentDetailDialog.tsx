import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateAppointmentMutation } from '@/features/agenda/hooks'
import { APPOINTMENT_STATUS_LABELS, type EnrichedAppointment } from '@/features/agenda/types'

export interface AppointmentDetailDialogProps {
  appointment: EnrichedAppointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorName?: string
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  doctorName,
}: AppointmentDetailDialogProps) {
  const updateMut = useUpdateAppointmentMutation()

  async function handleCancel() {
    if (!appointment) return
    try {
      await updateMut.mutateAsync({ id: appointment.id, payload: { status: 'cancelled' } })
      toast.success('Agendamento cancelado.')
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível cancelar.')
    }
  }

  if (!appointment) return null

  const start = new Date(appointment.scheduled_at)
  const dur = appointment.duration_minutes ?? 30
  const end = new Date(start.getTime() + dur * 60_000)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Detalhes do agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-[var(--color-muted-foreground)]">Paciente:</span>{' '}
            <span className="font-medium">{appointment.patient_name}</span>
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Profissional:</span>{' '}
            <span className="font-medium">{doctorName ?? '—'}</span>
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Quando:</span>{' '}
            {start.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            – {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Status:</span>{' '}
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </p>
        </div>
        <DialogFooter>
          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              loading={updateMut.isPending}
              onClick={() => void handleCancel()}
            >
              Cancelar agendamento
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

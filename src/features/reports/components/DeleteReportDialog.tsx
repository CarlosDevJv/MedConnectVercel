import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteReportMutation } from '@/features/reports/hooks'
import type { EnrichedReport } from '@/features/reports/types'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

interface DeleteReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: EnrichedReport | null
  onDeleted?: (id: string) => void
}

export function DeleteReportDialog({
  open,
  onOpenChange,
  report,
  onDeleted,
}: DeleteReportDialogProps) {
  const mutation = useDeleteReportMutation()

  async function handleConfirm() {
    if (!report) return
    try {
      await mutation.mutateAsync(report.id)
      toast.success('Laudo excluído', {
        description: `O laudo número ${report.order_number || report.id.slice(0, 8)} foi removido com sucesso.`,
      })
      onOpenChange(false)
      onDeleted?.(report.id)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toastFromError(error, {
            permissionDescription: 'Você não tem permissão para excluir este laudo.',
          })
          return
        }
        if (error.status === 404) {
          toast.error('Laudo não encontrado', {
            description: 'O registro pode já ter sido removido do sistema.',
          })
          onOpenChange(false)
          onDeleted?.(report.id)
          return
        }
        toastFromError(error, { operationTitle: 'Erro ao excluir laudo' })
        return
      }
      toastFromError(error, {})
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return
        onOpenChange(next)
      }}
      title="Excluir laudo médico"
      description={
        report ? (
          <>
            Tem certeza que deseja excluir o laudo{' '}
            <strong className="text-[var(--color-foreground)]">
              {report.order_number || report.id.slice(0, 8)}
            </strong>{' '}
            do paciente <strong className="text-[var(--color-foreground)]">{report.patient_name}</strong>?
            <br />
            Esta ação é permanente e não poderá ser desfeita.
          </>
        ) : (
          'Selecione um laudo para excluir.'
        )
      }
      confirmLabel="Excluir laudo"
      cancelLabel="Cancelar"
      variant="destructive"
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  )
}

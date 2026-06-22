import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteDoctor } from '@/features/doctors/hooks'
import type { Doctor } from '@/features/doctors/types'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

interface DeleteDoctorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctor: Doctor | null
  onDeleted?: (id: string) => void
}

export function DeleteDoctorDialog({
  open,
  onOpenChange,
  doctor,
  onDeleted,
}: DeleteDoctorDialogProps) {
  const mutation = useDeleteDoctor()

  async function handleConfirm() {
    if (!doctor) return
    try {
      await mutation.mutateAsync(doctor.id)
      toast.success('Médico excluído', {
        description: `${doctor.full_name} foi removido(a) do sistema.`,
      })
      onOpenChange(false)
      onDeleted?.(doctor.id)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toastFromError(error, {
            permissionDescription: 'Você não tem permissão para excluir este médico.',
          })
          return
        }
        if (error.status === 404) {
          toast.error('Médico não encontrado', {
            description: 'O registro pode já ter sido removido.',
          })
          onOpenChange(false)
          onDeleted?.(doctor.id)
          return
        }
        if (error.status === 409) {
          toastFromError(error, {
            conflict: 'general',
            operationTitle: 'Não foi possível excluir',
          })
          return
        }
        toastFromError(error, { operationTitle: 'Erro ao excluir médico' })
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
      title="Excluir médico"
      description={
        doctor ? (
          <>
            Tem certeza que deseja excluir{' '}
            <strong className="text-[var(--color-foreground)]">{doctor.full_name}</strong>?
            <br />
            Essa ação não poderá ser desfeita.
          </>
        ) : (
          'Selecione um médico para excluir.'
        )
      }
      confirmLabel="Excluir médico"
      cancelLabel="Cancelar"
      variant="destructive"
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  )
}

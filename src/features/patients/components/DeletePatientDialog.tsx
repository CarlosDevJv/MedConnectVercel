import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeletePatient } from '@/features/patients/hooks'
import type { Patient } from '@/features/patients/types'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

interface DeletePatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onDeleted?: (id: string) => void
}

export function DeletePatientDialog({
  open,
  onOpenChange,
  patient,
  onDeleted,
}: DeletePatientDialogProps) {
  const mutation = useDeletePatient()

  async function handleConfirm() {
    if (!patient) return
    try {
      await mutation.mutateAsync(patient.id)
      toast.success('Paciente excluído', {
        description: `${patient.full_name} foi removido(a) do sistema.`,
      })
      onOpenChange(false)
      onDeleted?.(patient.id)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toastFromError(error, {
            permissionDescription: 'Você não tem permissão para excluir este paciente.',
          })
          return
        }
        if (error.status === 404) {
          toast.error('Paciente não encontrado', {
            description: 'O registro pode já ter sido removido.',
          })
          onOpenChange(false)
          onDeleted?.(patient.id)
          return
        }
        if (error.status === 409) {
          toastFromError(error, {
            conflict: 'general',
            operationTitle: 'Não foi possível excluir',
          })
          return
        }
        toastFromError(error, { operationTitle: 'Erro ao excluir paciente' })
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
      title="Excluir paciente"
      description={
        patient ? (
          <>
            Tem certeza que deseja excluir{' '}
            <strong className="text-[var(--color-foreground)]">{patient.full_name}</strong>?
            <br />
            Essa ação não poderá ser desfeita.
          </>
        ) : (
          'Selecione um paciente para excluir.'
        )
      }
      confirmLabel="Excluir paciente"
      cancelLabel="Cancelar"
      variant="destructive"
      loading={mutation.isPending}
      onConfirm={handleConfirm}
    />
  )
}

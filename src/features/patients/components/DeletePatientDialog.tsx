import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeletePatient } from '@/features/patients/hooks'
import type { Patient } from '@/features/patients/types'
import { ApiError } from '@/lib/apiClient'

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
          toast.error('Sem permissão', {
            description: 'Você não tem permissão para excluir este paciente.',
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
          toast.error('Não foi possível excluir', {
            description:
              error.message ||
              'Há registros relacionados (ex.: agendamentos) que impedem a exclusão.',
          })
          return
        }
        toast.error('Erro ao excluir paciente', {
          description: error.message || 'Tente novamente.',
        })
        return
      }
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
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

import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteDoctor } from '@/features/doctors/hooks'
import type { Doctor } from '@/features/doctors/types'
import { ApiError } from '@/lib/apiClient'

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
          toast.error('Sem permissão', {
            description: 'Você não tem permissão para excluir este médico.',
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
          toast.error('Não foi possível excluir', {
            description:
              error.message ||
              'Há registros relacionados (ex.: agendamentos) que impedem a exclusão.',
          })
          return
        }
        toast.error('Erro ao excluir médico', {
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

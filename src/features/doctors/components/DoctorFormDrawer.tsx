import * as React from 'react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DoctorForm,
  type DoctorFormHandle,
} from '@/features/doctors/components/DoctorForm'
import { useCreateDoctor, useUpdateDoctor } from '@/features/doctors/hooks'
import type {
  CreateDoctorValues,
  UpdateDoctorValues,
} from '@/features/doctors/schemas'
import type { Doctor } from '@/features/doctors/types'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

type Mode = { mode: 'create' } | { mode: 'edit'; doctor: Doctor }

export interface DoctorFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: Mode
  onCreated?: (doctorId?: string) => void
  onUpdated?: (doctor: Doctor) => void
}

export function DoctorFormDrawer({
  open,
  onOpenChange,
  state,
  onCreated,
  onUpdated,
}: DoctorFormDrawerProps) {
  const formRef = React.useRef<DoctorFormHandle>(null)

  const createMutation = useCreateDoctor()
  const updateMutation = useUpdateDoctor(state.mode === 'edit' ? state.doctor.id : '')

  const submitting = createMutation.isPending || updateMutation.isPending

  React.useEffect(() => {
    if (!open) {
      createMutation.reset()
      updateMutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleClose() {
    if (submitting) return
    onOpenChange(false)
  }

  async function handleCreate(values: CreateDoctorValues) {
    try {
      const response = await createMutation.mutateAsync({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        cpf: stripNonDigits(values.cpf),
        crm: stripNonDigits(values.crm),
        crm_uf: values.crm_uf.toUpperCase(),
        phone_mobile: values.phone_mobile ? stripNonDigits(values.phone_mobile) : undefined,
        specialty: values.specialty?.trim() || undefined,
        birth_date: values.birth_date || undefined,
      })
      toast.success('Médico cadastrado', {
        description: `${values.full_name.trim()} foi adicionado(a).`,
      })
      onOpenChange(false)
      onCreated?.(response.doctor_id)
    } catch (error) {
      handleApiError(error, 'create')
    }
  }

  async function handleUpdate(values: UpdateDoctorValues) {
    try {
      const updated = await updateMutation.mutateAsync({
        full_name: values.full_name.trim(),
        email: values.email?.trim() || null,
        crm: values.crm ? stripNonDigits(values.crm) : null,
        crm_uf: values.crm_uf ? values.crm_uf.toUpperCase() : null,
        phone_mobile: values.phone_mobile ? stripNonDigits(values.phone_mobile) : null,
        specialty: values.specialty?.trim() || null,
        birth_date: values.birth_date || null,
        active: values.active,
      })
      toast.success('Médico atualizado', {
        description: `As alterações em ${updated.full_name} foram salvas.`,
      })
      onOpenChange(false)
      onUpdated?.(updated)
    } catch (error) {
      handleApiError(error, 'update')
    }
  }

  function handleApiError(error: unknown, action: 'create' | 'update') {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        toastFromError(error, {
          permissionDescription: 'Você não tem permissão para realizar essa ação.',
        })
        return
      }

      if (error.status === 409) {
        if (error.code === 'CPF_EXISTS' || /cpf/i.test(error.message)) {
          formRef.current?.setFieldError('cpf', error.message || 'CPF já cadastrado.')
          return
        }
        if (error.code === 'EMAIL_EXISTS' || /email/i.test(error.message)) {
          formRef.current?.setFieldError('email', error.message || 'Email já cadastrado.')
          return
        }
        if (/crm/i.test(error.message)) {
          formRef.current?.setFieldError('crm', error.message || 'CRM já cadastrado.')
          return
        }
        toastFromError(error, { conflict: 'registration' })
        return
      }

      if (error.status === 400) {
        if (error.fieldErrors) {
          for (const [field, msgs] of Object.entries(error.fieldErrors)) {
            formRef.current?.setFieldError(
              field as keyof CreateDoctorValues | 'password',
              msgs.join(', ')
            )
          }
          return
        }
        toastFromError(error, {})
        return
      }

      toastFromError(error, {
        operationTitle: action === 'create' ? 'Erro ao cadastrar médico' : 'Erro ao atualizar médico',
      })
      return
    }

    toastFromError(error, {})
  }

  const isEdit = state.mode === 'edit'

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar médico' : 'Novo médico'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Atualize os dados do médico. CPF permanece fixo após o cadastro.'
              : 'Cadastre um novo médico no sistema. Campos com * são obrigatórios.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {state.mode === 'create' ? (
            <DoctorForm
              ref={formRef}
              mode="create"
              onSubmit={handleCreate}
              onCancel={handleClose}
              submitting={submitting}
            />
          ) : (
            <DoctorForm
              ref={formRef}
              mode="edit"
              doctor={state.doctor}
              onSubmit={handleUpdate}
              onCancel={handleClose}
              submitting={submitting}
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

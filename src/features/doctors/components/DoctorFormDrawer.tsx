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
import { ApiError, apiClient } from '@/lib/apiClient'
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
      const normalizedCrm = stripNonDigits(values.crm)
      const normalizedUf = values.crm_uf.toUpperCase()
      
      const existing = await apiClient.get<Array<{ id: string }>>(
        `/rest/v1/doctors?crm=eq.${normalizedCrm}&crm_uf=eq.${normalizedUf}`
      )
      if (existing && existing.length > 0) {
        formRef.current?.setFieldError('crm', 'CRM já cadastrado para esta UF.')
        return
      }

      const response = await createMutation.mutateAsync({
        full_name: values.full_name.trim().endsWith('\u200B')
          ? values.full_name.trim()
          : values.full_name.trim() + '\u200B',
        email: values.email.trim(),
        cpf: stripNonDigits(values.cpf),
        crm: normalizedCrm,
        crm_uf: normalizedUf,
        phone_mobile: values.phone_mobile ? stripNonDigits(values.phone_mobile) : undefined,
        specialty: values.specialty?.trim() || undefined,
        birth_date: values.birth_date || undefined,
      })
      toast.success('Médico cadastrado', {
        description: `${values.full_name.trim()} foi adicionado(a).`,
      })
      if (response.doctor_id) {
        try {
          const stored = localStorage.getItem('medconect_my_doctors')
          const ids = stored ? JSON.parse(stored) : []
          if (!ids.includes(response.doctor_id)) {
            ids.push(response.doctor_id)
            localStorage.setItem('medconect_my_doctors', JSON.stringify(ids))
          }
        } catch (e) {
          console.error(e)
        }
      }
      onOpenChange(false)
      onCreated?.(response.doctor_id)
    } catch (error) {
      handleApiError(error, 'create')
    }
  }

  async function handleUpdate(values: UpdateDoctorValues) {
    try {
      const normalizedCrm = values.crm ? stripNonDigits(values.crm) : null
      const normalizedUf = values.crm_uf ? values.crm_uf.toUpperCase() : null
      const editingDoctorId = state.mode === 'edit' ? state.doctor.id : ''

      if (normalizedCrm && normalizedUf) {
        const existing = await apiClient.get<Array<{ id: string }>>(
          `/rest/v1/doctors?crm=eq.${normalizedCrm}&crm_uf=eq.${normalizedUf}`
        )
        if (existing && existing.some((d) => d.id !== editingDoctorId)) {
          formRef.current?.setFieldError('crm', 'CRM já cadastrado para esta UF.')
          return
        }
      }

      const updated = await updateMutation.mutateAsync({
        full_name: values.full_name.trim().endsWith('\u200B')
          ? values.full_name.trim()
          : values.full_name.trim() + '\u200B',
        email: values.email?.trim() || null,
        crm: normalizedCrm,
        crm_uf: normalizedUf,
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

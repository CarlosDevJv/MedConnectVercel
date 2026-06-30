import { ArrowLeft } from 'lucide-react'
import * as React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import {
  DoctorForm,
  type DoctorFormHandle,
} from '@/features/doctors/components/DoctorForm'
import { useCreateDoctor } from '@/features/doctors/hooks'
import type { CreateDoctorValues, CreateDoctorWithPasswordValues } from '@/features/doctors/schemas'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { ApiError, apiClient } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

export function DoctorPasswordCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillData = location.state?.prefill
  const formRef = React.useRef<DoctorFormHandle>(null)
  const createMutation = useCreateDoctor()

  async function handleSubmit(values: CreateDoctorWithPasswordValues) {
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
        password: values.password,
        phone_mobile: values.phone_mobile ? stripNonDigits(values.phone_mobile) : undefined,
        specialty: values.specialty?.trim() || undefined,
        birth_date: values.birth_date || undefined,
      })
      toast.success('Médico cadastrado com senha', {
        description: `${values.full_name.trim()} já pode entrar na plataforma.`,
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
      if (response.doctor_id) {
        navigate(`/app/medicos/${response.doctor_id}`, { replace: true })
      } else {
        navigate('/app/medicos', { replace: true })
      }
    } catch (error) {
      handleDoctorCreatePasswordError(error, formRef)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/app/medicos')}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Admin • Médico
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Novo médico</h1>
        <p className="max-w-[640px] text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Preencha os dados abaixo com o CRM e a senha inicial do médico. O e-mail cadastrado será utilizado para acessar a plataforma.
        </p>
      </header>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <DoctorForm
          ref={formRef}
          mode="create"
          withPassword
          defaultValues={prefillData}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/app/medicos')}
          submitting={createMutation.isPending}
        />
      </section>
    </div>
  )
}

function handleDoctorCreatePasswordError(
  error: unknown,
  formRef: React.RefObject<DoctorFormHandle | null>
) {
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

    toastFromError(error, { operationTitle: 'Erro ao cadastrar médico' })
    return
  }

  toastFromError(error, {})
}

import { zodResolver } from '@hookform/resolvers/zod'
import { IdCard, KeyRound, Mail, Phone, User } from 'lucide-react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'
import { useCreateUserWithPassword } from '@/features/users/hooks'
import {
  createSecretariaUserWithPasswordSchema,
  type CreateSecretariaUserWithPasswordValues,
} from '@/features/users/schemas'
import { ApiError } from '@/lib/apiClient'
import { toastFromError } from '@/lib/apiErrorToast'

function mapApiValidationField(apiKey: string): keyof CreateSecretariaUserWithPasswordValues | null {
  const allowed: Partial<Record<string, keyof CreateSecretariaUserWithPasswordValues>> = {
    email: 'email',
    password: 'password',
    full_name: 'full_name',
    cpf: 'cpf',
    phone: 'phone',
    phone_mobile: 'phone',
  }
  const k = apiKey.trim()
  return allowed[k] ?? null
}

export function CreateUserWithPasswordForm() {
  const mutation = useCreateUserWithPassword()

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSecretariaUserWithPasswordValues>({
    resolver: zodResolver(createSecretariaUserWithPasswordSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      cpf: '',
      phone: '',
    },
  })

  const submit: SubmitHandler<CreateSecretariaUserWithPasswordValues> = async (values) => {
    try {
      const digitsPhone = stripNonDigits(values.phone ?? '')
      const response = await mutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        full_name: values.full_name.trim(),
        cpf: stripNonDigits(values.cpf),
        role: 'secretaria',
        ...(digitsPhone ? { phone: digitsPhone } : {}),
      })

      toast.success(response.message ?? 'Secretária cadastrada', {
        description: response.user?.email ?? undefined,
      })
      reset({
        full_name: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toastFromError(error, {
            permissionDescription:
              'Apenas perfis autorizados (admin/gestor conforme política da API) podem criar usuários.',
          })
          return
        }

        if (error.status === 409) {
          if (error.code === 'EMAIL_EXISTS' || /email/i.test(error.message)) {
            setError('email', { message: error.message || 'Email já cadastrado.' })
            return
          }
          if (/cpf/i.test(error.message)) {
            setError('cpf', { message: error.message })
            return
          }
          toastFromError(error, { conflict: 'registration' })
          return
        }

        if (error.status === 400) {
          if (error.fieldErrors) {
            let applied = false
            for (const [rawField, msgs] of Object.entries(error.fieldErrors)) {
              const mapped = mapApiValidationField(rawField)
              if (mapped) {
                setError(mapped, { message: msgs.join(', ') })
                applied = true
              }
            }
            if (applied) return
          }
          toastFromError(error, {})
          return
        }

        toastFromError(error, { operationTitle: 'Erro ao criar usuário' })
        return
      }

      toastFromError(error, {})
    }
  }

  const submitting = isSubmitting || mutation.isPending

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="new-user-name" required>
            Nome completo
          </Label>
          <Input
            id="new-user-name"
            autoComplete="name"
            placeholder="Maria Souza"
            leftIcon={<User className="h-4 w-4" />}
            invalid={!!errors.full_name}
            {...register('full_name')}
          />
          <FieldError message={errors.full_name?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-email" required>
            Email
          </Label>
          <Input
            id="new-user-email"
            type="email"
            autoComplete="email"
            placeholder="maria@clinica.com"
            leftIcon={<Mail className="h-4 w-4" />}
            invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-password" required>
            Senha inicial
          </Label>
          <Input
            id="new-user-password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            leftIcon={<KeyRound className="h-4 w-4" />}
            invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-cpf" required>
            CPF
          </Label>
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <Input
                id="new-user-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                leftIcon={<IdCard className="h-4 w-4" />}
                invalid={!!errors.cpf}
                maxLength={14}
                autoComplete="off"
                value={formatCpf(field.value ?? '')}
                onChange={(e) => field.onChange(formatCpf(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError message={errors.cpf?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-phone">Telefone (opcional)</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                id="new-user-phone"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
                invalid={!!errors.phone}
                value={formatPhone(field.value ?? '')}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                onBlur={field.onBlur}
                maxLength={16}
                ref={field.ref}
              />
            )}
          />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <Button type="submit" loading={submitting} className="self-end">
        {submitting ? 'Cadastrando...' : 'Cadastrar secretária'}
      </Button>
    </form>
  )
}

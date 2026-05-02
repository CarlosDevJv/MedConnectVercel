import { zodResolver } from '@hookform/resolvers/zod'
import { IdCard, KeyRound, Mail, Phone, User } from 'lucide-react'
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'
import { useCreateUserWithPassword } from '@/features/users/hooks'
import {
  ASSIGNABLE_CREATE_USER_ROLES,
  createUserWithPasswordSchema,
  type CreateUserWithPasswordValues,
} from '@/features/users/schemas'
import type { CreateUserWithPasswordAssignableRole } from '@/features/users/api'
import { ApiError } from '@/lib/apiClient'
import { ROLE_LABELS } from '@/types/user'

function mapApiValidationField(apiKey: string): keyof CreateUserWithPasswordValues | null {
  const k = apiKey.trim()
  if (k === 'roles' || k === 'role') return 'role'
  const allowed: Record<string, keyof CreateUserWithPasswordValues> = {
    email: 'email',
    password: 'password',
    full_name: 'full_name',
    cpf: 'cpf',
    phone: 'phone',
    create_patient_record: 'create_patient_record',
    phone_mobile: 'phone_mobile',
  }
  return allowed[k] ?? null
}

export function CreateUserWithPasswordForm() {
  const mutation = useCreateUserWithPassword()

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserWithPasswordValues>({
    resolver: zodResolver(createUserWithPasswordSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      cpf: '',
      phone: '',
      role: 'secretaria',
      create_patient_record: false,
      phone_mobile: '',
    },
  })

  const role = useWatch({ control, name: 'role' })
  const createPatientRecord = useWatch({ control, name: 'create_patient_record' })

  const submit: SubmitHandler<CreateUserWithPasswordValues> = async (values) => {
    try {
      const digitsPhone = stripNonDigits(values.phone ?? '')
      const payload = {
        email: values.email.trim(),
        password: values.password,
        full_name: values.full_name.trim(),
        cpf: stripNonDigits(values.cpf),
        role: values.role as CreateUserWithPasswordAssignableRole,
        ...(digitsPhone ? { phone: digitsPhone } : {}),
        ...(values.role === 'paciente' &&
        values.create_patient_record && {
          create_patient_record: true,
          phone_mobile: stripNonDigits(values.phone_mobile ?? ''),
        }),
      }

      const response = await mutation.mutateAsync(payload)

      toast.success(response.message ?? 'Usuário criado', {
        description:
          response.user?.email && response.patient_id
            ? `${response.user.email} — registro paciente ${response.patient_id}.`
            : response.user?.email && response.doctor_id
              ? `${response.user.email} — profissional ${response.doctor_id}.`
              : response.user?.email
                ? response.user.email
                : undefined,
      })
      reset({
        full_name: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
        phone_mobile: '',
        create_patient_record: false,
        role: values.role,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error('Sem permissão', {
            description:
              'Apenas perfis autorizados (admin/gestor/secretaria conforme política da API) podem criar usuários.',
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
          toast.error('Cadastro duplicado', { description: error.message })
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
          toast.error('Dados inválidos', {
            description: error.message ?? 'Revise os campos.',
          })
          return
        }

        toast.error('Erro ao criar usuário', {
          description: error.message || 'Tente novamente.',
        })
        return
      }

      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
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
            placeholder="João ou Maria da Silva"
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
            placeholder="usuario@clinica.com"
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

        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label required>Papel do usuário</Label>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  clearErrors(['phone_mobile', 'create_patient_record'])
                  if (v !== 'paciente') {
                    setValue('create_patient_record', false)
                    setValue('phone_mobile', '')
                  }
                  field.onChange(v as CreateUserWithPasswordValues['role'])
                }}
              >
                <SelectTrigger id="new-user-role" className="w-full" aria-label="Papel do usuário">
                  <SelectValue placeholder="Escolha o papel" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_CREATE_USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.role?.message} />
            </div>
          )}
        />

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

        {role === 'paciente' && (
          <div className="flex flex-col gap-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4 sm:col-span-2">
            <div className="flex gap-3">
              <Checkbox
                id="new-user-create-patient"
                checked={createPatientRecord}
                onCheckedChange={(v) => {
                  const next = v === true
                  setValue('create_patient_record', next)
                  if (!next) {
                    clearErrors('phone_mobile')
                    setValue('phone_mobile', '')
                  }
                }}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="new-user-create-patient" className="cursor-pointer font-medium">
                  Criar registro em Pacientes (patients)
                </Label>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Se marcar, informe o celular abaixo. O email será confirmado e o login fica
                  disponível na hora.
                </p>
              </div>
            </div>
            {createPatientRecord && (
              <Controller
                control={control}
                name="phone_mobile"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="new-user-phone-mobile" required>
                      Celular do paciente
                    </Label>
                    <Input
                      id="new-user-phone-mobile"
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 98888-7777"
                      leftIcon={<Phone className="h-4 w-4" />}
                      invalid={!!errors.phone_mobile}
                      value={formatPhone(field.value ?? '')}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      onBlur={field.onBlur}
                      maxLength={16}
                      ref={field.ref}
                    />
                    <FieldError message={errors.phone_mobile?.message} />
                  </div>
                )}
              />
            )}
          </div>
        )}
      </div>

      <Button type="submit" loading={submitting} className="self-end">
        {submitting ? 'Criando usuário...' : 'Criar usuário com senha'}
      </Button>
    </form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, IdCard, KeyRound, Mail, Phone, Stethoscope, User } from 'lucide-react'
import * as React from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
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
import {
  createDoctorSchema,
  createDoctorWithPasswordSchema,
  updateDoctorSchema,
  type CreateDoctorValues,
  type CreateDoctorWithPasswordValues,
  type UpdateDoctorValues,
} from '@/features/doctors/schemas'
import type { Doctor } from '@/features/doctors/types'
import { formatCpf } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'
import { stripNonDigits } from '@/features/patients/utils/cpf'
import { BRAZILIAN_STATES } from '@/features/patients/utils/uf'
import { cn } from '@/lib/cn'

type CreateProps =
  | {
      mode: 'create'
      withPassword?: false
      defaultValues?: Partial<CreateDoctorValues>
      onSubmit: SubmitHandler<CreateDoctorValues>
      onCancel: () => void
      submitting?: boolean
    }
  | {
      mode: 'create'
      withPassword: true
      defaultValues?: Partial<CreateDoctorWithPasswordValues>
      onSubmit: SubmitHandler<CreateDoctorWithPasswordValues>
      onCancel: () => void
      submitting?: boolean
    }

type EditProps = {
  mode: 'edit'
  doctor: Doctor
  onSubmit: SubmitHandler<UpdateDoctorValues>
  onCancel: () => void
  submitting?: boolean
}

export type DoctorFormProps = CreateProps | EditProps

export interface DoctorFormHandle {
  setFieldError: (
    field: keyof CreateDoctorValues | keyof UpdateDoctorValues | 'password',
    message: string
  ) => void
}

export const DoctorForm = React.forwardRef<DoctorFormHandle, DoctorFormProps>(
  function DoctorForm(props, ref) {
    if (props.mode === 'create') {
      return props.withPassword ? (
        <DoctorCreateFormWithPassword {...props} ref={ref} />
      ) : (
        <DoctorCreateFormPlain {...props} ref={ref} />
      )
    }
    return <DoctorEditForm {...props} ref={ref} />
  }
)
DoctorForm.displayName = 'DoctorForm'

type CreatePlainProps = Extract<CreateProps, { mode: 'create'; withPassword?: false }>

const DoctorCreateFormPlain = React.forwardRef<DoctorFormHandle, CreatePlainProps>(
  function DoctorCreateFormPlain({ defaultValues, onSubmit, onCancel, submitting }, ref) {
    const {
      register,
      handleSubmit,
      control,
      setError,
      formState: { errors },
    } = useForm<CreateDoctorValues>({
      resolver: zodResolver(createDoctorSchema),
      defaultValues: {
        full_name: defaultValues?.full_name ?? '',
        email: defaultValues?.email ?? '',
        cpf: defaultValues?.cpf ?? '',
        crm: defaultValues?.crm ?? '',
        crm_uf: defaultValues?.crm_uf ?? '',
        phone_mobile: defaultValues?.phone_mobile ?? '',
        specialty: defaultValues?.specialty ?? '',
        birth_date: defaultValues?.birth_date ?? '',
      },
    })

    React.useImperativeHandle(ref, () => ({
      setFieldError: (field, message) => {
        if (field === 'password') return
        setError(field as keyof CreateDoctorValues, { message })
      },
    }))

    return (
      <form
        id="doctor-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required error={errors.full_name?.message} className="sm:col-span-2">
            <Input
              id="full_name"
              autoComplete="name"
              placeholder="Dr. João Silva"
              leftIcon={<User className="h-4 w-4" />}
              invalid={!!errors.full_name}
              {...register('full_name')}
            />
          </Field>

          <Field label="Email" required error={errors.email?.message} className="sm:col-span-2">
            <Input
              id="doctor-email"
              type="email"
              autoComplete="email"
              placeholder="dr.joao@exemplo.com"
              leftIcon={<Mail className="h-4 w-4" />}
              invalid={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field label="CPF" required error={errors.cpf?.message}>
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <Input
                  id="doctor-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  leftIcon={<IdCard className="h-4 w-4" />}
                  invalid={!!errors.cpf}
                  value={formatCpf(field.value)}
                  onChange={(e) => field.onChange(formatCpf(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={14}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="Celular" error={errors.phone_mobile?.message}>
            <Controller
              control={control}
              name="phone_mobile"
              render={({ field }) => (
                <Input
                  id="doctor-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 99999-9999"
                  leftIcon={<Phone className="h-4 w-4" />}
                  invalid={!!errors.phone_mobile}
                  value={formatPhone(field.value ?? '')}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={16}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="CRM" required error={errors.crm?.message}>
            <Controller
              control={control}
              name="crm"
              render={({ field }) => (
                <Input
                  id="doctor-crm"
                  inputMode="numeric"
                  placeholder="123456"
                  leftIcon={<Stethoscope className="h-4 w-4" />}
                  invalid={!!errors.crm}
                  value={stripNonDigits(field.value ?? '').slice(0, 6)}
                  onChange={(e) => field.onChange(stripNonDigits(e.target.value).slice(0, 6))}
                  onBlur={field.onBlur}
                  maxLength={6}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="UF do CRM" required error={errors.crm_uf?.message}>
            <Controller
              control={control}
              name="crm_uf"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="UF do CRM">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Especialidade" error={errors.specialty?.message} className="sm:col-span-2">
            <Input
              id="doctor-specialty"
              placeholder="Ex: Cardiologia"
              leftIcon={<Stethoscope className="h-4 w-4" />}
              {...register('specialty')}
            />
          </Field>

          <Field label="Data de nascimento" error={errors.birth_date?.message} className="sm:col-span-2">
            <Input
              id="doctor-birth"
              type="date"
              autoComplete="bday"
              leftIcon={<Calendar className="h-4 w-4" />}
              invalid={!!errors.birth_date}
              {...register('birth_date')}
            />
          </Field>
        </div>

        <FormFooter
          onCancel={onCancel}
          submitting={submitting}
          idleSubmitLabel="Salvar"
          loadingSubmitLabel="Salvando..."
        />
      </form>
    )
  }
)
DoctorCreateFormPlain.displayName = 'DoctorCreateFormPlain'

type CreateWithPasswordProps = Extract<CreateProps, { mode: 'create'; withPassword: true }>

const DoctorCreateFormWithPassword = React.forwardRef<DoctorFormHandle, CreateWithPasswordProps>(
  function DoctorCreateFormWithPassword({ defaultValues, onSubmit, onCancel, submitting }, ref) {
    const {
      register,
      handleSubmit,
      control,
      setError,
      formState: { errors },
    } = useForm<CreateDoctorWithPasswordValues>({
      resolver: zodResolver(createDoctorWithPasswordSchema),
      defaultValues: {
        full_name: defaultValues?.full_name ?? '',
        email: defaultValues?.email ?? '',
        password: defaultValues?.password ?? '',
        cpf: defaultValues?.cpf ?? '',
        crm: defaultValues?.crm ?? '',
        crm_uf: defaultValues?.crm_uf ?? '',
        phone_mobile: defaultValues?.phone_mobile ?? '',
        specialty: defaultValues?.specialty ?? '',
        birth_date: defaultValues?.birth_date ?? '',
      },
    })

    React.useImperativeHandle(ref, () => ({
      setFieldError: (field, message) => {
        setError(field as keyof CreateDoctorWithPasswordValues, { message })
      },
    }))

    return (
      <form
        id="doctor-form-password"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-accent-soft)]/35 p-4 sm:col-span-2">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Acesso inicial
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" required error={errors.full_name?.message} className="sm:col-span-2">
              <Input
                id="doctor-pw-full_name"
                autoComplete="name"
                placeholder="Dr. João Silva"
                leftIcon={<User className="h-4 w-4" />}
                invalid={!!errors.full_name}
                {...register('full_name')}
              />
            </Field>

            <Field label="Email" required error={errors.email?.message}>
              <Input
                id="doctor-pw-email"
                type="email"
                autoComplete="email"
                placeholder="dr.joao@exemplo.com"
                leftIcon={<Mail className="h-4 w-4" />}
                invalid={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Field label="Senha inicial" required error={errors.password?.message}>
              <Input
                id="doctor-pw-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                leftIcon={<KeyRound className="h-4 w-4" />}
                invalid={!!errors.password}
                {...register('password')}
              />
            </Field>
          </div>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Profissional / CRM
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPF" required error={errors.cpf?.message}>
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <Input
                  id="doctor-pw-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  leftIcon={<IdCard className="h-4 w-4" />}
                  invalid={!!errors.cpf}
                  value={formatCpf(field.value)}
                  onChange={(e) => field.onChange(formatCpf(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={14}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="Celular" error={errors.phone_mobile?.message}>
            <Controller
              control={control}
              name="phone_mobile"
              render={({ field }) => (
                <Input
                  id="doctor-pw-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 99999-9999"
                  leftIcon={<Phone className="h-4 w-4" />}
                  invalid={!!errors.phone_mobile}
                  value={formatPhone(field.value ?? '')}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={16}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="CRM" required error={errors.crm?.message}>
            <Controller
              control={control}
              name="crm"
              render={({ field }) => (
                <Input
                  id="doctor-pw-crm"
                  inputMode="numeric"
                  placeholder="123456"
                  leftIcon={<Stethoscope className="h-4 w-4" />}
                  invalid={!!errors.crm}
                  value={stripNonDigits(field.value ?? '').slice(0, 6)}
                  onChange={(e) => field.onChange(stripNonDigits(e.target.value).slice(0, 6))}
                  onBlur={field.onBlur}
                  maxLength={6}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="UF do CRM" required error={errors.crm_uf?.message}>
            <Controller
              control={control}
              name="crm_uf"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="UF do CRM">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Especialidade" error={errors.specialty?.message} className="sm:col-span-2">
            <Input
              id="doctor-pw-specialty"
              placeholder="Ex: Cardiologia"
              leftIcon={<Stethoscope className="h-4 w-4" />}
              {...register('specialty')}
            />
          </Field>

          <Field label="Data de nascimento" error={errors.birth_date?.message} className="sm:col-span-2">
            <Input
              id="doctor-pw-birth"
              type="date"
              autoComplete="bday"
              leftIcon={<Calendar className="h-4 w-4" />}
              invalid={!!errors.birth_date}
              {...register('birth_date')}
            />
          </Field>
        </div>

        <FormFooter
          onCancel={onCancel}
          submitting={submitting}
          idleSubmitLabel="Criar médico com senha"
          loadingSubmitLabel="Criando..."
        />
      </form>
    )
  }
)
DoctorCreateFormWithPassword.displayName = 'DoctorCreateFormWithPassword'

const DoctorEditForm = React.forwardRef<DoctorFormHandle, EditProps>(
  function DoctorEditForm({ doctor, onSubmit, onCancel, submitting }, ref) {
    const {
      register,
      handleSubmit,
      control,
      setError,
      formState: { errors },
    } = useForm<UpdateDoctorValues>({
      resolver: zodResolver(updateDoctorSchema),
      defaultValues: {
        full_name: doctor.full_name,
        email: doctor.email ?? '',
        crm: doctor.crm,
        crm_uf: doctor.crm_uf,
        phone_mobile: doctor.phone_mobile ?? '',
        specialty: doctor.specialty ?? '',
        birth_date: doctor.birth_date ?? '',
        active: doctor.active ?? true,
      },
    })

    React.useImperativeHandle(ref, () => ({
      setFieldError: (field, message) => {
        if (field === 'cpf') return
        setError(field as keyof UpdateDoctorValues, { message })
      },
    }))

    return (
      <form
        id="doctor-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required error={errors.full_name?.message} className="sm:col-span-2">
            <Input
              id="full_name"
              autoComplete="name"
              leftIcon={<User className="h-4 w-4" />}
              invalid={!!errors.full_name}
              {...register('full_name')}
            />
          </Field>

          <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
            <Input
              id="doctor-email"
              type="email"
              leftIcon={<Mail className="h-4 w-4" />}
              invalid={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field label="CPF (imutável)" className="sm:col-span-1">
            <Input
              id="doctor-cpf"
              value={doctor.cpf ? formatCpf(doctor.cpf) : '—'}
              leftIcon={<IdCard className="h-4 w-4" />}
              disabled
              readOnly
            />
          </Field>

          <Field label="Celular" error={errors.phone_mobile?.message}>
            <Controller
              control={control}
              name="phone_mobile"
              render={({ field }) => (
                <Input
                  id="doctor-phone"
                  type="tel"
                  inputMode="numeric"
                  leftIcon={<Phone className="h-4 w-4" />}
                  invalid={!!errors.phone_mobile}
                  value={formatPhone(field.value ?? '')}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={16}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="CRM" error={errors.crm?.message}>
            <Controller
              control={control}
              name="crm"
              render={({ field }) => (
                <Input
                  id="doctor-crm"
                  inputMode="numeric"
                  leftIcon={<Stethoscope className="h-4 w-4" />}
                  invalid={!!errors.crm}
                  value={stripNonDigits(field.value ?? '').slice(0, 6)}
                  onChange={(e) => field.onChange(stripNonDigits(e.target.value).slice(0, 6))}
                  onBlur={field.onBlur}
                  maxLength={6}
                  ref={field.ref}
                />
              )}
            />
          </Field>

          <Field label="UF do CRM" error={errors.crm_uf?.message}>
            <Controller
              control={control}
              name="crm_uf"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.uf} value={s.uf}>
                        {s.uf} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Especialidade" error={errors.specialty?.message} className="sm:col-span-2">
            <Input
              id="doctor-specialty"
              leftIcon={<Stethoscope className="h-4 w-4" />}
              {...register('specialty')}
            />
          </Field>

          <Field label="Data de nascimento" error={errors.birth_date?.message} className="sm:col-span-2">
            <Input
              id="doctor-birth"
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              invalid={!!errors.birth_date}
              {...register('birth_date')}
            />
          </Field>
        </div>

        <FormFooter
          onCancel={onCancel}
          submitting={submitting}
          idleSubmitLabel="Salvar"
          loadingSubmitLabel="Salvando..."
        />
      </form>
    )
  }
)
DoctorEditForm.displayName = 'DoctorEditForm'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}

function Field({ label, required, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label required={required}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  )
}

function FormFooter({
  onCancel,
  submitting,
  idleSubmitLabel = 'Salvar',
  loadingSubmitLabel = 'Salvando...',
}: {
  onCancel: () => void
  submitting?: boolean
  idleSubmitLabel?: string
  loadingSubmitLabel?: string
}) {
  return (
    <div className="-mx-6 -mb-5 mt-2 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
        Cancelar
      </Button>
      <Button type="submit" loading={submitting}>
        {submitting ? loadingSubmitLabel : idleSubmitLabel}
      </Button>
    </div>
  )
}

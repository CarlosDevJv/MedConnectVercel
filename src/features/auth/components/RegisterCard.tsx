import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, User, IdCard, Phone } from 'lucide-react'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { registerPatientWithPassword } from '@/features/patients/api'
import { BrandWordmark } from '@/features/auth/components/BrandWordmark'
import { registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { formatPhone } from '@/features/patients/utils/phone'

export function RegisterCard() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      cpf: '',
      birth_date: '',
      phone_mobile: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: RegisterValues) {
    try {
      const payload = {
        full_name: values.full_name,
        cpf: stripNonDigits(values.cpf),
        birth_date: values.birth_date,
        phone_mobile: stripNonDigits(values.phone_mobile),
        email: values.email,
        password: values.password,
      }
      
      const response = await registerPatientWithPassword(payload)
      if (response.success === false) {
        throw new Error(response.message || 'Falha ao registrar.')
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Faça login com seu e-mail e senha para acessar o portal.',
      })
      navigate('/login', { replace: true })
    } catch (error: any) {
      toast.error('Erro no cadastro', {
        description: error.message || 'Verifique seus dados ou tente novamente.',
      })
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 text-center animate-fade-in-up">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
        >
          <span aria-hidden="true">&larr;</span> Voltar ao login
        </Link>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-9 py-8 shadow-[0_8px_30px_rgba(20,20,40,0.06)] animate-fade-in-up-delay-1">
        <div className="mb-6 text-center">
          <BrandWordmark size="lg" />
          <h2 className="mt-2 text-base font-semibold text-[var(--color-foreground)]">
            Criar conta de paciente
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <Label htmlFor="full_name" required>
              Nome completo
            </Label>
            <Input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome completo"
              leftIcon={<User className="h-4 w-4" />}
              invalid={!!errors.full_name}
              {...register('full_name')}
            />
            <FieldError id="full_name-error" message={errors.full_name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <Label htmlFor="cpf" required>
                CPF
              </Label>
              <Controller
                control={control}
                name="cpf"
                render={({ field }) => (
                  <Input
                    id="cpf"
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
              <FieldError id="cpf-error" message={errors.cpf?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="birth_date" required>
                Nascimento
              </Label>
              <Input
                id="birth_date"
                type="date"
                invalid={!!errors.birth_date}
                {...register('birth_date')}
              />
              <FieldError id="birth_date-error" message={errors.birth_date?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="phone_mobile" required>
              Celular
            </Label>
            <Controller
              control={control}
              name="phone_mobile"
              render={({ field }) => (
                <Input
                  id="phone_mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  leftIcon={<Phone className="h-4 w-4" />}
                  invalid={!!errors.phone_mobile}
                  value={formatPhone(field.value)}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  onBlur={field.onBlur}
                  maxLength={15}
                  ref={field.ref}
                />
              )}
            />
            <FieldError id="phone_mobile-error" message={errors.phone_mobile?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="exemplo@email.com"
              leftIcon={<Mail className="h-4 w-4" />}
              invalid={!!errors.email}
              {...register('email')}
            />
            <FieldError id="email-error" message={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="password" required>
              Senha
            </Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              leftIcon={<Lock className="h-4 w-4" />}
              invalid={!!errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />
            <FieldError id="password-error" message={errors.password?.message} />
          </div>

          <Button type="submit" fullWidth size="lg" loading={isSubmitting} className="mt-1.5">
            {isSubmitting ? 'Cadastrando...' : 'Criar minha conta'}
          </Button>

          <div className="mt-2 text-center text-sm text-[var(--color-muted-foreground)]">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-[var(--color-accent)] hover:underline">
              Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

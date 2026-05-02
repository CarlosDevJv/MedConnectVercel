import { z } from 'zod'

import { isValidCpf, stripNonDigits } from '@/features/patients/utils/cpf'

const phoneDigitsRegex = /^\d{10,11}$/

export const ASSIGNABLE_CREATE_USER_ROLES = ['secretaria', 'paciente', 'user'] as const

export type AssignableCreateUserRoleForm = (typeof ASSIGNABLE_CREATE_USER_ROLES)[number]

export const createUserWithPasswordSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(3, 'Mínimo de 3 caracteres')
      .max(120, 'Máximo de 120 caracteres'),
    email: z.string().min(1, 'Informe o email').email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    cpf: z
      .string()
      .min(1, 'Informe o CPF')
      .refine((value) => isValidCpf(value), 'CPF inválido'),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => !value || phoneDigitsRegex.test(stripNonDigits(value)),
        'Telefone deve ter 10 ou 11 dígitos'
      ),
    role: z.enum(ASSIGNABLE_CREATE_USER_ROLES, {
      message: 'Selecione um papel',
    }),
    create_patient_record: z.boolean(),
    phone_mobile: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value || phoneDigitsRegex.test(stripNonDigits(value ?? '')),
        'Celular deve ter 10 ou 11 dígitos'
      ),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'paciente' && data.create_patient_record) {
      const d = stripNonDigits(data.phone_mobile ?? '')
      if (!d || !phoneDigitsRegex.test(d)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o celular do paciente quando criar o registro em pacientes.',
          path: ['phone_mobile'],
        })
      }
    }
  })

export type CreateUserWithPasswordValues = z.infer<typeof createUserWithPasswordSchema>

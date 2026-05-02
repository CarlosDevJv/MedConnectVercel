import { z } from 'zod'

import { stripNonDigits } from '@/features/patients/utils/cpf'

const phoneRegex = /^\d{10,11}$/

export const inviteSecretariaSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(120, 'Máximo de 120 caracteres'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(stripNonDigits(value)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
})

export type InviteSecretariaValues = z.infer<typeof inviteSecretariaSchema>

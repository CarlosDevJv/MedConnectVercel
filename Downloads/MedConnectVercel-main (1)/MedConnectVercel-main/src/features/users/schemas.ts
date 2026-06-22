import { z } from 'zod'

import { isValidCpf, stripNonDigits } from '@/features/patients/utils/cpf'

const phoneDigitsRegex = /^\d{10,11}$/

/** Cadastro de secretária com senha (aba Secretárias; role fixo na API como `secretaria`). */
export const createSecretariaUserWithPasswordSchema = z.object({
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
})

export type CreateSecretariaUserWithPasswordValues = z.infer<typeof createSecretariaUserWithPasswordSchema>

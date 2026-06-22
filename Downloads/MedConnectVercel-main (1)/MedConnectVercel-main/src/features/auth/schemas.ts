import { z } from 'zod'
import { isValidCpf } from '@/features/patients/utils/cpf'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  remember: z.boolean().optional(),
})
export type LoginValues = z.infer<typeof loginSchema>

export const emailOnlySchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
})
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(255, 'Máximo de 255 caracteres')
    .refine((s) => !s.includes('@'), 'Informe um nome próprio; não use email no campo nome.'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => isValidCpf(v), 'CPF inválido'),
  birth_date: z
    .string()
    .min(1, 'Informe a data de nascimento')
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use o formato AAAA-MM-DD'),
  phone_mobile: z
    .string()
    .min(1, 'Informe o celular')
    .refine(
      (v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})
export type RegisterValues = z.infer<typeof registerSchema>


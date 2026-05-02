import { z } from 'zod'

import { isValidCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { VALID_UFS } from '@/features/patients/utils/uf'

const phoneRegex = /^\d{10,11}$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
const crmRegex = /^\d{4,6}$/

export const createDoctorSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(255, 'Máximo de 255 caracteres'),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => isValidCpf(v), 'CPF inválido'),
  crm: z
    .string()
    .min(1, 'Informe o CRM')
    .refine((v) => crmRegex.test(stripNonDigits(v)), 'CRM deve ter de 4 a 6 dígitos'),
  crm_uf: z
    .string()
    .min(1, 'Informe a UF do CRM')
    .refine((v) => VALID_UFS.includes(v.toUpperCase()), 'UF inválida'),
  phone_mobile: z
    .string()
    .optional()
    .refine(
      (v) => !v || phoneRegex.test(stripNonDigits(v)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  specialty: z.string().optional(),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || isoDateRegex.test(v), 'Data inválida (use AAAA-MM-DD)'),
})
export type CreateDoctorValues = z.infer<typeof createDoctorSchema>

/** Igual ao cadastro atual + senha inicial (Edge Function create-doctor com email/senha). */
export const createDoctorWithPasswordSchema = createDoctorSchema.extend({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})
export type CreateDoctorWithPasswordValues = z.infer<typeof createDoctorWithPasswordSchema>

export const updateDoctorSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(255, 'Máximo de 255 caracteres'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Email inválido'),
  crm: z
    .string()
    .optional()
    .refine((v) => !v || crmRegex.test(stripNonDigits(v)), 'CRM deve ter de 4 a 6 dígitos'),
  crm_uf: z
    .string()
    .optional()
    .refine(
      (v) => !v || VALID_UFS.includes(v.toUpperCase()),
      'UF inválida'
    ),
  phone_mobile: z
    .string()
    .optional()
    .refine(
      (v) => !v || phoneRegex.test(stripNonDigits(v)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  specialty: z.string().optional(),
  birth_date: z
    .string()
    .optional()
    .refine((v) => !v || isoDateRegex.test(v), 'Data inválida (use AAAA-MM-DD)'),
  active: z.boolean().optional(),
})
export type UpdateDoctorValues = z.infer<typeof updateDoctorSchema>

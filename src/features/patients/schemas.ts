import { z } from 'zod'

import { isValidCpf, stripNonDigits } from '@/features/patients/utils/cpf'
import { isValidCep } from '@/features/patients/utils/cep'
import { VALID_UFS } from '@/features/patients/utils/uf'
import {
  BLOOD_TYPE_OPTIONS,
  DOCUMENT_TYPES,
  MARITAL_STATUS_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  RACE_OPTIONS,
  SEX_OPTIONS,
} from '@/features/patients/types'

const optionalString = () =>
  z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : ''))

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((v) => (v ? v : ''))

const phoneRegex = /^\d{10,11}$/
const cpfDigitsRegex = /^\d{11}$/
const cepRegex = /^\d{8}$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

/**
 * Schema for the public auto-registration flow (kept compatible with the
 * existing edge function payload).
 */
export const registerPatientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(120, 'Máximo de 120 caracteres')
    .refine((s) => !s.includes('@'), 'Informe um nome próprio; não use email no campo nome.'),
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
  cpf: z
    .string()
    .min(1, 'Informe seu CPF')
    .refine((value) => isValidCpf(value), 'CPF inválido'),
  phone_mobile: z
    .string()
    .min(1, 'Informe seu telefone')
    .refine(
      (value) => phoneRegex.test(stripNonDigits(value)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  birth_date: z
    .string()
    .optional()
    .refine((value) => !value || isoDateRegex.test(value), 'Data inválida (use AAAA-MM-DD)'),
})

export type RegisterPatientValues = z.infer<typeof registerPatientSchema>

const baseFullSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Mínimo de 3 caracteres')
    .max(255, 'Máximo de 255 caracteres')
    .refine((s) => !s.includes('@'), 'Informe um nome próprio; não use email no campo nome.'),
  social_name: optionalString(),
  email: z.string().min(1, 'Informe o email').email('Email inválido'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((value) => isValidCpf(value), 'CPF inválido'),
  rg: optionalString(),
  document_type: optionalEnum(DOCUMENT_TYPES),
  document_number: optionalString(),
  birth_date: z
    .string()
    .optional()
    .refine((value) => !value || isoDateRegex.test(value), 'Data inválida (use AAAA-MM-DD)'),

  phone_mobile: z
    .string()
    .min(1, 'Informe o celular')
    .refine(
      (value) => phoneRegex.test(stripNonDigits(value)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  phone1: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(stripNonDigits(value)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  phone2: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(stripNonDigits(value)),
      'Telefone deve ter 10 ou 11 dígitos'
    ),

  preferred_contact: optionalEnum(PREFERRED_CONTACT_OPTIONS),

  sex: optionalEnum(SEX_OPTIONS),
  race: optionalEnum(RACE_OPTIONS),
  ethnicity: optionalString(),
  nationality: optionalString(),
  naturality: optionalString(),
  profession: optionalString(),
  marital_status: optionalEnum(MARITAL_STATUS_OPTIONS),

  mother_name: optionalString(),
  mother_profession: optionalString(),
  father_name: optionalString(),
  father_profession: optionalString(),
  guardian_name: optionalString(),
  guardian_cpf: z
    .string()
    .optional()
    .refine(
      (value) => !value || cpfDigitsRegex.test(stripNonDigits(value)),
      'CPF deve ter 11 dígitos'
    ),
  spouse_name: optionalString(),

  cep: z
    .string()
    .optional()
    .refine((value) => !value || isValidCep(value), 'CEP deve ter 8 dígitos'),
  street: optionalString(),
  number: optionalString(),
  complement: optionalString(),
  neighborhood: optionalString(),
  city: optionalString(),
  state: z
    .string()
    .optional()
    .refine(
      (value) => !value || (value.length === 2 && VALID_UFS.includes(value.toUpperCase())),
      'Selecione um estado válido'
    ),
  reference: optionalString(),

  blood_type: optionalEnum(BLOOD_TYPE_OPTIONS),
  weight_kg: z.string().optional(),
  height_m: z.string().optional(),
  notes: optionalString(),

  legacy_code: optionalString(),
  rn_in_insurance: z.boolean().optional(),
  vip: z.boolean().optional(),

  insurance_company: optionalString(),
  insurance_plan: optionalString(),
  insurance_member_number: optionalString(),
  insurance_card_valid_until: z
    .string()
    .optional()
    .refine(
      (value) => !value || isoDateRegex.test(value),
      'Validade inválida (use AAAA-MM-DD)'
    ),

  allergies: optionalString(),
  medications_in_use: optionalString(),
  chronic_conditions: optionalString(),
})

export const createPatientSchema = baseFullSchema
export type CreatePatientValues = z.infer<typeof createPatientSchema>

/** Edit form: excludes CPF (immutable) but keeps the rest editable. */
export const updatePatientSchema = baseFullSchema.extend({
  cpf: z.string().optional(),
})
export type UpdatePatientValues = z.infer<typeof updatePatientSchema>

export {
  cpfDigitsRegex,
  cepRegex,
  phoneRegex,
  isoDateRegex,
}

export {
  BLOOD_TYPE_OPTIONS,
  DOCUMENT_TYPES,
  MARITAL_STATUS_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  RACE_OPTIONS,
  SEX_OPTIONS,
} from '@/features/patients/types'

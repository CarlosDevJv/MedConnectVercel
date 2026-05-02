import { z } from 'zod'

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

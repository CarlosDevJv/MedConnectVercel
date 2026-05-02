import { apiClient } from '@/lib/apiClient'
import type { UserRole } from '@/types/user'

/** Papéis que admin/gestor pode atribuir (sem admin/gestor — evita escalação indevida). */
export type CreateUserWithPasswordAssignableRole = Extract<
  UserRole,
  'secretaria' | 'paciente' | 'user'
>

export interface CreateUserWithPasswordPayload {
  email: string
  password: string
  full_name: string
  /** Somente dígitos, 11 caracteres */
  cpf: string
  phone?: string
  role: CreateUserWithPasswordAssignableRole
  create_patient_record?: boolean
  phone_mobile?: string
}

export interface CreateUserWithPasswordCreatedUser {
  id: string
  email: string
  full_name: string
  roles: UserRole[]
  email_confirmed_at?: string | null
}

export interface CreateUserWithPasswordResponse {
  success?: boolean
  user?: CreateUserWithPasswordCreatedUser
  patient_id?: string | null
  /** Quando a API criar vínculo em `doctors` junto ao usuário médico. */
  doctor_id?: string | null
  message?: string
}

export async function createUserWithPassword(payload: CreateUserWithPasswordPayload) {
  const body: Record<string, unknown> = {
    email: payload.email.trim(),
    password: payload.password,
    full_name: payload.full_name.trim(),
    cpf: payload.cpf,
    role: payload.role,
  }
  if (payload.phone) {
    body.phone = payload.phone
  }
  if (payload.create_patient_record && payload.role === 'paciente') {
    body.create_patient_record = true
    if (payload.phone_mobile) body.phone_mobile = payload.phone_mobile
  }

  return apiClient.post<CreateUserWithPasswordResponse, Record<string, unknown>>(
    '/functions/v1/create-user-with-password',
    body
  )
}

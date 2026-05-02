import { getEnv } from '@/env'
import { apiClient } from '@/lib/apiClient'
import type { UserRole } from '@/types/user'

export interface InviteSecretariaPayload {
  email: string
  full_name: string
  phone?: string
  redirect_url?: string
}

interface CreateUserPayload extends InviteSecretariaPayload {
  role: UserRole
}

interface CreatedUser {
  id: string
  email: string
  full_name: string
  roles: UserRole[]
}

export interface InviteSecretariaResponse {
  success: boolean
  user?: CreatedUser
  message?: string
}

/**
 * Invite a secretary user. Uses POST /functions/v1/create-user with role=secretaria.
 * The endpoint sends a Magic Link to the provided email.
 */
export async function inviteSecretaria(payload: InviteSecretariaPayload) {
  const body: CreateUserPayload = {
    ...payload,
    role: 'secretaria',
    redirect_url: payload.redirect_url ?? `${getEnv().APP_URL}/app`,
  }
  return apiClient.post<InviteSecretariaResponse, CreateUserPayload>(
    '/functions/v1/create-user',
    body
  )
}

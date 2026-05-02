import { env } from '@/env'
import { apiClient } from '@/lib/apiClient'
import { getSupabase, setSessionPersistence } from '@/lib/supabase'
import type { UserInfo } from '@/types/user'

interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export async function loginWithPassword({ email, password, remember = true }: LoginPayload) {
  setSessionPersistence(remember)
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw error
}

interface ResetPasswordResponse {
  success: boolean
  message: string
}

export async function requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
  return apiClient.post<ResetPasswordResponse>(
    '/functions/v1/request-password-reset',
    {
      email,
      redirect_url: `${env.APP_URL}/reset-password`,
    },
    { anonymous: true }
  )
}

export async function getUserInfo(): Promise<UserInfo> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    return await apiClient.post<UserInfo>('/functions/v1/user-info', undefined, {
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

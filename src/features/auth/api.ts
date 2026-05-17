import { getEnv } from '@/env'
import { logoutSession } from '@/features/auth/logoutSession'
import { ApiError, apiClient } from '@/lib/apiClient'
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
  await logoutSession()
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
      redirect_url: `${getEnv().APP_URL}/reset-password`,
    },
    { anonymous: true }
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isTransientUserInfoFailure(error: unknown): boolean {
  if (error instanceof ApiError) {
    const { status } = error
    if (status >= 400 && status < 500 && status !== 429) return false
    return status >= 500 || status === 429
  }
  if (!(error instanceof Error)) return false
  if (error.name === 'AbortError') return true
  return /aborted|AbortError|timeout|NetworkError|Failed to fetch/i.test(error.message)
}

/** Edge `user-info` pode “acordar” com cold start; aumenta prazo e tenta de novo sem alterar o esquema SQL. */
export async function getUserInfo(): Promise<UserInfo> {
  const timeoutMs = 20_000
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await apiClient.post<UserInfo>('/functions/v1/user-info', undefined, {
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error
      if (attempt < 2 && isTransientUserInfoFailure(error)) {
        await sleep(550 * (attempt + 1))
        continue
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Não foi possível carregar perfil do usuário')
}

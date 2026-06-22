import { queryClient } from '@/lib/queryClient'
import { getSupabase } from '@/lib/supabase'

/** Encerra sessão Supabase (global), invalida cache React Query e limpa storages do browser. */
export async function logoutSession(): Promise<void> {
  const { error } = await getSupabase().auth.signOut({ scope: 'global' })
  if (error) throw error
  queryClient.clear()
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // ignore quota / privacy mode
    }
  }
}

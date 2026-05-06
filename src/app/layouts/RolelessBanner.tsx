import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getSupabase } from '@/lib/supabase'
import { useIsRoleless } from '@/features/auth/useAuth'

async function hardReconnect() {
  try {
    await getSupabase().auth.signOut({ scope: 'local' })
  } catch {
    // best-effort
  }
  localStorage.removeItem('mediconnect.auth')
  sessionStorage.removeItem('mediconnect.auth')
  window.location.assign('/login')
}

export function RolelessBanner() {
  const isRoleless = useIsRoleless()
  if (!isRoleless) return null

  return (
    <div className="border-b border-amber-200">
      <Alert
        variant="warning"
        className="rounded-none border-0 px-5 sm:px-8"
        icon={<TriangleAlert className="h-4 w-4" />}
      >
        <AlertTitle>Sua conta ainda não possui um papel atribuído</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>
            Se você acabou de receber acesso ou percebe que a sessão está desatualizada, reconecte a
            conta. Caso contrário, aguarde o administrador liberar suas permissões.
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void hardReconnect()}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              <RefreshCw className="h-3 w-3" />
              Reconectar conta
            </button>
          </span>
        </AlertDescription>
      </Alert>
    </div>
  )
}

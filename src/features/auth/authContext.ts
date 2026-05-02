import type { Session } from '@supabase/supabase-js'
import * as React from 'react'

import type { UserInfo } from '@/types/user'

export interface AuthDebugSnapshot {
  loadedAt: string
  session: {
    userId: string | null
    email: string | null
    appMetadata: Record<string, unknown> | null
    userMetadata: Record<string, unknown> | null
    accessTokenPayload: Record<string, unknown> | null
  } | null
  userInfoRemote:
    | { ok: true; raw: unknown }
    | { ok: false; error: { status?: number; message: string; raw: unknown } }
    | null
  hydratedUserInfo: UserInfo | null
}

export interface AuthContextValue {
  session: Session | null
  userInfo: UserInfo | null
  /** Terminou pelo menos uma rodada de enrich (JWT/API) nesta sessão; evita flicker roleless/dashboard antes do primeiro /user-info. */
  userEnrichmentSynced: boolean
  status: 'loading' | 'authenticated' | 'unauthenticated'
  refreshUserInfo: () => Promise<void>
  signOut: () => Promise<void>
  debug?: AuthDebugSnapshot | null
}

export const AuthContext = React.createContext<AuthContextValue | null>(null)

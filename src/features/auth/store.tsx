import type { Session } from '@supabase/supabase-js'
import * as React from 'react'

import { getUserInfo, signOut as apiSignOut } from '@/features/auth/api'
import {
  AuthContext,
  type AuthContextValue,
  type AuthDebugSnapshot,
} from '@/features/auth/authContext'
import {
  buildFallbackUserInfo,
  describeUserInfoError,
  hydrateUserInfo,
} from '@/features/auth/sessionFallback'
import { getSupabase } from '@/lib/supabase'

const IS_DEV = import.meta.env.DEV

declare global {
  interface Window {
    __mediconnectAuthDebug?: AuthDebugSnapshot
  }
}

function decodeJwtPayload(token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null
  if (typeof atob !== 'function') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function snapshotSession(sess: Session | null): AuthDebugSnapshot['session'] {
  if (!sess) return null
  return {
    userId: sess.user?.id ?? null,
    email: sess.user?.email ?? null,
    appMetadata: (sess.user?.app_metadata ?? null) as Record<string, unknown> | null,
    userMetadata: (sess.user?.user_metadata ?? null) as Record<string, unknown> | null,
    accessTokenPayload: decodeJwtPayload(sess.access_token),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [userInfo, setUserInfo] = React.useState<AuthContextValue['userInfo']>(null)
  const [userEnrichmentSynced, setUserEnrichmentSynced] = React.useState(false)
  const [status, setStatus] = React.useState<'loading' | 'authenticated' | 'unauthenticated'>(
    'loading'
  )
  const [debug, setDebug] = React.useState<AuthDebugSnapshot | null>(null)

  const loadUserInfo = React.useCallback(
    async (sess: Session | null, options?: { skipEnrichmentGate?: boolean }) => {
    if (!sess) {
      setUserInfo(null)
      setUserEnrichmentSynced(false)
      if (IS_DEV) {
        const snap: AuthDebugSnapshot = {
          loadedAt: new Date().toISOString(),
          session: null,
          userInfoRemote: null,
          hydratedUserInfo: null,
        }
        setDebug(snap)
        if (typeof window !== 'undefined') window.__mediconnectAuthDebug = snap
      }
      return
    }

    const optimistic = buildFallbackUserInfo(sess)
    setUserInfo(optimistic)
    if (!options?.skipEnrichmentGate) {
      setUserEnrichmentSynced(false)
    }

    let remoteSlot: AuthDebugSnapshot['userInfoRemote']
    let next: AuthContextValue['userInfo'] = optimistic
    try {
      const remote = await getUserInfo()
      next = hydrateUserInfo(remote, sess)
      remoteSlot = { ok: true, raw: remote }
    } catch (error) {
      const detail = describeUserInfoError(error)
      console.warn('[MediConnect] /user-info indisponível, usando fallback de sessão.', detail)
      remoteSlot = { ok: false, error: detail }
    }
    setUserInfo(next)
    setUserEnrichmentSynced(true)
    if (IS_DEV) {
      const snap: AuthDebugSnapshot = {
        loadedAt: new Date().toISOString(),
        session: snapshotSession(sess),
        userInfoRemote: remoteSlot,
        hydratedUserInfo: next,
      }
      setDebug(snap)
      if (typeof window !== 'undefined') window.__mediconnectAuthDebug = snap
      console.groupCollapsed('[MediConnect] Auth debug snapshot')
      console.log('session', snap.session)
      console.log('userInfoRemote', snap.userInfoRemote)
      console.log('hydratedUserInfo', snap.hydratedUserInfo)
      console.groupEnd()
    }
  },
  [])

  React.useEffect(() => {
    let active = true
    const supabase = getSupabase()

    void (async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()
      if (!active) return
      setSession(initialSession)
      // Set status immediately — do NOT wait for /user-info (which can cold-start for 10-15s)
      if (active) setStatus(initialSession ? 'authenticated' : 'unauthenticated')
      // Enrich userInfo in background; roles already available via JWT fallback
      void loadUserInfo(initialSession)
    })()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
      void loadUserInfo(nextSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [loadUserInfo])

  const refreshUserInfo = React.useCallback(async () => {
    await loadUserInfo(session, { skipEnrichmentGate: true })
  }, [loadUserInfo, session])

  const signOut = React.useCallback(async () => {
    await apiSignOut()
    setSession(null)
    setUserInfo(null)
    setUserEnrichmentSynced(false)
    setStatus('unauthenticated')
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      userInfo,
      userEnrichmentSynced,
      status,
      refreshUserInfo,
      signOut,
      debug,
    }),
    [session, userInfo, userEnrichmentSynced, status, refreshUserInfo, signOut, debug]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

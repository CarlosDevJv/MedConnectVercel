import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getEnv } from '@/env'

const STORAGE_KEY = 'mediconnect.auth'

interface MemoryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function buildStorage(remember: boolean): MemoryStorage {
  if (typeof window === 'undefined') {
    const map = new Map<string, string>()
    return {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
    }
  }
  return remember ? window.localStorage : window.sessionStorage
}

function migratePersistedSession(targetRemember: boolean) {
  if (typeof window === 'undefined') return
  const source = targetRemember ? window.sessionStorage : window.localStorage
  const target = targetRemember ? window.localStorage : window.sessionStorage
  const value = source.getItem(STORAGE_KEY)
  if (value) {
    target.setItem(STORAGE_KEY, value)
    source.removeItem(STORAGE_KEY)
  }
}

let currentRemember = true
let client: SupabaseClient | null = null

function createSupabaseClient(remember: boolean): SupabaseClient {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv()
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: buildStorage(remember),
      storageKey: STORAGE_KEY,
    },
  })
}

function ensureClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(currentRemember)
  }
  return client
}

export function getSupabase(): SupabaseClient {
  return ensureClient()
}

export function setSessionPersistence(remember: boolean) {
  if (remember === currentRemember) return
  migratePersistedSession(remember)
  currentRemember = remember
  client = createSupabaseClient(remember)
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(ensureClient(), prop, ensureClient())
  },
})

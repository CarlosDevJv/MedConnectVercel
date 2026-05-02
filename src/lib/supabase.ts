import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env'

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
let client: SupabaseClient = createSupabaseClient(currentRemember)

function createSupabaseClient(remember: boolean): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: buildStorage(remember),
      storageKey: STORAGE_KEY,
    },
  })
}

export function getSupabase(): SupabaseClient {
  return client
}

export function setSessionPersistence(remember: boolean) {
  if (remember === currentRemember) return
  migratePersistedSession(remember)
  currentRemember = remember
  client = createSupabaseClient(remember)
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(client, prop, client)
  },
})

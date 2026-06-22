export type EnvConfig = {
  readonly SUPABASE_URL: string
  readonly SUPABASE_ANON_KEY: string
  readonly APP_URL: string
}

let cached: EnvConfig | null = null

function readEnv(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_APP_URL'): string {
  const value = import.meta.env[key]
  if (!value) {
    if (key === 'VITE_APP_URL') {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
    throw new Error(
      `[MediConnect] Variável de ambiente ${key} não definida. Em produção (ex.: Vercel), cadastre em Project Settings → Environment Variables e gere um novo deploy.`
    )
  }
  return value.trim()
}

function validateSupabaseKey(anonKey: string) {
  if (!anonKey) {
    throw new Error(
      '[MediConnect] VITE_SUPABASE_ANON_KEY está vazio após remover espaços. O Supabase rejeitará chamadas sem o header apikey.'
    )
  }
  if (anonKey === 'sb_publishable_xxx') {
    throw new Error(
      '[MediConnect] Substitua VITE_SUPABASE_ANON_KEY pela chave real do projeto (Supabase → Settings → API → anon JWT ou Publishable key).'
    )
  }
}

/** Resolve e faz cache das variáveis (validação só na primeira chamada). */
export function getEnv(): EnvConfig {
  if (cached) return cached
  const SUPABASE_URL = readEnv('VITE_SUPABASE_URL')
  const SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY')
  validateSupabaseKey(SUPABASE_ANON_KEY)
  cached = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    APP_URL: readEnv('VITE_APP_URL'),
  }
  return cached
}

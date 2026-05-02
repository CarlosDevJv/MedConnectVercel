function readEnv(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY' | 'VITE_APP_URL'): string {
  const value = import.meta.env[key]
  if (!value) {
    if (key === 'VITE_APP_URL') {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
    throw new Error(
      `[MediConnect] Variável de ambiente ${key} não definida. Copie .env.example para .env.local (na pasta mediconnect/) e preencha as credenciais; reinicie o servidor após alterar.`
    )
  }
  return value.trim()
}

function validateSupabaseKey(anonKey: string) {
  if (!anonKey) {
    throw new Error(
      '[MediConnect] VITE_SUPABASE_ANON_KEY está vazio após remover espaços. O Supabase rejeitará chamadas sem o header apikey. Corrija o .env.local e reinicie o Vite.'
    )
  }
  /** Valor literal copiado de .env.example — não usar em runtime. */
  if (anonKey === 'sb_publishable_xxx') {
    throw new Error(
      '[MediConnect] Substitua VITE_SUPABASE_ANON_KEY pela chave real do projeto (Supabase → Settings → API → anon JWT ou Publishable key) e reinicie npm run dev.'
    )
  }
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY')
validateSupabaseKey(SUPABASE_ANON_KEY)

export const env = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_URL: readEnv('VITE_APP_URL'),
} as const

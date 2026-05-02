import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { getEnv } from '@/env'
import '@/styles/globals.css'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderConfigError(message: string) {
  const el = document.getElementById('root')
  if (!el) return
  el.innerHTML = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:42rem;margin:4rem auto;padding:0 1.5rem;line-height:1.55;color:#171717;">
      <h1 style="font-size:1.25rem;font-weight:600;margin:0 0 1rem;">Configuração do MediConnect</h1>
      <p style="color:#404040;margin:0 0 1rem;">A aplicação não iniciou porque faltam variáveis de ambiente ou há valor inválido.</p>
      <pre style="background:#f4f4f5;padding:1rem;border-radius:8px;overflow:auto;font-size:13px;white-space:pre-wrap;margin:0 0 1.25rem;">${escapeHtml(message)}</pre>
      <p style="color:#404040;margin:0"><strong>Vercel:</strong> Settings → Environment Variables → <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (Production e Preview, se usar). Depois: Redeploy.</p>
    </div>
  `
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('[MediConnect] Elemento #root não encontrado.')
}

let envOk = false
try {
  getEnv()
  envOk = true
} catch (error) {
  console.error('[MediConnect] Falha na configuração:', error)
  renderConfigError(error instanceof Error ? error.message : String(error))
}

if (envOk) {
  createRoot(root).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  )
}

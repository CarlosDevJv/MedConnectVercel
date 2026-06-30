import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function GlobalErrorBoundary() {
  const error = useRouteError()
  console.error('[GlobalErrorBoundary] Erro capturado:', error)

  let errorMessage = 'Ocorreu um erro inesperado ao carregar esta página.'
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 text-center">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-[var(--color-foreground)]">Algo deu errado</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Não foi possível exibir esta página devido a um erro interno.
        </p>
        <div className="mt-4 rounded-lg bg-[var(--color-surface-hover)] p-3 text-left font-mono text-xs text-[var(--color-destructive)] break-all max-h-32 overflow-y-auto">
          {errorMessage}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  )
}

import { AlertCircle, RefreshCcw, Users } from 'lucide-react'
import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { DeletePatientDialog } from '@/features/patients/components/DeletePatientDialog'
import { PatientsTable } from '@/features/patients/components/PatientsTable'
import { PatientsToolbar } from '@/features/patients/components/PatientsToolbar'
import { useListPatients } from '@/features/patients/hooks'
import type { Patient } from '@/features/patients/types'
import { useCanManagePatients } from '@/features/auth/useAuth'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

export function PatientsListPage() {
  const canManage = useCanManagePatients()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = React.useState(() => searchParams.get('q') ?? '')
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  const debouncedSearch = useDebouncedValue(search, 300)

  const qFromUrl = searchParams.get('q') ?? ''
  React.useEffect(() => {
    setSearch(qFromUrl)
  }, [qFromUrl])

  // React 19 pattern: reset page when filters change without using useEffect.
  const [prevDeps, setPrevDeps] = React.useState({
    debouncedSearch,
    pageSize,
  })
  if (prevDeps.debouncedSearch !== debouncedSearch || prevDeps.pageSize !== pageSize) {
    setPrevDeps({ debouncedSearch, pageSize })
    setPage(1)
  }

  const query = useListPatients({
    search: debouncedSearch,
    page,
    pageSize,
  })

  const [deleteTarget, setDeleteTarget] = React.useState<Patient | null>(null)

  function openCreate() {
    navigate('/app/pacientes/novo')
  }

  function openEdit(patient: Patient) {
    navigate(`/app/pacientes/${patient.id}/editar`)
  }

  function openDelete(patient: Patient) {
    setDeleteTarget(patient)
  }

  function closeDelete() {
    setDeleteTarget(null)
  }

  // Backward-compat: /app/pacientes?new=1 still opens the create form
  React.useEffect(() => {
    if (searchParams.get('new') === '1' && canManage) {
      openCreate()
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = query.data?.items ?? []
  const total = query.data?.total

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Cadastros
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Pacientes</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Gerencie os pacientes cadastrados no sistema. Busque, edite ou crie novos registros.
        </p>
      </header>

      <PatientsToolbar
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        total={total}
        loading={query.isLoading || query.isFetching}
        onCreate={openCreate}
        canCreate={canManage}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.isLoading && items.length === 0 ? (
        <EmptyState
          query={debouncedSearch}
          canCreate={canManage}
          onCreate={openCreate}
          onClearSearch={() => setSearch('')}
        />
      ) : (
        <PatientsTable
          patients={items}
          loading={query.isLoading}
          pageSize={pageSize}
          canMutate={canManage}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      {!query.isError && total !== undefined && total > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <DeletePatientDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) closeDelete()
        }}
        patient={deleteTarget}
      />
    </div>
  )
}

interface EmptyStateProps {
  query: string
  canCreate: boolean
  onCreate: () => void
  onClearSearch: () => void
}

function EmptyState({ query, canCreate, onCreate, onClearSearch }: EmptyStateProps) {
  const hasQuery = query.trim().length > 0
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Users className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg text-[var(--color-foreground)]">
          {hasQuery ? 'Nenhum paciente encontrado' : 'Sem pacientes cadastrados'}
        </h3>
        <p className="max-w-[420px] text-sm text-[var(--color-muted-foreground)]">
          {hasQuery
            ? `Não encontramos resultados para "${query}". Verifique a busca ou cadastre um novo paciente.`
            : 'Cadastre o primeiro paciente para começar a gerenciar a base.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hasQuery && (
          <Button type="button" variant="outline" onClick={onClearSearch}>
            Limpar busca
          </Button>
        )}
        {canCreate && (
          <Button type="button" onClick={onCreate}>
            Novo paciente
          </Button>
        )}
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-destructive)]/40 bg-red-50/40 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-[var(--color-destructive)]">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg text-[var(--color-foreground)]">
        Não conseguimos carregar a lista
      </h3>
      <p className="max-w-[420px] text-sm text-[var(--color-muted-foreground)]">
        Verifique sua conexão ou tente novamente em instantes.
      </p>
      <Button type="button" variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}

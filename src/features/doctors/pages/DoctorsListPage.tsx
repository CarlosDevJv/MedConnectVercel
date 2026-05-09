import { AlertCircle, RefreshCcw, Stethoscope } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { DeleteDoctorDialog } from '@/features/doctors/components/DeleteDoctorDialog'
import { DoctorFormDrawer } from '@/features/doctors/components/DoctorFormDrawer'
import { DoctorsTable } from '@/features/doctors/components/DoctorsTable'
import { DoctorsToolbar } from '@/features/doctors/components/DoctorsToolbar'
import { useListDoctors } from '@/features/doctors/hooks'
import type { Doctor } from '@/features/doctors/types'
import { useHasRole } from '@/features/auth/useAuth'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

/** Cadastro com senha inicial + CRM (`create-user-with-password`). */
const NEW_DOCTOR_HREF = '/app/admin/medico/novo_medico'

type DrawerState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; doctor: Doctor }

export function DoctorsListPage() {
  const canManage = useHasRole('admin', 'gestor')

  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  const debouncedSearch = useDebouncedValue(search, 300)

  // React 19 pattern: reset page when filters change without using useEffect.
  const [prevDeps, setPrevDeps] = React.useState({
    debouncedSearch,
    pageSize,
  })
  if (prevDeps.debouncedSearch !== debouncedSearch || prevDeps.pageSize !== pageSize) {
    setPrevDeps({ debouncedSearch, pageSize })
    setPage(1)
  }

  const query = useListDoctors({
    search: debouncedSearch,
    page,
    pageSize,
  })

  const [drawer, setDrawer] = React.useState<DrawerState>({ open: false })
  const [deleteTarget, setDeleteTarget] = React.useState<Doctor | null>(null)

  function openEdit(doctor: Doctor) {
    setDrawer({ open: true, mode: 'edit', doctor })
  }
  function closeDrawer() {
    setDrawer({ open: false })
  }
  function openDelete(doctor: Doctor) {
    setDeleteTarget(doctor)
  }
  function closeDelete() {
    setDeleteTarget(null)
  }

  const items = query.data?.items ?? []
  const total = query.data?.total

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Equipe
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">Médicos</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Lista da equipe: abra um médico para ajustar a disponibilidade na agenda. Cadastro novo e edições
          de ficha ficam restritos a admin e gestor.
        </p>
      </header>

      <DoctorsToolbar
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        total={total}
        loading={query.isLoading || query.isFetching}
        canCreate={canManage}
        newDoctorHref={NEW_DOCTOR_HREF}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.isLoading && items.length === 0 ? (
        <EmptyState
          query={debouncedSearch}
          canCreate={canManage}
          newDoctorHref={NEW_DOCTOR_HREF}
          onClearSearch={() => setSearch('')}
        />
      ) : (
        <DoctorsTable
          doctors={items}
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

      <DoctorFormDrawer
        open={drawer.open}
        onOpenChange={(next) => {
          if (!next) closeDrawer()
        }}
        state={drawer.open ? drawer : { mode: 'create' }}
      />

      <DeleteDoctorDialog
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) closeDelete()
        }}
        doctor={deleteTarget}
      />
    </div>
  )
}

interface EmptyStateProps {
  query: string
  canCreate: boolean
  newDoctorHref: string
  onClearSearch: () => void
}

function EmptyState({ query, canCreate, newDoctorHref, onClearSearch }: EmptyStateProps) {
  const hasQuery = query.trim().length > 0
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Stethoscope className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg text-[var(--color-foreground)]">
          {hasQuery ? 'Nenhum médico encontrado' : 'Sem médicos cadastrados'}
        </h3>
        <p className="max-w-[420px] text-sm text-[var(--color-muted-foreground)]">
          {hasQuery
            ? `Não encontramos resultados para "${query}". Verifique a busca ou cadastre um novo médico.`
            : 'Cadastre o primeiro médico para começar a montar a equipe.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hasQuery && (
          <Button type="button" variant="outline" onClick={onClearSearch}>
            Limpar busca
          </Button>
        )}
        {canCreate && (
          <Button type="button" asChild>
            <Link to={newDoctorHref}>Novo médico</Link>
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

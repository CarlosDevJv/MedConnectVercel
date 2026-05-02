import { ArrowLeft, Search, User } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateReportMutation } from '@/features/reports/hooks'
import { useListPatients } from '@/features/patients/hooks'
import type { Patient } from '@/features/patients/types'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

export function ReportNewPage() {
  const navigate = useNavigate()
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search, 320)

  const patientsQuery = useListPatients({
    search: debounced,
    page: 1,
    pageSize: 15,
  })

  const createMutation = useCreateReportMutation()

  function selectPatient(p: Patient) {
    createMutation.mutate(
      { patient_id: p.id, status: 'draft' },
      {
        onSuccess: (report) => {
          toast.success('Rascunho criado. Continue editando o laudo.')
          navigate(`/app/relatorios/${report.id}/editar`, { replace: true })
        },
        onError: () => {
          toast.error('Não foi possível criar o relatório.')
        },
      }
    )
  }

  const items = patientsQuery.data?.items ?? []

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <Button
        type="button"
        variant="ghost"
        className="w-fit gap-2 px-2 text-[var(--color-muted-foreground)]"
        onClick={() => navigate('/app/relatorios')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à lista
      </Button>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Novo relatório
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Escolher paciente</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Busque pelo nome ou CPF e selecione o paciente para abrir o editor de laudo.
        </p>
      </header>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Nome ou CPF"
        leftIcon={<Search className="h-4 w-4 shrink-0 opacity-70" />}
        autoFocus
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {patientsQuery.isLoading ? (
          <ul className="divide-y divide-[var(--color-border)] p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : patientsQuery.isError ? (
          <p className="p-6 text-center text-sm text-[var(--color-destructive)]">
            Não foi possível carregar pacientes.
          </p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            Nenhum paciente encontrado. Ajuste a busca.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => selectPatient(p)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-accent-soft)]/50 disabled:opacity-50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-foreground)]">{p.full_name}</p>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      {p.cpf ? `CPF ${p.cpf}` : p.email ?? '—'}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

import { Search, UserPlus, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PatientsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  total: number | undefined
  loading: boolean
  onCreate: () => void
  canCreate: boolean
}

const PAGE_SIZES = [10, 20, 50]

export function PatientsToolbar({
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  total,
  loading,
  onCreate,
  canCreate,
}: PatientsToolbarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightSlot={
            search ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  onSearchChange('')
                  inputRef.current?.focus()
                }}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
          className="max-w-sm"
        />
        <span
          className="hidden text-sm text-[var(--color-muted-foreground)] sm:inline-block"
          aria-live="polite"
        >
          {loading
            ? 'Carregando...'
            : total !== undefined
              ? `${total.toLocaleString('pt-BR')} ${total === 1 ? 'paciente' : 'pacientes'}`
              : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline-block">
            Por página
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreate && (
          <Button type="button" onClick={onCreate}>
            <UserPlus className="h-4 w-4" />
            Novo paciente
          </Button>
        )}
      </div>
    </div>
  )
}

import { KeyRound, Search, Stethoscope, X } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DoctorsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  total: number | undefined
  loading: boolean
  onCreate: () => void
  canCreate: boolean
  /** Rota cadastro médico + senha + CRM (admin/gestor). */
  createWithPasswordHref?: string
}

const PAGE_SIZES = [10, 20, 50]

export function DoctorsToolbar({
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  total,
  loading,
  onCreate,
  canCreate,
  createWithPasswordHref,
}: DoctorsToolbarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder="Buscar por nome..."
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
              ? `${total.toLocaleString('pt-BR')} ${total === 1 ? 'médico' : 'médicos'}`
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

        {canCreate && createWithPasswordHref && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-[var(--color-foreground)]/25 bg-[var(--color-muted)]/50 font-semibold text-[var(--color-foreground)] shadow-sm hover:bg-[var(--color-muted)]"
                asChild
              >
                <Link to={createWithPasswordHref}>
                  <KeyRound className="h-4 w-4" />
                  Senha + CRM
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
              Cadastro alternativo: define senha inicial e dados de CRM no mesmo fluxo (Edge Function{' '}
              <span className="font-mono">create-user-with-password</span> com perfil médico, conforme RiseUP /
              Apidog).
            </TooltipContent>
          </Tooltip>
        )}
        {canCreate && (
          <Button type="button" onClick={onCreate}>
            <Stethoscope className="h-4 w-4" />
            Novo médico
          </Button>
        )}
      </div>
    </div>
  )
}

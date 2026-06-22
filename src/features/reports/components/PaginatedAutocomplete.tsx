import * as React from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface AutocompleteItem {
  id: string
  label: string
}

interface PaginatedAutocompleteProps {
  id: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  items: AutocompleteItem[]
  className?: string
}

export function PaginatedAutocomplete({
  id,
  placeholder,
  value,
  onChange,
  items,
  className,
}: PaginatedAutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState(value)
  const [currentPage, setCurrentPage] = React.useState(1)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Sincroniza o search com o value inicial ou alterações de fora
  React.useEffect(() => {
    setSearch(value)
  }, [value])

  // Fecha o menu flutuante ao clicar fora do componente
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // Restaura o valor original do input caso não tenha selecionado nada
        setSearch(value)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  // Filtra os itens com base no termo digitado
  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items
    const query = search.toLowerCase()
    return items.filter(
      (item) =>
        item.id.toLowerCase().includes(query) || item.label.toLowerCase().includes(query)
    )
  }, [items, search])

  // Reseta para a página 1 quando o filtro muda
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search])

  // Paginação: 5 itens por página
  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  
  // Garante que a página atual não ultrapasse o total de páginas
  const activePage = Math.min(currentPage, totalPages)

  const paginatedItems = React.useMemo(() => {
    const start = (activePage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, activePage])

  function handleSelect(item: AutocompleteItem) {
    onChange(item.id)
    setSearch(item.id)
    setIsOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    onChange(val) // Permite salvar o texto livre que o usuário está digitando
    setIsOpen(true)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'h-11 w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-3.5 text-sm',
            'text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30',
            'transition-all duration-200'
          )}
          autoComplete="off"
        />
        <Search className="absolute left-3.5 h-4 w-4 text-[var(--color-muted-foreground)] pointer-events-none" />
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg',
            'animate-in fade-in slide-in-from-top-1 duration-150'
          )}
        >
          {paginatedItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--color-muted-foreground)]">
              Nenhuma correspondência encontrada
            </div>
          ) : (
            <div className="flex flex-col p-1.5">
              <ul className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
                {paginatedItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'flex w-full items-center rounded-md px-3.5 py-2.5 text-left text-sm',
                        'hover:bg-[var(--color-muted)] transition-colors',
                        value === item.id && 'bg-[var(--color-accent-soft)]/50 text-[var(--color-accent)] font-medium'
                      )}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-1.5 flex items-center justify-between border-t border-[var(--color-border)] px-2.5 pt-2 pb-1">
                  <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
                    Página {activePage} de {totalPages} ({filteredItems.length} itens)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)]',
                        'text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-40 disabled:hover:bg-transparent'
                      )}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)]',
                        'text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-40 disabled:hover:bg-transparent'
                      )}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Doctor } from '@/features/doctors/types'
import { formatPatientPhone } from '@/features/patients/utils/format'

interface DoctorsTableProps {
  doctors: Doctor[]
  loading: boolean
  pageSize: number
  canMutate: boolean
  onEdit: (doctor: Doctor) => void
  onDelete: (doctor: Doctor) => void
}

export function DoctorsTable({
  doctors,
  loading,
  pageSize,
  canMutate,
  onEdit,
  onDelete,
}: DoctorsTableProps) {
  const navigate = useNavigate()

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Médico</TableHead>
            <TableHead className="hidden md:table-cell">CRM</TableHead>
            <TableHead className="hidden lg:table-cell">Especialidade</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            <TableHead className="hidden xl:table-cell">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: Math.min(pageSize, 6) }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} className="hover:bg-transparent">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3.5 w-24" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-3.5 w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-3.5 w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : doctors.map((doctor) => (
                <TableRow
                  key={doctor.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/app/medicos/${doctor.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={doctor.full_name} size="md" />
                      <div className="min-w-0 flex-col">
                        <p className="truncate font-medium text-[var(--color-foreground)]">
                          {doctor.full_name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                          {doctor.email || '—'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">
                    {doctor.crm}/{doctor.crm_uf}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[var(--color-muted-foreground)]">
                    {doctor.specialty || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[var(--color-muted-foreground)]">
                    {formatPatientPhone(doctor.phone_mobile)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {doctor.active === false ? (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                        Inativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex justify-end gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Ver detalhes"
                            onClick={() => navigate(`/app/medicos/${doctor.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>

                      {canMutate && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Editar médico"
                                onClick={() => onEdit(doctor)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Excluir médico"
                                onClick={() => onDelete(doctor)}
                                className="text-[var(--color-destructive)] hover:bg-red-50 hover:text-[var(--color-destructive)]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

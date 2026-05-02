import * as React from 'react'

import { cn } from '@/lib/cn'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('animate-pulse rounded-md bg-[var(--color-muted)]', className)}
      {...props}
    />
  )
)
Skeleton.displayName = 'Skeleton'

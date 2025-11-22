import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

/**
 * Responsive Table Wrapper
 *
 * Wraps tables in a horizontally scrollable container on mobile
 * Ensures tables don't break layout on small screens
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  )
}

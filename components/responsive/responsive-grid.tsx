import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    mobile?: 1 | 2
    tablet?: 1 | 2 | 3 | 4
    desktop?: 1 | 2 | 3 | 4 | 5 | 6
  }
  gap?: 'sm' | 'md' | 'lg'
}

/**
 * Responsive Grid Component
 *
 * Mobile-first responsive grid with sensible defaults
 * Defaults: 1 col on mobile, 2 on tablet, 3 on desktop
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  }

  const mobileColClass = cols.mobile ? `grid-cols-${cols.mobile}` : 'grid-cols-1'
  const tabletColClass = cols.tablet ? `md:grid-cols-${cols.tablet}` : 'md:grid-cols-2'
  const desktopColClass = cols.desktop ? `lg:grid-cols-${cols.desktop}` : 'lg:grid-cols-3'

  return (
    <div
      className={cn(
        'grid',
        mobileColClass,
        tabletColClass,
        desktopColClass,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

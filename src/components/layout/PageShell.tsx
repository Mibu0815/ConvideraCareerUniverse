import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  className?: string
  /**
   * 'full'    — edge-to-edge (dashboard-style, 1400px max)
   * 'content' — narrower reading width (1200px max)
   * 'narrow'  — settings, forms (720px max)
   */
  width?: 'full' | 'content' | 'narrow'
  /**
   * Dark canvas background variant — use for admin zones or statement pages.
   */
  tone?: 'default' | 'dark'
}

const WIDTH_CLASS: Record<NonNullable<PageShellProps['width']>, string> = {
  full: 'max-w-page',
  content: 'max-w-content',
  narrow: 'max-w-narrow',
}

export function PageShell({
  children,
  className,
  width = 'full',
  tone = 'default',
}: PageShellProps) {
  const bgClass = tone === 'dark'
    ? 'bg-canvas-dark text-text-inverse'
    : 'bg-canvas text-text-primary'

  return (
    <div className={cn('min-h-screen', bgClass)}>
      <div
        className={cn(
          'mx-auto px-4 md:px-6 lg:px-8',
          WIDTH_CLASS[width],
          'pt-[calc(var(--nav-height)+24px)] pb-16',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

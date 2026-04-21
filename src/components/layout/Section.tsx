import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  divider?: boolean
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  divider,
}: SectionProps) {
  return (
    <section
      className={cn(
        'mb-12',
        divider && 'pt-12 border-t border-divider',
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-h2 text-text-primary">{title}</h2>}
            {description && (
              <p className="text-body text-text-secondary mt-2">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

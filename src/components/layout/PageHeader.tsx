import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  accent?: boolean
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  accent,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-10 flex items-start justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-caption uppercase text-text-muted mb-3 flex items-center gap-2">
            {accent && <span className="h-2 w-2 rounded-pill bg-brand-dot" />}
            {eyebrow}
          </p>
        )}
        <h1 className="text-h1 text-text-primary">{title}</h1>
        {description && (
          <p className="text-body-l text-text-secondary mt-3 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  )
}

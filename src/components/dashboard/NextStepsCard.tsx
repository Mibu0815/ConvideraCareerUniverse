import Link from 'next/link'
import { Play, PenSquare, Clock, Award, Users, ArrowRight } from 'lucide-react'
import { Card, Button } from '@/components/layout'
import type { NextStep } from '@/lib/services/dashboard'

const ICONS = {
  play: Play,
  pen: PenSquare,
  clock: Clock,
  award: Award,
  users: Users,
} as const

interface NextStepsCardProps {
  steps: NextStep[]
}

export function NextStepsCard({ steps }: NextStepsCardProps) {
  const primary = steps.find(s => s.priority === 'primary')
  if (!primary) return null

  const PrimaryIcon = ICONS[primary.icon]
  const secondary = steps.filter(s => s !== primary).slice(0, 3)

  return (
    <Card variant="default">
      <p className="text-caption uppercase text-text-muted mb-3">Nächster Schritt</p>

      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-md bg-brand-blue-subtle flex items-center justify-center shrink-0">
          <PrimaryIcon className="h-5 w-5 text-brand-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-text-primary">{primary.label}</p>
          {primary.description && (
            <p className="text-body-s text-text-secondary mt-0.5">{primary.description}</p>
          )}
        </div>
      </div>

      <Link href={primary.href} className="block mb-6">
        <Button variant="primary" fullWidth iconRight={<ArrowRight className="h-4 w-4" />}>
          Los geht&apos;s
        </Button>
      </Link>

      {secondary.length > 0 && (
        <>
          <p className="text-caption uppercase text-text-muted mb-2">Andere Möglichkeiten heute</p>
          <div className="space-y-1">
            {secondary.map(step => {
              const Icon = ICONS[step.icon]
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-surface-soft transition-colors group"
                >
                  <Icon className="h-4 w-4 text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-s text-text-primary">{step.label}</p>
                    {step.description && (
                      <p className="text-caption text-text-muted">{step.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

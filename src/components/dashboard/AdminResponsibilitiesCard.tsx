import Link from 'next/link'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Card, Status } from '@/components/layout'
import type { AdminResponsibilities } from '@/lib/services/dashboard'

interface AdminResponsibilitiesCardProps {
  responsibilities: AdminResponsibilities | null
}

export function AdminResponsibilitiesCard({ responsibilities }: AdminResponsibilitiesCardProps) {
  if (!responsibilities) return null

  const hasWork =
    responsibilities.pendingValidations > 0 ||
    responsibilities.competenceFieldsWithoutOwner > 0 ||
    responsibilities.usersWithoutRole > 0

  if (!hasWork) return null

  return (
    <Card variant="default">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-zone-admin-soft flex items-center justify-center shrink-0">
          <ShieldAlert className="h-5 w-5 text-text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-caption uppercase text-text-muted">Deine Verantwortung</p>
          <p className="text-body font-medium text-text-primary mt-1">Plattform-Administration</p>

          <div className="space-y-2 mt-4">
            {responsibilities.pendingValidations > 0 && (
              <Link
                href="/admin/validations"
                className="flex items-center justify-between py-2 px-3 rounded-md bg-status-warning-soft hover:opacity-90 transition-opacity"
              >
                <Status type="warning" variant="inline">
                  {responsibilities.pendingValidations} Evidence-Einreichung
                  {responsibilities.pendingValidations !== 1 ? 'en' : ''} ausstehend
                </Status>
                <ArrowRight className="h-4 w-4 text-status-warning" />
              </Link>
            )}

            {responsibilities.competenceFieldsWithoutOwner > 0 && (
              <Link
                href="/profile"
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-surface-soft transition-colors"
              >
                <span className="text-body-s text-text-secondary">
                  {responsibilities.competenceFieldsWithoutOwner} Kompetenzfelder ohne Domain Expert
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </Link>
            )}

            {responsibilities.usersWithoutRole > 0 && (
              <div className="py-2 px-3 text-body-s text-text-secondary">
                {responsibilities.usersWithoutRole} Nutzer ohne aktuelle Rolle
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

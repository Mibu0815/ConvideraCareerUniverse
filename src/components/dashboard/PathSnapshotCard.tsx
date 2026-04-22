import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'
import { Card } from '@/components/layout'
import type { PathSnapshot } from '@/lib/services/dashboard'

interface PathSnapshotCardProps {
  snapshot: PathSnapshot | null
}

export function PathSnapshotCard({ snapshot }: PathSnapshotCardProps) {
  if (!snapshot) {
    return (
      <Card variant="subtle">
        <p className="text-caption uppercase text-text-muted mb-3">Mein Pfad</p>
        <p className="text-body text-text-secondary mb-4">
          Lege eine Zielrolle fest um deinen Karriereweg zu visualisieren.
        </p>
        <Link
          href="/my-career"
          className="inline-flex items-center gap-2 text-body-s font-medium text-brand-blue hover:text-brand-blue-hover"
        >
          Rollen erkunden
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    )
  }

  const progressPercent =
    snapshot.skillsRequiredCount > 0
      ? Math.round((snapshot.skillsValidatedCount / snapshot.skillsRequiredCount) * 100)
      : 0

  return (
    <Card variant="default">
      <p className="text-caption uppercase text-text-muted mb-3">Mein Pfad</p>

      {snapshot.currentRoleTitle && (
        <div className="mb-4">
          <p className="text-body-s text-text-muted">Aktuell</p>
          <p className="text-body font-medium text-text-primary">
            {snapshot.currentRoleTitle}
            {snapshot.currentRoleLevel && (
              <span className="text-text-muted ml-1">· {snapshot.currentRoleLevel}</span>
            )}
          </p>
        </div>
      )}

      {snapshot.targetRoleTitle ? (
        <>
          <div className="mb-4">
            <p className="text-body-s text-text-muted">Ziel</p>
            <p className="text-body font-medium text-text-primary">
              {snapshot.targetRoleTitle}
              {snapshot.targetRoleLevel && (
                <span className="text-text-muted ml-1">· {snapshot.targetRoleLevel}</span>
              )}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-body-s mb-1.5">
              <span className="text-text-secondary">Skills validiert</span>
              <span className="font-medium text-text-primary">
                {snapshot.skillsValidatedCount} / {snapshot.skillsRequiredCount}
              </span>
            </div>
            <div className="h-2 bg-border rounded-pill overflow-hidden">
              <div
                className="h-full bg-brand-blue rounded-pill transition-all duration-slow"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-body-s text-text-secondary mb-4">
          Noch keine Zielrolle festgelegt.
        </p>
      )}

      <Link
        href="/my-career"
        className="inline-flex items-center gap-2 text-body-s font-medium text-brand-blue hover:text-brand-blue-hover"
      >
        <Compass className="h-4 w-4" />
        Explore Roles
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}

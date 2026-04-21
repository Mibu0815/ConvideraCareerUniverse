import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTimeline } from '@/lib/services/evidence-timeline'
import { EvidenceTimeline } from '@/components/evidence/EvidenceTimeline'
import { TimelineExportButton } from '@/components/evidence/TimelineExportButton'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meine Karriere-Timeline | Career Universe',
  description: 'Dokumentierter Skill-Fortschritt',
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser?.id) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!dbUser) redirect('/auth/login')

  const grouped = await getTimeline(dbUser.id)

  return (
    <>
      <Navigation
        userName={dbUser.name}
        platformRole={dbUser.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">
                Meine Karriere-Timeline
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Dokumentierter Skill-Fortschritt
              </p>
            </div>
            <TimelineExportButton
              userId={dbUser.id}
              userName={dbUser.name ?? undefined}
            />
          </div>
          <EvidenceTimeline grouped={grouped} />
        </div>
      </div>
    </>
  )
}

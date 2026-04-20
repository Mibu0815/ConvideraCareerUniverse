import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTimeline } from '@/lib/services/evidence-timeline'
import { EvidenceTimeline } from '@/components/evidence/EvidenceTimeline'
import { TimelineExportButton } from '@/components/evidence/TimelineExportButton'

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
  )
}

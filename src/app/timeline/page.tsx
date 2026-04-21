import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTimeline } from '@/lib/services/evidence-timeline'
import { EvidenceTimeline } from '@/components/evidence/EvidenceTimeline'
import { TimelineExportButton } from '@/components/evidence/TimelineExportButton'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'
import { PageShell, PageHeader } from '@/components/layout'

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
      <PageShell width="content">
        <PageHeader
          eyebrow="Karriere-Verlauf"
          accent
          title="Meine Timeline"
          description="Dokumentierter Skill-Fortschritt über die Zeit"
          actions={
            <TimelineExportButton
              userId={dbUser.id}
              userName={dbUser.name ?? undefined}
            />
          }
        />
        <EvidenceTimeline grouped={grouped} />
      </PageShell>
    </>
  )
}

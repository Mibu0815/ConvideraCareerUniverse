import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getPendingValidations } from '@/lib/services/evidence-timeline'
import { ValidationPanelWrapper } from '@/components/evidence/ValidationPanelWrapper'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'
import { PageShell, PageHeader } from '@/components/layout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Offene Validierungen | Career Universe',
  description: 'Evidence-Einreichungen validieren',
}

export default async function ValidationsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser?.id) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!dbUser) redirect('/auth/login')
  if (dbUser.platformRole === 'USER') redirect('/?error=unauthorized')

  const pending = await getPendingValidations()
  const count = pending.length

  return (
    <>
      <Navigation
        userName={dbUser.name}
        platformRole={dbUser.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <PageShell width="content">
        <PageHeader
          eyebrow="Plattform-Verwaltung"
          accent
          title="Offene Validierungen"
          description={`${count} Einreichung${count === 1 ? '' : 'en'} ausstehend`}
        />
        <ValidationPanelWrapper initialPending={pending} />
      </PageShell>
    </>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getPendingValidations } from '@/lib/services/evidence-timeline'
import { ValidationPanelWrapper } from '@/components/evidence/ValidationPanelWrapper'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'

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

  return (
    <>
      <Navigation
        userName={dbUser.name}
        platformRole={dbUser.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-gray-900">
              Offene Validierungen
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pending.length} Einreichung{pending.length !== 1 ? 'en' : ''}{' '}
              ausstehend
            </p>
          </div>
          <ValidationPanelWrapper initialPending={pending} />
        </div>
      </div>
    </>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import {
  ValidationPanel,
  type PendingEvidenceView,
} from './ValidationPanel'

export function ValidationPanelWrapper({
  initialPending,
}: {
  initialPending: PendingEvidenceView[]
}) {
  const router = useRouter()

  function handleValidated() {
    router.refresh()
  }

  return <ValidationPanel pending={initialPending} onValidated={handleValidated} />
}

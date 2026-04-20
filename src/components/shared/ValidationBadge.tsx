import { getPendingValidations } from '@/lib/services/evidence-timeline'

export async function ValidationBadge() {
  try {
    const pending = await getPendingValidations()
    if (pending.length === 0) return null
    return (
      <span
        className="ml-1.5 bg-[#0055FF] text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
        aria-label={`${pending.length} ausstehende Validierungen`}
      >
        {pending.length}
      </span>
    )
  } catch {
    return null
  }
}

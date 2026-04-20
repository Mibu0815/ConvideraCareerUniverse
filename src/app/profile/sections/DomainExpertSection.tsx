'use client'

import { SkillTreeEditor } from '@/components/skill-tree/SkillTreeEditor'
import type { OwnedField, PendingValidation } from '../types'

export function DomainExpertSection({
  ownedFields,
  pendingValidations,
}: {
  ownedFields: OwnedField[]
  pendingValidations: PendingValidation[]
}) {
  return (
    <div className="space-y-3">
      {pendingValidations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Offene Validierungen</p>
            <span className="text-xs bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full">
              {pendingValidations.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingValidations.slice(0, 3).map(ev => (
              <div key={ev.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-gray-900">{ev.user.name ?? ev.user.email}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-gray-500 text-xs">{ev.skill.title} · L{ev.selfLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ownedFields.map(field => (
        <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{field.title}</p>
            <span className="text-xs text-gray-400">{field.skills.length} Skills</span>
          </div>
          <SkillTreeEditor field={field} />
          <p className="text-xs text-gray-400">Klicke auf einen Skill um ihn umzubenennen</p>
        </div>
      ))}

      {ownedFields.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">Dir sind noch keine Kompetenzfelder zugewiesen.</p>
          <p className="text-gray-400 text-xs mt-1">Bitte wende dich an einen Admin.</p>
        </div>
      )}
    </div>
  )
}

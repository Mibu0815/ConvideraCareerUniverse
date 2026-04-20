'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addSkill, updateSkill } from '@/app/actions/skill-management'
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
        <SkillTreeEditor key={field.id} field={field} />
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

export function SkillTreeEditor({ field }: { field: OwnedField }) {
  const [adding, setAdding] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAddSkill() {
    if (!newSkillName.trim()) return
    const baseSlug = newSkillName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')

    startTransition(async () => {
      try {
        await addSkill({
          competenceFieldId: field.id,
          title: newSkillName.trim(),
          slug: `${field.slug}-${baseSlug}`,
        })
        setNewSkillName('')
        setAdding(false)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Fehler')
      }
    })
  }

  function handleUpdateSkill(skillId: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      try {
        await updateSkill({ skillId, title: editName.trim() })
        setEditingId(null)
        setEditName('')
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Fehler')
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{field.title}</p>
        <span className="text-xs text-gray-400">{field.skills.length} Skills</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {field.skills.map(skill => (
          <div key={skill.id}>
            {editingId === skill.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleUpdateSkill(skill.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                  autoFocus
                />
                <button onClick={() => handleUpdateSkill(skill.id)} disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-800">✓</button>
                <button onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingId(skill.id); setEditName(skill.title) }}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {skill.title}
              </button>
            )}
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Skill-Name"
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSkill()
                if (e.key === 'Escape') { setAdding(false); setNewSkillName('') }
              }}
              className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
              autoFocus
            />
            <button onClick={handleAddSkill} disabled={isPending || !newSkillName.trim()}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40">✓</button>
            <button onClick={() => { setAdding(false); setNewSkillName('') }}
              className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="text-xs px-2.5 py-1 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
            + Skill hinzufügen
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">Klicke auf einen Skill um ihn umzubenennen</p>
    </div>
  )
}

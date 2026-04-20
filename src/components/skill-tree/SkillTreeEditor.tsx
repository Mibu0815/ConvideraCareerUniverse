'use client'

import { useState, useTransition } from 'react'
import { addSkill, updateSkill } from '@/app/actions/skill-management'

export interface SkillTreeField {
  id: string
  title: string
  slug: string
  skills: { id: string; title: string }[]
}

export function SkillTreeEditor({ field }: { field: SkillTreeField }) {
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
  )
}

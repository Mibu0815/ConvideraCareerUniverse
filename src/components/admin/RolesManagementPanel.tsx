'use client'

import { useState, useTransition } from 'react'
import {
  createRole,
  updateRole,
  deleteRole,
  addRoleSkill,
  removeRoleSkill,
  updateRoleSkillLevel,
} from '@/app/actions/role-management'
import type { RoleLevel } from '@prisma/client'

export interface AdminRole {
  id: string
  title: string
  slug: string
  level: RoleLevel
  description: string | null
  hasLeadership: boolean
  fieldId: string
  occupationalField: { title: string; slug: string } | null
  requiredSkills: {
    skillId: string
    requiredLevel: number
    skill: { id: string; title: string; competenceFieldTitle: string }
  }[]
}

export interface AdminOccupationalField {
  id: string
  slug: string
  title: string
}

export interface AdminSkill {
  id: string
  title: string
  competenceFieldTitle: string
}

interface Props {
  roles: AdminRole[]
  occupationalFields: AdminOccupationalField[]
  allSkills: AdminSkill[]
}

const LEVELS: RoleLevel[] = ['JUNIOR', 'PROFESSIONAL', 'SENIOR', 'TEAM_LEAD', 'FUNCTIONAL_LEAD', 'HEAD_OF']
const LEVEL_LABELS: Record<RoleLevel, string> = {
  JUNIOR: 'Junior',
  PROFESSIONAL: 'Professional',
  SENIOR: 'Senior',
  TEAM_LEAD: 'Team Lead',
  FUNCTIONAL_LEAD: 'Functional Lead',
  HEAD_OF: 'Head Of',
}

export function RolesManagementPanel({ roles, occupationalFields, allSkills }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null

  const grouped = occupationalFields.map(of => ({
    field: of,
    roles: roles.filter(r => r.occupationalField?.slug === of.slug),
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
      <div className="space-y-3">
        <button
          onClick={() => { setCreating(true); setSelectedRoleId(null) }}
          className="w-full py-2 text-sm font-medium text-[#0055FF] border border-dashed border-gray-300 rounded-lg hover:border-[#0055FF] hover:bg-blue-50 transition-colors"
        >
          + Neue Rolle
        </button>

        {grouped.map(group => (
          <div key={group.field.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {group.field.title} ({group.roles.length})
            </p>
            <div className="space-y-1">
              {group.roles.length === 0 && (
                <p className="text-xs text-gray-400 py-2">Keine Rollen</p>
              )}
              {group.roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRoleId(role.id); setCreating(false) }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedRoleId === role.id
                      ? 'bg-blue-50 text-[#0055FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{role.title}</span>
                    <span className="text-xs text-gray-400">
                      {LEVEL_LABELS[role.level]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        {creating ? (
          <RoleCreateForm
            occupationalFields={occupationalFields}
            onCancel={() => setCreating(false)}
            onCreated={newId => { setCreating(false); setSelectedRoleId(newId) }}
          />
        ) : selectedRole ? (
          <RoleDetailPanel role={selectedRole} allSkills={allSkills} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">Wähle eine Rolle aus der Liste</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleCreateForm({
  occupationalFields,
  onCancel,
  onCreated,
}: {
  occupationalFields: AdminOccupationalField[]
  onCancel: () => void
  onCreated: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [level, setLevel] = useState<RoleLevel>('JUNIOR')
  const [fieldSlug, setFieldSlug] = useState(occupationalFields[0]?.slug ?? '')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit() {
    setError('')
    if (!title.trim() || !slug.trim()) {
      setError('Titel und Slug sind Pflichtfelder')
      return
    }
    startTransition(async () => {
      try {
        const role = await createRole({
          title: title.trim(),
          slug: slug.trim(),
          level,
          occupationalFieldSlug: fieldSlug,
          description: description.trim() || undefined,
        })
        onCreated(role.id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler')
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Neue Rolle anlegen</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Titel *</label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!slug) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
              }
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Level</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as RoleLevel)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Occupational Field</label>
            <select
              value={fieldSlug}
              onChange={e => setFieldSlug(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {occupationalFields.map(f => (
                <option key={f.slug} value={f.slug}>{f.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Beschreibung</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2 text-sm font-medium bg-[#0055FF] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Wird angelegt...' : 'Anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RoleDetailPanel({ role, allSkills }: { role: AdminRole; allSkills: AdminSkill[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(role.title)
  const [description, setDescription] = useState(role.description ?? '')
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillId, setNewSkillId] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState(2)

  const availableSkills = allSkills.filter(
    s => !role.requiredSkills.some(rs => rs.skillId === s.id)
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        {editingTitle ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
            />
            <button
              onClick={() => {
                startTransition(async () => {
                  await updateRole({ roleId: role.id, title })
                  setEditingTitle(false)
                })
              }}
              className="px-3 py-2 text-sm bg-[#0055FF] text-white rounded-lg"
            >
              ✓
            </button>
            <button
              onClick={() => { setTitle(role.title); setEditingTitle(false) }}
              className="px-3 py-2 text-sm text-gray-500"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="group flex items-center gap-2 w-full text-left"
          >
            <h3 className="text-base font-medium text-gray-900">{role.title}</h3>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">bearbeiten</span>
          </button>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          {LEVEL_LABELS[role.level]} · {role.occupationalField?.title ?? 'Kein Field'}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">
          Beschreibung
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (role.description ?? '')) {
              startTransition(async () => {
                await updateRole({ roleId: role.id, description })
              })
            }
          }}
          rows={3}
          placeholder="Keine Beschreibung"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Erforderliche Skills ({role.requiredSkills.length})
          </label>
          <button
            onClick={() => setAddingSkill(!addingSkill)}
            className="text-xs text-[#0055FF] hover:underline"
          >
            {addingSkill ? 'Abbrechen' : '+ Skill hinzufügen'}
          </button>
        </div>

        {addingSkill && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex gap-2">
            <select
              value={newSkillId}
              onChange={e => setNewSkillId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Skill auswählen...</option>
              {availableSkills.map(s => (
                <option key={s.id} value={s.id}>
                  {s.competenceFieldTitle} / {s.title}
                </option>
              ))}
            </select>
            <select
              value={newSkillLevel}
              onChange={e => setNewSkillLevel(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {[1, 2, 3, 4].map(l => <option key={l} value={l}>L{l}</option>)}
            </select>
            <button
              onClick={() => {
                if (!newSkillId) return
                startTransition(async () => {
                  await addRoleSkill({ roleId: role.id, skillId: newSkillId, requiredLevel: newSkillLevel })
                  setNewSkillId('')
                  setAddingSkill(false)
                })
              }}
              disabled={!newSkillId || isPending}
              className="px-4 py-2 text-sm bg-[#0055FF] text-white rounded-lg disabled:opacity-50"
            >
              +
            </button>
          </div>
        )}

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {role.requiredSkills.map(rs => (
            <div key={rs.skillId} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
              <div className="flex-1 text-sm">
                <span className="text-xs text-gray-400 mr-2">{rs.skill.competenceFieldTitle}</span>
                <span className="text-gray-700">{rs.skill.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rs.requiredLevel}
                  onChange={e => {
                    const lvl = Number(e.target.value)
                    startTransition(async () => {
                      await updateRoleSkillLevel({
                        roleId: role.id,
                        skillId: rs.skillId,
                        requiredLevel: lvl,
                      })
                    })
                  }}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
                >
                  {[1, 2, 3, 4].map(l => <option key={l} value={l}>L{l}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (!confirm(`"${rs.skill.title}" entfernen?`)) return
                    startTransition(async () => {
                      await removeRoleSkill(role.id, rs.skillId)
                    })
                  }}
                  className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={() => {
            if (!confirm(`Rolle "${role.title}" wirklich löschen?`)) return
            startTransition(async () => {
              try {
                await deleteRole(role.id)
                window.location.reload()
              } catch (e) {
                alert(e instanceof Error ? e.message : 'Fehler')
              }
            })
          }}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Rolle löschen
        </button>
      </div>
    </div>
  )
}

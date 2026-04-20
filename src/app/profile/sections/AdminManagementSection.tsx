'use client'

import { useState } from 'react'
import { PLATFORM_ROLE_BADGE } from '@/lib/constants/platform-roles'
import { SkillTreeEditor } from '@/components/skill-tree/SkillTreeEditor'
import { RolesAndPathsTabs } from '@/components/admin/RolesAndPathsTabs'
import type {
  AdminCompetenceField,
  AdminUserRow,
  PendingValidation,
  AdminRole,
  AdminPathRole,
  AdminOccupationalField,
  AdminSkill,
  AdminCareerPath,
} from '../types'

export function AdminManagementSection({
  allCompetenceFields,
  allUsers,
  pendingValidations,
  adminRoles,
  adminPathRoles,
  adminOccupationalFields,
  adminSkills,
  adminCareerPaths,
}: {
  allCompetenceFields: AdminCompetenceField[]
  allUsers: AdminUserRow[]
  pendingValidations: PendingValidation[]
  adminRoles: AdminRole[]
  adminPathRoles: AdminPathRole[]
  adminOccupationalFields: AdminOccupationalField[]
  adminSkills: AdminSkill[]
  adminCareerPaths: AdminCareerPath[]
}) {
  const [activeTab, setActiveTab] = useState<'skills' | 'roles' | 'team'>('skills')

  const totalSkills = allCompetenceFields.reduce((sum, f) => sum + f.skills.length, 0)
  const fieldsWithoutExpert = allCompetenceFields.filter(f => !f.ownerId).length

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Plattform-Übersicht</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Stat value={allUsers.length} label="Mitarbeiter" />
          <Stat value={allCompetenceFields.length} label="Kompetenzfelder" />
          <Stat value={totalSkills} label="Skills" />
        </div>
        {pendingValidations.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 mt-2">
            {pendingValidations.length} offene Validierung{pendingValidations.length === 1 ? '' : 'en'}.
          </div>
        )}
        {fieldsWithoutExpert > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 mt-2">
            {fieldsWithoutExpert} Kompetenzfeld{fieldsWithoutExpert === 1 ? '' : 'er'} ohne Domain Experten — Validierungen blockiert.
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['skills', 'Skill-Trees'], ['roles', 'Rollen & Pfade'], ['team', 'Team']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {activeTab === 'skills' && (
        <div className="space-y-3">
          {allCompetenceFields.map(field => (
            <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{field.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {field.ownerName
                      ? `Domain Experte: ${field.ownerName}`
                      : <span className="text-amber-600">Kein Domain Experte</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{field.skills.length} Skills</span>
              </div>
              <SkillTreeEditor field={field} />
              <p className="text-xs text-gray-400">Klicke auf einen Skill um ihn umzubenennen</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roles' && (
        <RolesAndPathsTabs
          roles={adminRoles}
          pathRoles={adminPathRoles}
          occupationalFields={adminOccupationalFields}
          allSkills={adminSkills}
          paths={adminCareerPaths}
        />
      )}

      {activeTab === 'team' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="space-y-2">
            {allUsers.slice(0, 8).map(u => {
              const badge = PLATFORM_ROLE_BADGE[u.platformRole] ?? PLATFORM_ROLE_BADGE.MEMBER
              return (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{u.name ?? u.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {u.currentRole
                        ? `${u.currentRole.title} · ${u.currentRole.level}`
                        : 'Keine Rolle zugewiesen'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
          {allUsers.length > 8 && (
            <p className="text-xs text-gray-400 mt-3">
              {allUsers.length - 8} weitere Mitarbeiter
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xl font-medium">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

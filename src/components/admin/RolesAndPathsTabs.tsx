'use client'

import { useState } from 'react'
import { RolesManagementPanel, type AdminRole, type AdminOccupationalField, type AdminSkill } from './RolesManagementPanel'
import { CareerPathsPanel, type AdminCareerPath, type AdminPathRole } from './CareerPathsPanel'

interface Props {
  roles: AdminRole[]
  pathRoles: AdminPathRole[]
  occupationalFields: AdminOccupationalField[]
  allSkills: AdminSkill[]
  paths: AdminCareerPath[]
}

export function RolesAndPathsTabs({ roles, pathRoles, occupationalFields, allSkills, paths }: Props) {
  const [sub, setSub] = useState<'roles' | 'paths'>('roles')
  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setSub('roles')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            sub === 'roles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rollen ({roles.length})
        </button>
        <button
          onClick={() => setSub('paths')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            sub === 'paths' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Karrierepfade ({paths.length})
        </button>
      </div>
      {sub === 'roles' ? (
        <RolesManagementPanel
          roles={roles}
          occupationalFields={occupationalFields}
          allSkills={allSkills}
        />
      ) : (
        <CareerPathsPanel roles={pathRoles} paths={paths} />
      )}
    </div>
  )
}

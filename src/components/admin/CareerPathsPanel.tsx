'use client'

import { useState, useTransition } from 'react'
import { createCareerPath, deleteCareerPath } from '@/app/actions/career-path-management'
import type { RoleLevel } from '@prisma/client'

export interface AdminPathRole {
  id: string
  title: string
  level: RoleLevel
  occupationalField: { title: string } | null
}

export interface AdminCareerPath {
  id: string
  fromRoleId: string
  toRoleId: string
  isTypical: boolean
  description: string | null
  fromRole: { id: string; title: string; level: RoleLevel }
  toRole: { id: string; title: string; level: RoleLevel }
}

interface Props {
  roles: AdminPathRole[]
  paths: AdminCareerPath[]
}

export function CareerPathsPanel({ roles, paths }: Props) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const grouped = roles
    .map(r => ({
      role: r,
      outgoing: paths.filter(p => p.fromRoleId === r.id),
    }))
    .filter(g => g.outgoing.length > 0)

  function handleCreate() {
    setError('')
    if (!fromId || !toId) return
    startTransition(async () => {
      try {
        await createCareerPath({ fromRoleId: fromId, toRoleId: toId })
        setFromId('')
        setToId('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Neuen Karrierepfad anlegen
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
          <select
            value={fromId}
            onChange={e => setFromId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Von Rolle...</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.title} ({r.level})</option>)}
          </select>
          <span className="text-gray-400">→</span>
          <select
            value={toId}
            onChange={e => setToId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Zu Rolle...</option>
            {roles.filter(r => r.id !== fromId).map(r => (
              <option key={r.id} value={r.id}>{r.title} ({r.level})</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={!fromId || !toId || isPending}
            className="px-4 py-2 text-sm font-medium bg-[#0055FF] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Anlegen
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">Noch keine Karrierepfade definiert</p>
        </div>
      ) : (
        grouped.map(g => (
          <div key={g.role.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {g.role.title}
              <span className="text-xs text-gray-400 ml-2">({g.role.level})</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">{g.role.occupationalField?.title}</p>
            <div className="space-y-1">
              {g.outgoing.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-700">{p.toRole.title}</span>
                    <span className="text-xs text-gray-400">({p.toRole.level})</span>
                  </div>
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await deleteCareerPath(p.id)
                      })
                    }}
                    className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

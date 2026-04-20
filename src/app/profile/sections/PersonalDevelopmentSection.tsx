'use client'

import Link from 'next/link'
import type { ProfileUser, AssessmentStats } from '../types'

export function PersonalDevelopmentSection({
  user,
  assessmentStats,
}: {
  user: ProfileUser
  assessmentStats: AssessmentStats
}) {
  const currentRole = user.currentRole
  const targetRole = user.careerGoal?.targetRole ?? null

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Meine Rolle</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Aktuell</span>
            <span className="font-medium text-gray-900">
              {currentRole
                ? `${currentRole.title} · ${currentRole.level}`
                : <span className="text-gray-400">nicht gesetzt</span>}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Zielrolle</span>
            <span className="font-medium text-gray-900">
              {targetRole
                ? `${targetRole.title} · ${targetRole.level}`
                : <span className="text-gray-400">nicht gesetzt</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Skill-Status</p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={assessmentStats.validated} label="Validiert" color="text-green-600" />
          <StatCard value={assessmentStats.pending} label="Ausstehend" color="text-amber-500" />
          <StatCard value={assessmentStats.selfAssessed} label="Selbst eingeschätzt" color="text-gray-500" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Schnellzugriff</p>
        <div className="space-y-2">
          {[
            { href: '/learning-journey', label: 'Meine Journey', desc: 'Fortschritt & Learning Focus' },
            { href: '/my-career', label: 'Gap-Analyse', desc: 'Was fehlt für die Zielrolle?' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div>
                <div className="text-sm text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className={`text-xl font-medium ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

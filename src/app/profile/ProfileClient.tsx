'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLATFORM_ROLE_BADGE } from '@/lib/constants/platform-roles'
import { PersonalDevelopmentSection } from './sections/PersonalDevelopmentSection'
import { AdminManagementSection } from './sections/AdminManagementSection'
import { DomainExpertSection } from './sections/DomainExpertSection'
import type {
  ProfileUser,
  PendingValidation,
  AdminCompetenceField,
  AdminUserRow,
  AssessmentStats,
} from './types'

type ProfileMode = 'personal' | 'management'

interface ProfileClientProps {
  user: ProfileUser
  pendingValidations: PendingValidation[]
  allCompetenceFields: AdminCompetenceField[]
  allUsers: AdminUserRow[]
  assessmentStats: AssessmentStats
  isAdmin: boolean
  isDomainExpert: boolean
}

export function ProfileClient({
  user,
  pendingValidations,
  allCompetenceFields,
  allUsers,
  assessmentStats,
  isAdmin,
  isDomainExpert,
}: ProfileClientProps) {
  const [mode, setMode] = useState<ProfileMode>('personal')
  const badge = PLATFORM_ROLE_BADGE[user.platformRole] ?? PLATFORM_ROLE_BADGE.MEMBER
  const showToggle = isAdmin || isDomainExpert
  console.log('[DEBUG] ProfileClient props — isAdmin:', isAdmin, 'isDomainExpert:', isDomainExpert, 'showToggle:', showToggle, 'platformRole:', user.platformRole)

  const initials = (user.name ?? user.email)
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
        <div className="p-5 flex items-center gap-4 border-b border-gray-100">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0
            ${isAdmin ? 'bg-red-50 text-red-800' : isDomainExpert ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name ?? user.email}</p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>

          {showToggle && (
            <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setMode('personal')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'personal' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Meine Entwicklung
              </button>
              <button
                onClick={() => setMode('management')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                  mode === 'management' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isAdmin ? 'Plattform-Verwaltung' : 'Mein Kompetenzfeld'}
              </button>
            </div>
          )}
        </div>

        {showToggle && (
          <div className={`px-5 py-2 flex items-center gap-2 text-xs font-medium
            ${mode === 'personal'
              ? 'bg-green-50 text-green-700'
              : isAdmin ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              mode === 'personal' ? 'bg-green-500' : isAdmin ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            {mode === 'personal'
              ? 'Persönliche Karriereentwicklung'
              : isAdmin ? 'Plattform-Verwaltung' : 'Kompetenzfeld-Verwaltung'}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'personal' ? (
          <motion.div key="personal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}>
            <PersonalDevelopmentSection user={user} assessmentStats={assessmentStats} />
          </motion.div>
        ) : (
          <motion.div key="management"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}>
            {isAdmin ? (
              <AdminManagementSection
                allCompetenceFields={allCompetenceFields}
                allUsers={allUsers}
                pendingValidations={pendingValidations}
              />
            ) : (
              <DomainExpertSection
                ownedFields={user.ownedFields}
                pendingValidations={pendingValidations}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

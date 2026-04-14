// src/app/dashboard/components/OnboardingWizard.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Briefcase, Target, Sparkles, Loader2 } from 'lucide-react'
import type { AuthUser } from '@/app/actions/auth'
import type { GroupedRoles } from '@/app/actions/get-roles'
import { setCurrentRole, setTargetRole } from '@/app/actions/auth'

interface Props {
  user: AuthUser
  groupedRoles: GroupedRoles[]
}

type Step = 'welcome' | 'current-role' | 'target-role' | 'complete'

export function OnboardingWizard({ user, groupedRoles }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('welcome')
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null)
  const [targetRoleId, setTargetRoleIdState] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = groupedRoles
    .map((group) => ({
      ...group,
      roles: group.roles.filter((role) =>
        role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.fieldName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.roles.length > 0)

  const handleSelectCurrentRole = (roleId: string) => {
    setCurrentRoleId(roleId)
  }

  const handleSelectTargetRole = (roleId: string) => {
    setTargetRoleIdState(roleId)
  }

  const handleContinueToTargetRole = () => {
    if (currentRoleId) {
      startTransition(async () => {
        await setCurrentRole(user.id, currentRoleId)
        setStep('target-role')
        setSearchQuery('')
      })
    }
  }

  const handleComplete = () => {
    if (targetRoleId) {
      startTransition(async () => {
        await setTargetRole(user.id, targetRoleId)
        setStep('complete')
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.refresh()
        }, 2000)
      })
    }
  }

  const selectedCurrentRole = groupedRoles
    .flatMap((g) => g.roles)
    .find((r) => r.id === currentRoleId)

  const selectedTargetRole = groupedRoles
    .flatMap((g) => g.roles)
    .find((r) => r.id === targetRoleId)

  return (
    <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
            top: '-20%',
            right: '-10%',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%)',
            bottom: '-10%',
            left: '-5%',
          }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Wizard Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass-card rounded-2xl p-8">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['welcome', 'current-role', 'target-role', 'complete'].map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === s
                    ? 'bg-brand-accent'
                    : ['welcome', 'current-role', 'target-role', 'complete'].indexOf(step) > i
                    ? 'bg-brand-gray-400'
                    : 'bg-brand-gray-200'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Welcome Step */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-black flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-brand-white" />
                </div>
                <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
                  Willkommen, {user.name.split(' ')[0]}!
                </h2>
                <p className="text-brand-gray-600 mb-8">
                  Lass uns dein Career Universe einrichten. Das dauert nur 2 Minuten.
                </p>
                <button
                  onClick={() => setStep('current-role')}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-brand-white bg-brand-black hover:bg-brand-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Los geht's
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Current Role Step */}
            {step === 'current-role' && (
              <motion.div
                key="current-role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-brand-gray-900 text-center mb-2">
                  Was ist deine aktuelle Rolle?
                </h2>
                <p className="text-brand-gray-500 text-center text-sm mb-6">
                  Wähle die Rolle, in der du aktuell tätig bist.
                </p>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Rolle suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-gray-200 bg-brand-white mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
                />

                {/* Role List */}
                <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
                  {filteredRoles.map((group) => (
                    <div key={group.fieldId}>
                      <p className="text-xs font-semibold text-brand-gray-400 uppercase tracking-wider px-2 py-1 sticky top-0 bg-white/80 backdrop-blur-sm">
                        {group.fieldName}
                      </p>
                      {group.roles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleSelectCurrentRole(role.id)}
                          className={`w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                            currentRoleId === role.id
                              ? 'bg-brand-accent/10 border border-brand-accent'
                              : 'bg-brand-gray-50 hover:bg-brand-gray-100 border border-transparent'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-brand-gray-900">{role.title}</p>
                            <p className="text-xs text-brand-gray-500">{role.level}</p>
                          </div>
                          {currentRoleId === role.id && (
                            <Check className="w-5 h-5 text-brand-accent" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleContinueToTargetRole}
                  disabled={!currentRoleId || isPending}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-brand-white bg-brand-black hover:bg-brand-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Weiter
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Target Role Step */}
            {step === 'target-role' && (
              <motion.div
                key="target-role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-brand-gray-900 text-center mb-2">
                  Wo willst du in 2 Jahren stehen?
                </h2>
                <p className="text-brand-gray-500 text-center text-sm mb-6">
                  Wähle deine Zielrolle für die Karriereplanung.
                </p>

                {/* Current Role Badge */}
                {selectedCurrentRole && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg mb-4">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Aktuell: <strong>{selectedCurrentRole.title}</strong>
                    </span>
                  </div>
                )}

                {/* Search */}
                <input
                  type="text"
                  placeholder="Zielrolle suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-gray-200 bg-brand-white mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
                />

                {/* Role List */}
                <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
                  {filteredRoles.map((group) => (
                    <div key={group.fieldId}>
                      <p className="text-xs font-semibold text-brand-gray-400 uppercase tracking-wider px-2 py-1 sticky top-0 bg-white/80 backdrop-blur-sm">
                        {group.fieldName}
                      </p>
                      {group.roles
                        .filter((role) => role.id !== currentRoleId)
                        .map((role) => (
                          <button
                            key={role.id}
                            onClick={() => handleSelectTargetRole(role.id)}
                            className={`w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                              targetRoleId === role.id
                                ? 'bg-purple-100 border border-purple-400'
                                : 'bg-brand-gray-50 hover:bg-brand-gray-100 border border-transparent'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-brand-gray-900">{role.title}</p>
                              <p className="text-xs text-brand-gray-500">{role.level}</p>
                            </div>
                            {targetRoleId === role.id && (
                              <Check className="w-5 h-5 text-purple-600" />
                            )}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleComplete}
                  disabled={!targetRoleId || isPending}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-brand-white bg-brand-black hover:bg-brand-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Abschließen
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Complete Step */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
                  Dein Universe ist bereit!
                </h2>
                <p className="text-brand-gray-600 mb-4">
                  Von <strong>{selectedCurrentRole?.title}</strong> zu{' '}
                  <strong className="text-purple-600">{selectedTargetRole?.title}</strong>
                </p>
                <p className="text-sm text-brand-gray-500">
                  Du wirst gleich weitergeleitet...
                </p>
                <motion.div
                  className="mt-6 flex justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-6 h-6 text-brand-accent" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

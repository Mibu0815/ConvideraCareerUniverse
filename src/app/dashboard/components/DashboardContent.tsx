// src/app/dashboard/components/DashboardContent.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Target,
  TrendingUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  Crown,
  LogOut,
  Settings,
  Compass
} from 'lucide-react'
import type { AuthUser } from '@/app/actions/auth'
import { signOut } from '@/app/actions/auth'

interface Props {
  user: AuthUser
  kpis: {
    totalGaps: number
    skillUpgrades: number
    newSkillsNeeded: number
    progressPercent: number
    focusedItems: number
    completedItems: number
    totalAssessments: number
  }
}

export function DashboardContent({ user, kpis }: Props) {
  const isFunctionalLead = user.platformRole === 'FUNCTIONAL_LEAD'
  const isAdmin = user.platformRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-brand-gray-50">
      {/* Header with Progress Bar */}
      <header className="bg-brand-white border-b border-brand-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-bento bg-brand-black flex items-center justify-center">
                <span className="text-lg font-bold text-brand-white">C</span>
              </div>
              <div>
                <h1 className="font-semibold text-brand-gray-900">Career Universe</h1>
                <p className="text-xs text-brand-gray-500">Dashboard</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-brand-gray-600">Level-Up Progress</span>
              <div className="w-32 h-2 bg-brand-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${kpis.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brand-accent to-purple-500 rounded-full"
                />
              </div>
              <span className="text-sm font-semibold text-brand-gray-900">{kpis.progressPercent}%</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Functional Lead Badge */}
              {isFunctionalLead && (
                <Link
                  href="/lead-dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium hover:bg-amber-200 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Lead Dashboard
                </Link>
              )}

              {/* Admin Badge */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              )}

              {/* Avatar & Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-brand-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-gray-200 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-brand-gray-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-brand-white rounded-lg shadow-lg border border-brand-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-brand-gray-100">
                    <p className="font-medium text-brand-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-brand-gray-500 truncate">{user.email}</p>
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-gray-700 hover:bg-brand-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Abmelden
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personalized Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-brand-gray-900">
            Hallo {user.name.split(' ')[0]},
          </h2>
          {user.targetRoleName ? (
            <p className="text-lg text-brand-gray-600 mt-1">
              dein Weg zum{' '}
              <span className="font-semibold text-brand-accent">{user.targetRoleName}</span>{' '}
              ist klar markiert.
            </p>
          ) : (
            <p className="text-lg text-brand-gray-600 mt-1">
              lass uns deine Karriereziele definieren.
            </p>
          )}
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Gaps Card */}
          <div className="bento-card bg-brand-gray-900 text-brand-white">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-brand-gray-400" />
              <span className="text-sm text-brand-gray-400">Skill Gaps</span>
            </div>
            <p className="text-3xl font-bold">{kpis.totalGaps}</p>
            <p className="text-xs text-brand-gray-400 mt-1">zu schließen</p>
          </div>

          {/* Upgrades Card */}
          <div className="bento-card bg-brand-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-brand-accent" />
              <span className="text-sm text-brand-gray-500">Upgrades</span>
            </div>
            <p className="text-3xl font-bold text-brand-gray-900">{kpis.skillUpgrades}</p>
            <p className="text-xs text-brand-gray-500 mt-1">Skills verbessern</p>
          </div>

          {/* New Skills Card */}
          <div className="bento-card bg-brand-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-brand-gray-500">Neue Skills</span>
            </div>
            <p className="text-3xl font-bold text-brand-gray-900">{kpis.newSkillsNeeded}</p>
            <p className="text-xs text-brand-gray-500 mt-1">zu erlernen</p>
          </div>

          {/* Focus Items Card */}
          <div className="bento-card bg-brand-accent text-brand-white">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-200">Im Fokus</span>
            </div>
            <p className="text-3xl font-bold">{kpis.focusedItems}</p>
            <p className="text-xs text-blue-200 mt-1">von 3 Slots</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {/* Compare Roles */}
          <Link href="/my-career/compare">
            <div className="bento-card bg-brand-white group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-brand-gray-100 flex items-center justify-center mb-4 group-hover:bg-brand-accent/10 transition-colors">
                    <Compass className="w-5 h-5 text-brand-gray-600 group-hover:text-brand-accent transition-colors" />
                  </div>
                  <h3 className="font-semibold text-brand-gray-900 mb-1">Rollen vergleichen</h3>
                  <p className="text-sm text-brand-gray-500">
                    Analysiere Skill-Gaps zwischen deiner aktuellen und Zielrolle.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-gray-400 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          {/* Learning Journey */}
          <Link href="/learning-journey">
            <div className="bento-card bg-brand-white group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-brand-gray-100 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-gray-600 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-brand-gray-900 mb-1">Learning Journey</h3>
                  <p className="text-sm text-brand-gray-500">
                    Dein personalisierter Lernpfad mit praktischen Impulsen.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Progress Overview (Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:hidden mt-6"
        >
          <div className="bento-card bg-brand-white">
            <h3 className="font-semibold text-brand-gray-900 mb-3">Level-Up Progress</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-brand-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${kpis.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brand-accent to-purple-500 rounded-full"
                />
              </div>
              <span className="text-lg font-bold text-brand-gray-900">{kpis.progressPercent}%</span>
            </div>
            <p className="text-sm text-brand-gray-500 mt-2">
              {kpis.completedItems} von {kpis.completedItems + kpis.totalGaps} Skills gemeistert
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

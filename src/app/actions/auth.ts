// src/app/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  platformRole: string
  currentRoleId: string | null
  currentRoleName: string | null
  targetRoleId: string | null
  targetRoleName: string | null
  isFirstLogin: boolean
}

/**
 * Get the current authenticated user with their profile data
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser?.email) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      platformRole: true,
      currentRoleId: true,
      targetRoleId: true,
    },
  })

  if (!dbUser) {
    // Create user if not exists
    const newUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatarUrl: authUser.user_metadata?.avatar_url || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        platformRole: true,
        currentRoleId: true,
        targetRoleId: true,
      },
    })

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatarUrl: newUser.avatarUrl,
      platformRole: newUser.platformRole,
      currentRoleId: null,
      currentRoleName: null,
      targetRoleId: null,
      targetRoleName: null,
      isFirstLogin: true,
    }
  }

  // Fetch role names in parallel
  const [currentRole, targetRole] = await Promise.all([
    dbUser.currentRoleId
      ? prisma.role.findUnique({
          where: { id: dbUser.currentRoleId },
          select: { title: true },
        })
      : null,
    dbUser.targetRoleId
      ? prisma.role.findUnique({
          where: { id: dbUser.targetRoleId },
          select: { title: true },
        })
      : null,
  ])

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    platformRole: dbUser.platformRole,
    currentRoleId: dbUser.currentRoleId,
    currentRoleName: currentRole?.title || null,
    targetRoleId: dbUser.targetRoleId,
    targetRoleName: targetRole?.title || null,
    isFirstLogin: !dbUser.currentRoleId,
  }
}

/**
 * Get dashboard KPIs for the current user
 */
export async function getDashboardKPIs(userId: string) {
  const [assessments, learningFocus] = await Promise.all([
    prisma.skillAssessment.findMany({
      where: { userId },
      select: { skillId: true, selfLevel: true, validatedLevel: true },
    }),
    prisma.learningFocus.findMany({
      where: { LearningPlan: { userId } },
      select: { status: true },
    }),
  ])

  const focusedItems = learningFocus.filter(lf => lf.status === 'IN_PROGRESS').length
  const completedItems = learningFocus.filter(lf => lf.status === 'COMPLETED').length
  const totalGaps = learningFocus.length
  const progressPercent = totalGaps > 0
    ? Math.round((completedItems / totalGaps) * 100)
    : 0

  return {
    totalGaps,
    skillUpgrades: 0,
    newSkillsNeeded: 0,
    progressPercent,
    focusedItems,
    completedItems,
    totalAssessments: assessments.length,
  }
}

/**
 * Update user's current role
 */
export async function setCurrentRole(userId: string, roleId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { currentRoleId: roleId, updatedAt: new Date() },
  })
}

/**
 * Set user's target role
 */
export async function setTargetRole(userId: string, roleId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { targetRoleId: roleId, updatedAt: new Date() },
  })
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

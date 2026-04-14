// src/app/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  platformRole: 'ADMIN' | 'FUNCTIONAL_LEAD' | 'MEMBER'
  currentRoleId: string | null
  currentRoleName: string | null
  targetRoleId: string | null
  targetRoleName: string | null
  isFirstLogin: boolean
}

/**
 * Get the current authenticated user with their profile data
 * Links Supabase Auth user to our User table via email
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser?.email) {
    return null
  }

  // Find or create user in our database
  let dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: {
      Role: true,
      CareerGoal: {
        where: {
          status: { in: ['EXPLORING', 'COMMITTED'] }
        },
        include: {
          Role: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 1
      }
    }
  })

  // If user doesn't exist in our DB, create them
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatarUrl: authUser.user_metadata?.avatar_url || null,
        platformRole: 'MEMBER',
        isActive: true,
      },
      include: {
        Role: true,
        CareerGoal: {
          include: { Role: true },
          take: 1
        }
      }
    })
  }

  const activeGoal = dbUser.CareerGoal?.[0]
  const isFirstLogin = !dbUser.currentRoleId

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    platformRole: dbUser.platformRole as 'ADMIN' | 'FUNCTIONAL_LEAD' | 'MEMBER',
    currentRoleId: dbUser.currentRoleId,
    currentRoleName: dbUser.Role?.title || null,
    targetRoleId: activeGoal?.targetRoleId || null,
    targetRoleName: activeGoal?.Role?.title || null,
    isFirstLogin,
  }
}

/**
 * Get dashboard KPIs for the current user
 */
export async function getDashboardKPIs(userId: string) {
  // Get user's skill assessments
  const assessments = await prisma.skillAssessment.findMany({
    where: { userId },
    include: {
      Skill: true
    }
  })

  // Get user's learning focus items
  const learningFocus = await prisma.learningFocus.findMany({
    where: {
      LearningPlan: { userId }
    }
  })

  // Get user with current role requirements
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Role: {
        include: {
          RoleSkillRequirement: true
        }
      },
      CareerGoal: {
        where: { status: { in: ['EXPLORING', 'COMMITTED'] } },
        include: {
          Role: {
            include: {
              RoleSkillRequirement: true
            }
          }
        },
        take: 1
      }
    }
  })

  const currentRoleRequirements = user?.Role?.RoleSkillRequirement || []
  const targetRoleRequirements = user?.CareerGoal?.[0]?.Role?.RoleSkillRequirement || []

  // Calculate gaps
  let totalGaps = 0
  let skillUpgrades = 0
  let newSkillsNeeded = 0

  const assessmentMap = new Map(assessments.map(a => [a.skillId, a.validatedLevel ?? a.selfLevel ?? 0]))

  // Check target role skills for gaps
  for (const req of targetRoleRequirements) {
    const currentLevel = assessmentMap.get(req.skillId) || 0
    if (currentLevel < req.requiredLevel) {
      totalGaps++
      if (currentLevel > 0) {
        skillUpgrades++
      } else {
        newSkillsNeeded++
      }
    }
  }

  // Calculate progress percentage
  const totalRequirements = targetRoleRequirements.length || 1
  const completedRequirements = targetRoleRequirements.filter(req => {
    const currentLevel = assessmentMap.get(req.skillId) || 0
    return currentLevel >= req.requiredLevel
  }).length

  const progressPercent = Math.round((completedRequirements / totalRequirements) * 100)

  // Count focused items
  const focusedItems = learningFocus.filter(lf => lf.status === 'IN_PROGRESS').length
  const completedItems = learningFocus.filter(lf => lf.status === 'COMPLETED').length

  return {
    totalGaps,
    skillUpgrades,
    newSkillsNeeded,
    progressPercent,
    focusedItems,
    completedItems,
    totalAssessments: assessments.length,
  }
}

/**
 * Update user's current role (for onboarding)
 */
export async function setCurrentRole(userId: string, roleId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { currentRoleId: roleId }
  })
}

/**
 * Set user's target role (for onboarding)
 */
export async function setTargetRole(userId: string, roleId: string) {
  // Upsert career goal
  const existingGoal = await prisma.careerGoal.findFirst({
    where: { userId }
  })

  if (existingGoal) {
    await prisma.careerGoal.update({
      where: { id: existingGoal.id },
      data: {
        targetRoleId: roleId,
        status: 'EXPLORING',
        updatedAt: new Date()
      }
    })
  } else {
    await prisma.careerGoal.create({
      data: {
        userId,
        targetRoleId: roleId,
        status: 'EXPLORING'
      }
    })
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

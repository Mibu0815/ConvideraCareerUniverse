'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface PrismaUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  currentRoleId: string | null
  targetRoleId: string | null
}

/**
 * Syncs a Supabase Auth user to the Prisma User table.
 * Creates a new user if not exists, or updates existing user.
 */
export async function syncSupabaseUserToPrisma(
  supabaseUser: SupabaseUser
): Promise<PrismaUser> {
  const email = supabaseUser.email!
  const name = supabaseUser.user_metadata?.name ||
               supabaseUser.user_metadata?.full_name ||
               email.split('@')[0]
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null

  // Upsert: create if not exists, update if exists
  // Use Supabase user ID for consistency between auth and database
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      avatarUrl,
      updatedAt: new Date(),
    },
    create: {
      id: supabaseUser.id, // Use Supabase Auth ID
      email,
      name,
      avatarUrl,
      updatedAt: new Date(),
    },
  })

  return user as PrismaUser
}

/**
 * Gets the current authenticated user's Prisma record.
 * Creates/syncs if necessary.
 */
export async function getCurrentUser(): Promise<PrismaUser | null> {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  if (!supabaseUser?.email) {
    return null
  }

  // Ensure user exists in Prisma
  return syncSupabaseUserToPrisma(supabaseUser)
}

/**
 * Updates the user's current role (for onboarding)
 */
export async function updateUserCurrentRole(
  userId: string,
  roleId: string
): Promise<PrismaUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      currentRoleId: roleId,
      updatedAt: new Date(),
    },
  })

  return user as PrismaUser
}

/**
 * Updates the user's target role
 */
export async function updateUserTargetRole(
  userId: string,
  roleId: string | null
): Promise<PrismaUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      targetRoleId: roleId,
      updatedAt: new Date(),
    },
  })

  return user as PrismaUser
}

/**
 * Checks if user has completed onboarding
 */
export async function checkOnboardingStatus(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { currentRoleId: true },
  })

  return !!user?.currentRoleId
}

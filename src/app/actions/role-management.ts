'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/require-user'
import { isAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import type { RoleLevel, User } from '@prisma/client'

function assertAdmin(user: User) {
  if (!isAdmin(user)) throw new Error('Nur Admins dürfen Rollen verwalten')
}

export async function createRole(input: {
  title: string
  slug: string
  level: RoleLevel
  occupationalFieldSlug: string
  description?: string
  hasLeadership?: boolean
}) {
  const user = await requireUser()
  assertAdmin(user)

  const field = await prisma.occupationalField.findUnique({
    where: { slug: input.occupationalFieldSlug },
  })
  if (!field) throw new Error('Occupational Field nicht gefunden')

  const existing = await prisma.role.findUnique({ where: { slug: input.slug } })
  if (existing) throw new Error(`Rolle mit Slug "${input.slug}" existiert bereits`)

  const role = await prisma.role.create({
    data: {
      title: input.title,
      slug: input.slug,
      level: input.level,
      description: input.description ?? null,
      hasLeadership: input.hasLeadership ?? false,
      fieldId: field.id,
      updatedAt: new Date(),
    },
  })

  revalidatePath('/profile')
  return role
}

export async function updateRole(input: {
  roleId: string
  title?: string
  description?: string
  hasLeadership?: boolean
  level?: RoleLevel
}) {
  const user = await requireUser()
  assertAdmin(user)

  const role = await prisma.role.update({
    where: { id: input.roleId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.hasLeadership !== undefined && { hasLeadership: input.hasLeadership }),
      ...(input.level !== undefined && { level: input.level }),
      updatedAt: new Date(),
    },
  })

  revalidatePath('/profile')
  return role
}

export async function deleteRole(roleId: string) {
  const user = await requireUser()
  assertAdmin(user)

  const usersOnRole = await prisma.user.count({
    where: { currentRoleId: roleId },
  })
  if (usersOnRole > 0) {
    throw new Error(`Rolle kann nicht gelöscht werden: ${usersOnRole} User sind aktuell zugeordnet`)
  }

  await prisma.role.delete({ where: { id: roleId } })
  revalidatePath('/profile')
}

export async function addRoleSkill(input: {
  roleId: string
  skillId: string
  requiredLevel: number
}) {
  const user = await requireUser()
  assertAdmin(user)

  if (input.requiredLevel < 1 || input.requiredLevel > 4) {
    throw new Error('Level muss zwischen 1 und 4 liegen')
  }

  await prisma.roleSkill.upsert({
    where: { roleId_skillId: { roleId: input.roleId, skillId: input.skillId } },
    update: { minLevel: input.requiredLevel },
    create: {
      roleId: input.roleId,
      skillId: input.skillId,
      minLevel: input.requiredLevel,
    },
  })

  revalidatePath('/profile')
}

export async function removeRoleSkill(roleId: string, skillId: string) {
  const user = await requireUser()
  assertAdmin(user)

  await prisma.roleSkill.delete({
    where: { roleId_skillId: { roleId, skillId } },
  })

  revalidatePath('/profile')
}

export async function updateRoleSkillLevel(input: {
  roleId: string
  skillId: string
  requiredLevel: number
}) {
  const user = await requireUser()
  assertAdmin(user)

  if (input.requiredLevel < 1 || input.requiredLevel > 4) {
    throw new Error('Level muss zwischen 1 und 4 liegen')
  }

  await prisma.roleSkill.update({
    where: { roleId_skillId: { roleId: input.roleId, skillId: input.skillId } },
    data: { minLevel: input.requiredLevel },
  })

  revalidatePath('/profile')
}

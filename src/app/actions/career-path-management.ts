'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/require-user'
import { isAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import type { User } from '@prisma/client'

function assertAdmin(user: User) {
  if (!isAdmin(user)) throw new Error('Nur Admins dürfen Karrierepfade verwalten')
}

export async function createCareerPath(input: {
  fromRoleId: string
  toRoleId: string
  isTypical?: boolean
  description?: string
}) {
  const user = await requireUser()
  assertAdmin(user)

  if (input.fromRoleId === input.toRoleId) {
    throw new Error('Rolle kann nicht zu sich selbst führen')
  }

  const path = await prisma.careerPath.create({
    data: {
      fromRoleId: input.fromRoleId,
      toRoleId: input.toRoleId,
      isTypical: input.isTypical ?? true,
      description: input.description ?? null,
    },
  })

  revalidatePath('/profile')
  return path
}

export async function deleteCareerPath(pathId: string) {
  const user = await requireUser()
  assertAdmin(user)

  await prisma.careerPath.delete({ where: { id: pathId } })
  revalidatePath('/profile')
}

export async function getAllCareerPaths() {
  return prisma.careerPath.findMany({
    include: {
      FromRole: { select: { id: true, title: true, level: true } },
      ToRole: { select: { id: true, title: true, level: true } },
    },
    orderBy: [
      { FromRole: { title: 'asc' } },
      { FromRole: { level: 'asc' } },
    ],
  })
}

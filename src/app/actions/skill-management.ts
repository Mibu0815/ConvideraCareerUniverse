'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/require-user'
import { isAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

async function assertFieldOwnerOrAdmin(fieldId: string) {
  const user = await requireUser()
  if (isAdmin(user)) return user

  const field = await prisma.competenceField.findUnique({ where: { id: fieldId } })
  if (!field || field.ownerId !== user.id) {
    throw new Error('Keine Berechtigung für dieses Kompetenzfeld')
  }
  return user
}

export async function addSkill(input: {
  competenceFieldId: string
  title: string
  slug: string
  description?: string
}) {
  await assertFieldOwnerOrAdmin(input.competenceFieldId)

  const existing = await prisma.skill.findUnique({ where: { slug: input.slug } })
  if (existing) throw new Error(`Skill mit Slug "${input.slug}" existiert bereits`)

  const skill = await prisma.skill.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      fieldId: input.competenceFieldId,
    },
  })

  revalidatePath('/profile')
  revalidatePath('/admin/skills')
  return skill
}

export async function updateSkill(input: {
  skillId: string
  title?: string
  description?: string
}) {
  const user = await requireUser()

  const skill = await prisma.skill.findUnique({
    where: { id: input.skillId },
    include: { CompetenceField: true },
  })
  if (!skill) throw new Error('Skill nicht gefunden')

  if (!isAdmin(user) && skill.CompetenceField.ownerId !== user.id) {
    throw new Error('Keine Berechtigung')
  }

  const updated = await prisma.skill.update({
    where: { id: input.skillId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
    },
  })

  revalidatePath('/profile')
  return updated
}

export async function createCompetenceField(input: {
  title: string
  slug: string
  ownerId?: string
  color?: string
}) {
  const user = await requireUser()
  if (!isAdmin(user)) throw new Error('Nur Admins können Kompetenzfelder anlegen')

  const field = await prisma.competenceField.create({
    data: {
      title: input.title,
      slug: input.slug,
      color: input.color,
      ownerId: input.ownerId,
    },
  })

  revalidatePath('/profile')
  revalidatePath('/admin/skills')
  return field
}

export async function assignDomainExpert(input: {
  competenceFieldId: string
  userId: string
}) {
  const user = await requireUser()
  if (!isAdmin(user)) throw new Error('Nur Admins können Domain Experten zuweisen')

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { platformRole: 'FUNCTIONAL_LEAD' },
    }),
    prisma.competenceField.update({
      where: { id: input.competenceFieldId },
      data: { ownerId: input.userId },
    }),
  ])

  revalidatePath('/profile')
  revalidatePath('/admin')
}

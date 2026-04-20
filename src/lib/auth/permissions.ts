import type { User } from '@prisma/client'

export function isAdmin(user: Pick<User, 'platformRole'>) {
  return user.platformRole === 'ADMIN'
}

export function isDomainExpert(user: Pick<User, 'platformRole'>) {
  return user.platformRole === 'FUNCTIONAL_LEAD' || user.platformRole === 'ADMIN'
}

export function canValidateEvidence(user: Pick<User, 'platformRole'>) {
  return isDomainExpert(user)
}

export function canManageRoles(user: Pick<User, 'platformRole'>) {
  return isAdmin(user)
}

export function canManageCareerPaths(user: Pick<User, 'platformRole'>) {
  return isAdmin(user)
}

export function canManageTeam(user: Pick<User, 'platformRole'>) {
  return isAdmin(user)
}

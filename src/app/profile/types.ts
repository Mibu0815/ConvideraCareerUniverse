import type { PlatformRole, RoleLevel } from '@prisma/client'

export interface ProfileUser {
  id: string
  name: string | null
  email: string
  platformRole: PlatformRole
  currentRole: { title: string; level: RoleLevel } | null
  careerGoal: { targetRole: { title: string; level: RoleLevel } } | null
  ownedFields: OwnedField[]
}

export interface OwnedField {
  id: string
  title: string
  slug: string
  skills: SkillSummary[]
}

export interface SkillSummary {
  id: string
  title: string
}

export interface PendingValidation {
  id: string
  selfLevel: number
  user: { id: string; name: string | null; email: string }
  skill: { id: string; title: string; fieldTitle: string }
}

export interface AdminCompetenceField {
  id: string
  title: string
  slug: string
  ownerId: string | null
  ownerName: string | null
  skills: SkillSummary[]
}

export interface AdminUserRow {
  id: string
  name: string | null
  email: string
  platformRole: PlatformRole
  currentRole: { title: string; level: RoleLevel } | null
}

export interface AssessmentStats {
  validated: number
  pending: number
  selfAssessed: number
}

export type { AdminRole, AdminOccupationalField, AdminSkill } from '@/components/admin/RolesManagementPanel'
export type { AdminCareerPath, AdminPathRole } from '@/components/admin/CareerPathsPanel'

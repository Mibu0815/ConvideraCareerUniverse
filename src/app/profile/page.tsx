import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { isAdmin, isDomainExpert } from '@/lib/auth/permissions'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      CareerGoal: {
        where: { status: { in: ['COMMITTED', 'EXPLORING'] } },
        include: { Role: true },
        orderBy: [{ status: 'asc' }, { priority: 'asc' }],
        take: 1,
      },
      SkillAssessment: {
        select: { id: true, selfLevel: true, validatedLevel: true },
      },
      Evidence: {
        select: { id: true, status: true },
      },
      OwnedCompetenceFields: {
        include: {
          Skill: { orderBy: { title: 'asc' } },
        },
        orderBy: { title: 'asc' },
      },
    },
  })

  if (!user) redirect('/auth/login')

  const currentRole = user.currentRoleId
    ? await prisma.role.findUnique({ where: { id: user.currentRoleId } })
    : null

  const domainExpert = isDomainExpert(user)
  const admin = isAdmin(user)

  const pendingValidations = domainExpert
    ? await prisma.evidence.findMany({
        where: {
          status: 'EVIDENCE_SUBMITTED',
          ...(admin ? {} : {
            skill: {
              CompetenceField: { ownerId: user.id },
            },
          }),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          skill: {
            select: {
              id: true,
              title: true,
              CompetenceField: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    : []

  const allCompetenceFields = admin
    ? await prisma.competenceField.findMany({
        include: {
          Skill: { orderBy: { title: 'asc' } },
          Owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { title: 'asc' },
      })
    : []

  const allUsers = admin
    ? await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          platformRole: true,
          currentRoleId: true,
        },
        orderBy: { name: 'asc' },
      })
    : []

  const userRoleIds = allUsers
    .map(u => u.currentRoleId)
    .filter((v): v is string => !!v)
  const rolesById = userRoleIds.length
    ? await prisma.role.findMany({
        where: { id: { in: userRoleIds } },
        select: { id: true, title: true, level: true },
      })
    : []
  const roleMap = new Map(rolesById.map(r => [r.id, r]))
  const allUsersWithRole = allUsers.map(u => ({
    ...u,
    currentRole: u.currentRoleId ? roleMap.get(u.currentRoleId) ?? null : null,
  }))

  const adminRolesRaw = admin
    ? await prisma.role.findMany({
        include: {
          OccupationalField: { select: { title: true, slug: true } },
          RoleSkill: {
            include: {
              Skill: {
                include: { CompetenceField: { select: { title: true } } },
              },
            },
          },
        },
        orderBy: [{ OccupationalField: { title: 'asc' } }, { level: 'asc' }],
      })
    : []

  const adminOccupationalFieldsRaw = admin
    ? await prisma.occupationalField.findMany({ orderBy: { title: 'asc' } })
    : []

  const adminSkillsRaw = admin
    ? await prisma.skill.findMany({
        include: { CompetenceField: { select: { title: true } } },
        orderBy: { title: 'asc' },
      })
    : []

  const adminCareerPathsRaw = admin
    ? await prisma.careerPath.findMany({
        include: {
          FromRole: {
            select: {
              id: true,
              title: true,
              level: true,
              OccupationalField: { select: { title: true } },
            },
          },
          ToRole: { select: { id: true, title: true, level: true } },
        },
      })
    : []

  const evidenceStatuses = user.Evidence.map(e => e.status)
  const assessmentStats = {
    validated: evidenceStatuses.filter(s => s === 'VALIDATED').length,
    pending: evidenceStatuses.filter(s => s === 'EVIDENCE_SUBMITTED').length,
    selfAssessed: user.SkillAssessment.filter(a => a.validatedLevel == null).length,
  }

  return (
    <>
      <Navigation
        userName={user.name}
        platformRole={user.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <div className="min-h-screen bg-gray-50 pt-16">
        <ProfileClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            platformRole: user.platformRole,
            currentRole: currentRole
              ? { title: currentRole.title, level: currentRole.level }
              : null,
            careerGoal: user.CareerGoal[0]
              ? {
                  targetRole: {
                    title: user.CareerGoal[0].Role.title,
                    level: user.CareerGoal[0].Role.level,
                  },
                }
              : null,
            ownedFields: user.OwnedCompetenceFields.map(f => ({
              id: f.id,
              title: f.title,
              slug: f.slug,
              skills: f.Skill.map(s => ({ id: s.id, title: s.title })),
            })),
          }}
          pendingValidations={pendingValidations.map(ev => ({
            id: ev.id,
            selfLevel: ev.selfLevel,
            user: ev.user,
            skill: {
              id: ev.skill.id,
              title: ev.skill.title,
              fieldTitle: ev.skill.CompetenceField.title,
            },
          }))}
          allCompetenceFields={allCompetenceFields.map(f => ({
            id: f.id,
            title: f.title,
            slug: f.slug,
            ownerId: f.ownerId,
            ownerName: f.Owner?.name ?? null,
            skills: f.Skill.map(s => ({ id: s.id, title: s.title })),
          }))}
          allUsers={allUsersWithRole}
          assessmentStats={assessmentStats}
          isAdmin={admin}
          isDomainExpert={domainExpert}
          adminRoles={adminRolesRaw.map(r => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            level: r.level,
            description: r.description,
            hasLeadership: r.hasLeadership,
            fieldId: r.fieldId,
            occupationalField: r.OccupationalField
              ? { title: r.OccupationalField.title, slug: r.OccupationalField.slug }
              : null,
            requiredSkills: r.RoleSkill.map(rs => ({
              skillId: rs.skillId,
              requiredLevel: rs.minLevel,
              skill: {
                id: rs.Skill.id,
                title: rs.Skill.title,
                competenceFieldTitle: rs.Skill.CompetenceField.title,
              },
            })),
          }))}
          adminPathRoles={adminRolesRaw.map(r => ({
            id: r.id,
            title: r.title,
            level: r.level,
            occupationalField: r.OccupationalField
              ? { title: r.OccupationalField.title }
              : null,
          }))}
          adminOccupationalFields={adminOccupationalFieldsRaw.map(f => ({
            id: f.id,
            slug: f.slug,
            title: f.title,
          }))}
          adminSkills={adminSkillsRaw.map(s => ({
            id: s.id,
            title: s.title,
            competenceFieldTitle: s.CompetenceField.title,
          }))}
          adminCareerPaths={adminCareerPathsRaw.map(p => ({
            id: p.id,
            fromRoleId: p.fromRoleId,
            toRoleId: p.toRoleId,
            isTypical: p.isTypical,
            description: p.description,
            fromRole: {
              id: p.FromRole.id,
              title: p.FromRole.title,
              level: p.FromRole.level,
            },
            toRole: {
              id: p.ToRole.id,
              title: p.ToRole.title,
              level: p.ToRole.level,
            },
          }))}
        />
      </div>
    </>
  )
}

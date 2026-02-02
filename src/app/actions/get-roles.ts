// src/app/actions/get-roles.ts
'use server';

import { prisma } from '@/lib/prisma';

export interface RoleOption {
  id: string;
  title: string;
  level: string;
  hasLeadership: boolean;
  leadershipType: string | null;
}

export interface GroupedRoles {
  fieldId: string;
  fieldName: string;
  roles: RoleOption[];
}

export async function getRoles(): Promise<GroupedRoles[]> {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      title: true,
      level: true,
      hasLeadership: true,
      leadershipType: true,
      occupationalField: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { occupationalField: { title: 'asc' } },
      { level: 'asc' },
      { title: 'asc' },
    ],
  });

  // Gruppiere nach Occupational Field
  const groupedMap = new Map<string, GroupedRoles>();

  for (const role of roles) {
    const fieldId = role.occupationalField.id;
    const fieldName = role.occupationalField.title;

    if (!groupedMap.has(fieldId)) {
      groupedMap.set(fieldId, {
        fieldId,
        fieldName,
        roles: [],
      });
    }

    groupedMap.get(fieldId)!.roles.push({
      id: role.id,
      title: role.title,
      level: role.level,
      hasLeadership: role.hasLeadership,
      leadershipType: role.leadershipType,
    });
  }

  return Array.from(groupedMap.values());
}

export async function getRoleById(roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      occupationalField: true,
      roleSkills: {
        include: {
          skill: {
            include: {
              competenceField: true,
            },
          },
        },
      },
      softSkills: true,
      responsibilities: {
        orderBy: { order: 'asc' },
      },
    },
  });
}

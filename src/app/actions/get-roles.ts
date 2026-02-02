// src/app/actions/get-roles.ts
'use server';

import { unstable_cache } from 'next/cache';

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

// Lazy import prisma to prevent initialization during build
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// Cache the roles data for 5 minutes (300 seconds)
// This dramatically improves page load time
const getCachedRoles = unstable_cache(
  async (): Promise<GroupedRoles[]> => {
    const prisma = await getPrisma();
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
  },
  ['roles-list'],
  {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['roles'],
  }
);

export async function getRoles(): Promise<GroupedRoles[]> {
  return getCachedRoles();
}

// Cache individual role lookups for 5 minutes
const getCachedRoleById = unstable_cache(
  async (roleId: string) => {
    const prisma = await getPrisma();
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
  },
  ['role-by-id'],
  {
    revalidate: 300,
    tags: ['roles'],
  }
);

export async function getRoleById(roleId: string) {
  return getCachedRoleById(roleId);
}

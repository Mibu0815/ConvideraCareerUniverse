// src/app/api/skills/route.ts
// Fetch all skills grouped by competence field

import { NextRequest, NextResponse } from 'next/server';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const searchParams = request.nextUrl.searchParams;
    const competenceFieldId = searchParams.get('competenceFieldId');

    const skills = await prisma.skill.findMany({
      where: competenceFieldId ? { fieldId: competenceFieldId } : undefined,
      include: {
        CompetenceField: true,
      },
      orderBy: [
        { CompetenceField: { title: 'asc' } },
        { title: 'asc' },
      ],
    });

    const formattedSkills = skills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      slug: skill.slug,
      description: skill.description,
      competenceField: skill.CompetenceField.title,
      competenceFieldId: skill.fieldId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedSkills,
      count: formattedSkills.length,
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

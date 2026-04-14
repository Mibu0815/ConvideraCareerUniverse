// @ts-nocheck
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { enrichSkillDescription, type EnrichedSkillDescription } from '@/lib/services/skill-enrichment';
import { searchSmartResources, type ResourceSearchResult } from '@/lib/services/smart-resources';
import { generateModernImpulse, type ModernImpulse } from '@/lib/services/modern-impulse-generator';
import { revalidatePath } from 'next/cache';

// ============================================================================
// PROJECT REFERENCE TYPES
// ============================================================================

export interface ProjectReference {
  projectId: string;
  projectName: string;
  clientName?: string;
  role: string;
  contribution: string;
  skills: string[];
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  impactDescription?: string;
}

// ============================================================================
// PROJECT REFERENCE MANAGEMENT
// ============================================================================

/**
 * Add a project reference to a learning focus (real-world experience tracking)
 */
export async function addProjectReference(
  focusId: string,
  userId: string,
  projectRef: Omit<ProjectReference, 'projectId'>
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    // Verify user owns this focus
    const focus = await prisma.learningFocus.findFirst({
      where: {
        id: focusId,
        LearningPlan: { userId },
      },
    });

    if (!focus) {
      return { success: false, error: 'Learning Focus nicht gefunden' };
    }

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const currentRefs = (focus.internalProjectRefs as unknown as ProjectReference[]) || [];
    const newRef: ProjectReference = {
      ...projectRef,
      projectId,
    };

    await prisma.learningFocus.update({
      where: { id: focusId },
      data: {
        internalProjectRefs: [...currentRefs, newRef] as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/learning-journey');
    return { success: true, projectId };
  } catch (error) {
    console.error('Failed to add project reference:', error);
    return { success: false, error: 'Fehler beim Hinzufügen der Projektreferenz' };
  }
}

/**
 * Remove a project reference from a learning focus
 */
export async function removeProjectReference(
  focusId: string,
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const focus = await prisma.learningFocus.findFirst({
      where: {
        id: focusId,
        LearningPlan: { userId },
      },
    });

    if (!focus) {
      return { success: false, error: 'Learning Focus nicht gefunden' };
    }

    const currentRefs = (focus.internalProjectRefs as unknown as ProjectReference[]) || [];
    const updatedRefs = currentRefs.filter((ref) => ref.projectId !== projectId);

    await prisma.learningFocus.update({
      where: { id: focusId },
      data: {
        internalProjectRefs: updatedRefs as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/learning-journey');
    return { success: true };
  } catch (error) {
    console.error('Failed to remove project reference:', error);
    return { success: false, error: 'Fehler beim Entfernen der Projektreferenz' };
  }
}

/**
 * Get project references for a learning focus
 */
export async function getProjectReferences(
  focusId: string,
  userId: string
): Promise<ProjectReference[]> {
  const focus = await prisma.learningFocus.findFirst({
    where: {
      id: focusId,
      LearningPlan: { userId },
    },
  });

  return (focus?.internalProjectRefs as unknown as ProjectReference[]) || [];
}

// ============================================================================
// SKILL ENRICHMENT
// ============================================================================

/**
 * Get or generate enriched skill description with modern aspects
 */
export async function getEnrichedSkillDescription(
  focusId: string,
  userId: string,
  forceRefresh = false
): Promise<EnrichedSkillDescription | null> {
  try {
    const focus = await prisma.learningFocus.findFirst({
      where: {
        id: focusId,
        LearningPlan: { userId },
      },
      include: {
        Skill: true,
        CompetenceField: true,
      },
    });

    if (!focus) return null;

    // Check cache
    const cached = focus.enrichedDescription as EnrichedSkillDescription | null;
    if (cached && !forceRefresh) {
      // Cache valid for 7 days
      const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
      if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Generate new enriched description
    const enriched = await enrichSkillDescription(
      focus.Skill.title,
      focus.Skill.description,
      focus.CompetenceField.title
    );

    // Cache the result
    await prisma.learningFocus.update({
      where: { id: focusId },
      data: {
        enrichedDescription: enriched as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return enriched;
  } catch (error) {
    console.error('Failed to get enriched skill description:', error);
    return null;
  }
}

// ============================================================================
// SMART RESOURCES
// ============================================================================

/**
 * Get or generate smart resource recommendations
 */
export async function getSmartResources(
  focusId: string,
  userId: string,
  forceRefresh = false
): Promise<ResourceSearchResult | null> {
  try {
    const focus = await prisma.learningFocus.findFirst({
      where: {
        id: focusId,
        LearningPlan: { userId },
      },
      include: {
        Skill: true,
        CompetenceField: true,
      },
    });

    if (!focus) return null;

    // Check cache
    const cached = focus.smartResources as ResourceSearchResult | null;
    if (cached && !forceRefresh) {
      // Cache valid for 24 hours
      const cacheAge = Date.now() - new Date(cached.searchedAt).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Generate new recommendations
    const resources = await searchSmartResources(
      focus.Skill.title,
      focus.currentLevel,
      [focus.CompetenceField.title]
    );

    // Cache the result
    await prisma.learningFocus.update({
      where: { id: focusId },
      data: {
        smartResources: resources as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return resources;
  } catch (error) {
    console.error('Failed to get smart resources:', error);
    return null;
  }
}

// ============================================================================
// MODERN IMPULSE GENERATION
// ============================================================================

/**
 * Generate a modern, tech-savvy learning impulse
 */
export async function generateSmartImpulse(
  focusId: string,
  userId: string,
  projectContext?: string
): Promise<ModernImpulse | null> {
  try {
    const focus = await prisma.learningFocus.findFirst({
      where: {
        id: focusId,
        LearningPlan: { userId },
      },
      include: {
        Skill: true,
        CompetenceField: true,
      },
    });

    if (!focus) return null;

    // Get recent project refs for context
    const projectRefs = (focus.internalProjectRefs as unknown as ProjectReference[]) || [];
    const recentProject = projectRefs.find((p) => p.isOngoing) || projectRefs[0];
    const contextString = projectContext || (recentProject ? `Projekt: ${recentProject.projectName}` : undefined);

    return generateModernImpulse(
      focus.Skill.title,
      focus.currentLevel,
      focus.targetLevel,
      focus.CompetenceField.title,
      contextString
    );
  } catch (error) {
    console.error('Failed to generate smart impulse:', error);
    return null;
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Refresh all cached data for a user's learning focuses
 */
export async function refreshAllSkillData(userId: string): Promise<{
  enriched: number;
  resources: number;
  errors: number;
}> {
  const focuses = await prisma.learningFocus.findMany({
    where: {
      LearningPlan: { userId },
      status: { in: ['IN_PROGRESS', 'NOT_STARTED'] },
    },
    include: {
      Skill: true,
      CompetenceField: true,
    },
    take: 10, // Limit to prevent rate limiting
  });

  let enriched = 0;
  let resources = 0;
  let errors = 0;

  for (const focus of focuses) {
    try {
      await getEnrichedSkillDescription(focus.id, userId, true);
      enriched++;
    } catch {
      errors++;
    }

    try {
      await getSmartResources(focus.id, userId, true);
      resources++;
    } catch {
      errors++;
    }

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  revalidatePath('/learning-journey');
  return { enriched, resources, errors };
}

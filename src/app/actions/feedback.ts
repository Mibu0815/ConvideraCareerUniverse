'use server';

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface FeedbackSummary {
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  recentComments: {
    id: string;
    rating: string;
    comment: string | null;
    contextSkill: string | null;
    contextType: string;
    createdAt: Date;
  }[];
}

// ============================================================================
// SUBMIT FEEDBACK
// ============================================================================

export async function submitFeedback(
  userId: string,
  rating: 'positive' | 'negative',
  comment: string | null,
  contextSkill: string | null,
  contextType: 'impulse_completed' | 'skill_started'
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.feedback.create({
      data: {
        userId,
        rating,
        comment: comment?.trim() || null,
        contextSkill,
        contextType,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { success: false, error: 'Failed to save feedback' };
  }
}

// ============================================================================
// GET RECENT FEEDBACK (ANONYMIZED FOR ADMIN)
// ============================================================================

export async function getRecentFeedback(limit: number = 20): Promise<FeedbackSummary> {
  try {
    const [feedbacks, positiveCount, negativeCount, totalCount] = await Promise.all([
      // Recent feedbacks with comments (anonymized - no userId returned)
      prisma.feedback.findMany({
        where: {
          comment: { not: null },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          contextSkill: true,
          contextType: true,
          createdAt: true,
          // Explicitly NOT selecting userId for anonymization
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // Count positive
      prisma.feedback.count({
        where: { rating: 'positive' },
      }),
      // Count negative
      prisma.feedback.count({
        where: { rating: 'negative' },
      }),
      // Total count
      prisma.feedback.count(),
    ]);

    return {
      totalCount,
      positiveCount,
      negativeCount,
      recentComments: feedbacks,
    };
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return {
      totalCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      recentComments: [],
    };
  }
}

// ============================================================================
// GET FEEDBACK STATS
// ============================================================================

export async function getFeedbackStats(): Promise<{
  totalFeedback: number;
  positivePercentage: number;
  thisWeekCount: number;
  topSkillMentions: { skill: string; count: number }[];
}> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [total, positive, thisWeek, skillMentions] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { rating: 'positive' } }),
      prisma.feedback.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.feedback.groupBy({
        by: ['contextSkill'],
        where: { contextSkill: { not: null } },
        _count: { contextSkill: true },
        orderBy: { _count: { contextSkill: 'desc' } },
        take: 5,
      }),
    ]);

    const topSkillMentions = skillMentions
      .filter((s) => s.contextSkill)
      .map((s) => ({
        skill: s.contextSkill!,
        count: s._count.contextSkill,
      }));

    return {
      totalFeedback: total,
      positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
      thisWeekCount: thisWeek,
      topSkillMentions,
    };
  } catch (error) {
    console.error('Failed to fetch feedback stats:', error);
    return {
      totalFeedback: 0,
      positivePercentage: 0,
      thisWeekCount: 0,
      topSkillMentions: [],
    };
  }
}

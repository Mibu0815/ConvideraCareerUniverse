import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getLeadDashboardData } from '@/lib/services/personalized-pathways';
import { getAdminAnalytics } from '@/app/actions/admin-analytics';
import { getRecentFeedback, getFeedbackStats, type FeedbackSummary } from '@/app/actions/feedback';
import { ValidationBadge } from '@/components/shared/ValidationBadge';
import { AdminDashboardView } from './AdminDashboardView';

export const dynamic = 'force-dynamic';

async function getUserWithPlatformRole() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
    },
  });

  return user;
}

export default async function AdminDashboardPage() {
  const user = await getUserWithPlatformRole();

  if (!user) {
    redirect('/auth/login');
  }

  // Check platform role - only FUNCTIONAL_LEAD or ADMIN can access
  if (user.platformRole !== 'FUNCTIONAL_LEAD' && user.platformRole !== 'ADMIN') {
    redirect('/?error=unauthorized');
  }

  // Fetch all data sources in parallel
  const [dashboardData, adminAnalytics, feedbackData, feedbackStats] = await Promise.all([
    getLeadDashboardData(user.id),
    getAdminAnalytics(),
    getRecentFeedback(10),
    getFeedbackStats(),
  ]);

  return (
    <AdminDashboardView
      dashboardData={dashboardData}
      adminAnalytics={adminAnalytics}
      feedbackData={feedbackData}
      feedbackStats={feedbackStats}
      userName={user.name || user.email}
      userRole={user.platformRole}
      platformRole={user.platformRole}
      validationBadge={<ValidationBadge />}
    />
  );
}

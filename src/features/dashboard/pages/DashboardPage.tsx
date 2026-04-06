import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { recommendationsApi, trainingApi, certificatesApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toList } from '@/lib/api';
import { UnifiedRecommendationCard } from '../components/UnifiedRecommendationCard';
import { ProgressCard, ProgressCardSkeleton } from '../components/ProgressCard';
import { QuickActions } from '../components/QuickActions';
import { AlertBanner } from '../components/AlertBanner';
import { PendingFeedbackModal } from '../components/PendingFeedbackModal';
import { MiniCalendar } from '../components/MiniCalendar';

import type { TrainingStats, TrainingRecord } from '@/types';

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  linkTo,
  linkLabel,
}: {
  title: string;
  count?: number;
  linkTo?: string;
  linkLabel?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] font-bold text-foreground">
            {count}
          </span>
        )}
      </div>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          className="flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
        >
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [pendingFeedback, setPendingFeedback] = useState<TrainingRecord[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    trainingApi.getPendingFeedback()
      .then((res) => {
        if (mounted && res.data && res.data.length > 0) {
          setPendingFeedback(res.data);
          setShowFeedbackModal(true);
        }
      })
      .catch((err) => console.error('Failed to fetch pending feedback', err));
    return () => { mounted = false; };
  }, []);

  // 1. Data Fetching
  const {
    data: recs,
    isLoading: recsLoading,
    isError: recsError,
    refetch: recsRefetch,
  } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.getForMe().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: inProgress = [], isLoading: progressLoading, refetch: refetchOngoing } = useQuery({
    queryKey: ['trainings', 'ongoing'],
    queryFn: () => trainingApi.getAll({ status: 'ongoing' }).then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['trainings', 'stats'],
    queryFn: () => trainingApi.getStats().then((r) => r.data as TrainingStats),
    staleTime: 1000 * 60 * 2,
  });

  const { data: renewalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['certificates', 'renewal-alerts'],
    queryFn: () => certificatesApi.getRenewalAlerts().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  const { t } = useTranslation();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.greetingMorning');
    if (h < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  })();

  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Most recent course
  const latestCourse = inProgress[0];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header & Quick Stats ───────────────────────────────────────── */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">{today}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {greeting}{user?.name ? `, ` : ''} <span className="text-blue-600 dark:text-blue-400 font-black">{user?.name ? user.name.split(' ')[0] : ''}</span>
          </h1>
        </div>

        {/* Small header chips instead of large cards */}
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-2 backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-foreground">
              {statsLoading ? '...' : stats?.total ?? 0} <span className="text-muted-foreground font-medium lowercase">formaçōes</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-2 backdrop-blur-md">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-foreground">
              {statsLoading ? '...' : stats?.completed ?? 0} <span className="text-muted-foreground font-medium lowercase">concluídas</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2.5 Alertas ─────────────────────────────────────────────────── */}
      {!alertsLoading && renewalAlerts && (renewalAlerts.expiringAlerts?.length > 0 || renewalAlerts.staleKnowledgeSuggestions?.length > 0) && (
        <AlertBanner data={renewalAlerts} />
      )}

      {/* ── Main Responsive Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left column — 2/3 width — Focus on Discovery */}
        <div className="lg:col-span-2 space-y-8">

          {/* AI Recommendations - Primary Feature */}
          <section className="animate-in fade-in zoom-in-95 duration-500">
            <UnifiedRecommendationCard
              data={recs}
              isLoading={recsLoading}
              isError={recsError}
              onRetry={() => recsRefetch()}
            />
          </section>

          {/* Continuar a Aprender - Smart Focus */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <SectionHeader
              title={t('dashboard.continueLearning', 'Continuar a Aprender')}
              linkTo="/my-learning"
              linkLabel={t('dashboard.viewAll')}
            />
            {progressLoading ? (
              <ProgressCardSkeleton />
            ) : !latestCourse ? (
              <EmptyState
                icon={TrendingUp}
                message={t('dashboard.empty.progress')}
              />
            ) : (
              <div className="relative group">
                {/* High-end decorative glow for active course */}
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <ProgressCard
                  record={latestCourse}
                  variant="progress"
                  onUpdate={refetchOngoing}
                />
              </div>
            )}
          </section>
        </div>

        {/* Right column — 1/3 width — Focus on Utility */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">

          {/* Quick Actions at the top for accessibility */}
          <QuickActions />

          {/* Mini Calendar com Lembretes */}
          <MiniCalendar />
        </div>

      </div>

      {/* Pending Feedback Modal */}
      {showFeedbackModal && pendingFeedback.length > 0 && (
        <PendingFeedbackModal
          courses={pendingFeedback}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

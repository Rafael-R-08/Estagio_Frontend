import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { recommendationsApi, trainingApi, certificatesApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toList } from '@/lib/api';
import { cn } from '@/lib/utils';

import { UnifiedRecommendationCard } from '../components/UnifiedRecommendationCard';
import { ProgressCard, ProgressCardSkeleton } from '../components/ProgressCard';
import { QuickActions } from '../components/QuickActions';
import { AlertBanner } from '../components/AlertBanner';
import { PendingFeedbackModal } from '../components/PendingFeedbackModal';

import type { TrainingStats, TrainingRecord } from '@/types';

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, color, loading }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border/60 bg-muted/40 backdrop-blur-md px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem]', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        {loading ? (
          <div className="space-y-1">
            <div className="h-6 w-12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-black text-foreground leading-none">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mt-1.5 opacity-80">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

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

  // 2.1 — AI Recommendations
  const {
    data: recs,
    isLoading: recsLoading,
    isError: recsError,
    refetch: recsRefetch,
  } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.getForMe().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // 2.2 — Cursos em progresso
  const { data: inProgress = [], isLoading: progressLoading, refetch: refetchOngoing } = useQuery({
    queryKey: ['trainings', 'ongoing'],
    queryFn: () => trainingApi.getAll({ status: 'ongoing' }).then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  // 2.3 — Cursos concluídos
  const { data: completed = [], isLoading: completedLoading, refetch: refetchCompleted } = useQuery({
    queryKey: ['trainings', 'completed'],
    queryFn: () => trainingApi.getAll({ status: 'completed' }).then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 5,
  });

  // 2.4 — Cursos guardados
  const { data: saved = [], isLoading: savedLoading, refetch: refetchSaved } = useQuery({
    queryKey: ['trainings', 'later'],
    queryFn: () => trainingApi.getAll({ status: 'later' }).then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['trainings', 'stats'],
    queryFn: () => trainingApi.getStats().then((r) => r.data as TrainingStats),
    staleTime: 1000 * 60 * 2,
  });

  // 2.5 — Alertas de certificados a expirar e conhecimento obsoleto
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

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">{today}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {greeting}{user?.name ? `, ` : ''} <span className="text-blue-600 dark:text-blue-400">{user?.name ? user.name.split(' ')[0] : ''}</span>
          </h1>
        </div>
      </div>

      {/* ── 2.5 Alertas ─────────────────────────────────────────────────── */}
      {alertsLoading ? (
        <div className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 h-16" />
      ) : renewalAlerts && (renewalAlerts.expiringAlerts?.length > 0 || renewalAlerts.staleKnowledgeSuggestions?.length > 0) && (
        <AlertBanner data={renewalAlerts} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label={t('dashboard.stats.total')}
          value={stats?.total ?? 0}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.stats.ongoing')}
          value={stats?.ongoing ?? 0}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('dashboard.stats.completed')}
          value={stats?.completed ?? 0}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          loading={statsLoading}
        />
        <StatCard
          icon={Bookmark}
          label={t('dashboard.stats.saved')}
          value={stats?.later ?? 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          loading={statsLoading}
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* 2.1 AI Recommendations — Unified Tabbed Card */}
          <div className="mb-6">
            <UnifiedRecommendationCard
              data={recs}
              isLoading={recsLoading}
              isError={recsError}
              onRetry={() => recsRefetch()}
            />
          </div>

          {/* 2.2 Cursos em progresso */}
          <div className="space-y-3">
            <SectionHeader
              title={t('dashboard.inProgress')}
              count={inProgress.length}
              linkTo="/my-learning"
              linkLabel={t('dashboard.viewAll')}
            />
            {progressLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <ProgressCardSkeleton key={i} />
                ))}
              </div>
            ) : inProgress.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                message={t('dashboard.empty.progress')}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {inProgress.slice(0, 4).map((r) => (
                  <ProgressCard key={r.id} record={r} variant="progress" onUpdate={refetchOngoing} />
                ))}
              </div>
            )}
          </div>

          {/* 2.3 Cursos concluídos */}
          <div className="space-y-3">
            <SectionHeader
              title={t('dashboard.completed')}
              count={completed.length}
              linkTo="/my-learning"
              linkLabel={t('dashboard.viewAll')}
            />
            {completedLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <ProgressCardSkeleton key={i} />
                ))}
              </div>
            ) : completed.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                message={t('dashboard.empty.completed')}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {completed.slice(0, 4).map((r) => (
                  <ProgressCard key={r.id} record={r} variant="completed" onUpdate={refetchCompleted} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">
          {/* 2.4 Quick Actions */}
          <QuickActions />

          {/* 2.3 Cursos guardados */}
          <div className="space-y-3">
            <SectionHeader
              title={t('dashboard.saved')}
              count={saved.length}
              linkTo="/my-learning"
            />
            {savedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <ProgressCardSkeleton key={i} />
                ))}
              </div>
            ) : saved.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                message={t('dashboard.empty.saved')}
              />
            ) : (
              <div className="space-y-3">
                {saved.slice(0, 3).map((r) => (
                  <ProgressCard key={r.id} record={r} variant="saved" onUpdate={refetchSaved} />
                ))}
                {saved.length > 3 && (
                  <button
                    onClick={() => {}}
                    className="w-full rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    +{saved.length - 3} mais guardados
                  </button>
                )}
              </div>
            )}
          </div>
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

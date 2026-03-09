import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { recommendationsApi, trainingApi, certificatesApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

import { RecommendationCard } from '../components/RecommendationCard';
import { ProgressCard, ProgressCardSkeleton } from '../components/ProgressCard';
import { QuickActions } from '../components/QuickActions';
import { AlertBanner } from '../components/AlertBanner';

import type { TrainingStats } from '@/types';

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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        {loading ? (
          <div className="space-y-1">
            <div className="h-5 w-10 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <p className="text-lg font-bold text-foreground leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          className="flex items-center gap-1 text-xs font-medium text-primary transition hover:underline"
        >
          {linkLabel ?? 'Ver todos'}
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
  const { data: inProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['trainings', 'ongoing'],
    queryFn: () => trainingApi.getAll({ status: 'ongoing' }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  // 2.3 — Cursos guardados
  const { data: saved = [], isLoading: savedLoading } = useQuery({
    queryKey: ['trainings', 'later'],
    queryFn: () => trainingApi.getAll({ status: 'later' }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['trainings', 'stats'],
    queryFn: () => trainingApi.getStats().then((r) => r.data as TrainingStats),
    staleTime: 1000 * 60 * 2,
  });

  // 2.5 — Alertas de certificados a expirar
  const { data: expiring = [] } = useQuery({
    queryKey: ['certificates', 'expiring'],
    queryFn: () => certificatesApi.getExpiring().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 
          </h1>
          <p className="mt-0.5 text-sm capitalize text-muted-foreground">{today}</p>
        </div>
      </div>

      {/* ── 2.5 Alertas ─────────────────────────────────────────────────── */}
      {expiring.length > 0 && <AlertBanner certs={expiring} />}

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total de formações"
          value={stats?.total ?? 0}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Em progresso"
          value={stats?.ongoing ?? 0}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Concluídas"
          value={stats?.completed ?? 0}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          loading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="Horas de formação"
          value={stats?.totalHours ?? 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          loading={statsLoading}
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* 2.1 AI Recommendations */}
          <RecommendationCard
            data={recs}
            isLoading={recsLoading}
            isError={recsError}
            onRetry={() => recsRefetch()}
          />

          {/* 2.2 Cursos em progresso */}
          <div className="space-y-3">
            <SectionHeader
              title="Em Progresso"
              count={inProgress.length}
              linkTo="/my-learning"
              linkLabel="Ver todos"
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
                message="Nenhuma formação em progresso. Começa a explorar cursos!"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {inProgress.slice(0, 4).map((r) => (
                  <ProgressCard key={r.id} record={r} variant="progress" />
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
              title="Guardados"
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
                message="Nenhum curso guardado ainda."
              />
            ) : (
              <div className="space-y-3">
                {saved.slice(0, 3).map((r) => (
                  <ProgressCard key={r.id} record={r} variant="saved" />
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
    </div>
  );
}

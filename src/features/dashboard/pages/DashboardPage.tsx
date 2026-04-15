import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Briefcase, Layers, Wrench } from 'lucide-react';

import { recommendationsApi, trainingApi, certificatesApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toList } from '@/lib/api';
import { UnifiedRecommendationCard } from '../components/UnifiedRecommendationCard';
import { QuickActions } from '../components/QuickActions';
import { AlertBanner } from '../components/AlertBanner';
import { MiniCalendar } from '../components/MiniCalendar';
import { RecentActivity } from '../components/RecentActivity';
import { cn } from '@/lib/utils';

import type { ExperienceLevel } from '@/types';
import { SERVICE_LINE_LABELS } from '@/types';

// ─── Label maps ───────────────────────────────────────────────────────────────

const LEVEL_ORDER: ExperienceLevel[] = ['junior', 'intermedio', 'senior', 'especialista', 'lider'];

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  // 1. Data Fetching
  const {
    data: recs,
    isLoading: recsLoading,
    isError: recsError,
  } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.getForMe().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allTrainings = [], isLoading: activityLoading } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  const { data: renewalAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['certificates', 'renewal-alerts'],
    queryFn: () => certificatesApi.getRenewalAlerts().then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  const queryClient = useQueryClient();

  const handleRecsRefresh = async () => {
    const res = await recommendationsApi.deleteCache();
    queryClient.setQueryData(['recommendations'], res.data);
  };

  const { t, i18n } = useTranslation();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.greetingMorning');
    if (h < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  })();

  const today = new Date().toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl px-8 py-10">
        {/* Subtle radial gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/[0.06] via-violet-500/[0.04] to-transparent dark:from-blue-500/[0.08] dark:via-violet-500/[0.05]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.05] blur-3xl dark:bg-blue-400/[0.07]" />

        <div className="relative space-y-4">
          {/* Date + greeting */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">{today}</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {greeting}{user?.name ? `, ` : ''}{' '}
              <span className="text-blue-600 dark:text-blue-400 font-black">
                {user?.name ? user.name.split(' ')[0] : ''}
              </span>
            </h1>
          </div>

          {/* Persona chips */}
          <div className="flex flex-wrap items-center gap-2">
            {user?.role && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
                <Briefcase className="h-3 w-3 text-primary/60" />
                {t(`dashboard.roles.${user.role}`)}
              </span>
            )}
            {user?.serviceLine && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
                <Layers className="h-3 w-3 text-violet-500/70" />
                {SERVICE_LINE_LABELS[user.serviceLine]}
              </span>
            )}
            {user?.userFunction && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
                <Wrench className="h-3 w-3 text-amber-500/70" />
                {user.userFunction}
              </span>
            )}
          </div>

          {/* Career progress bar */}
          {user?.experienceLevel && (
            <div className="max-w-xs space-y-1.5">
              <div className="flex items-center justify-between">
                {LEVEL_ORDER.map((lvl, i) => {
                  const current = LEVEL_ORDER.indexOf(user.experienceLevel!);
                  return (
                    <span
                      key={lvl}
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wide transition-colors',
                        i <= current ? 'text-primary' : 'text-muted-foreground/30'
                      )}
                    >
                      {t(`profile.levels.${lvl}`)}
                    </span>
                  );
                })}
              </div>
              <div className="relative h-1 w-full rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                  style={{
                    width: `${((LEVEL_ORDER.indexOf(user.experienceLevel) + 1) / LEVEL_ORDER.length) * 100}%`,
                  }}
                />
                {/* Current position dot */}
                <div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-blue-500 shadow-sm shadow-blue-500/50 transition-all duration-700"
                  style={{
                    left: `${((LEVEL_ORDER.indexOf(user.experienceLevel) + 1) / LEVEL_ORDER.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alertas ───────────────────────────────────────────────────────── */}
      {!alertsLoading && renewalAlerts && (renewalAlerts.expiringAlerts?.length > 0 || renewalAlerts.staleKnowledgeSuggestions?.length > 0) && (
        <AlertBanner data={renewalAlerts} />
      )}

      {/* ── Main Responsive Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-8">

          {/* AI Recommendations */}
          <section className="animate-in fade-in zoom-in-95 duration-500">
            <UnifiedRecommendationCard
              data={recs}
              isLoading={recsLoading}
              isError={recsError}
              onRetry={handleRecsRefresh}
            />
          </section>

          {/* Atividade Recente */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <RecentActivity
              records={allTrainings}
              isLoading={activityLoading}
              max={6}
            />
          </section>
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
          <QuickActions />
          <MiniCalendar />
        </div>

      </div>
    </div>
  );
}

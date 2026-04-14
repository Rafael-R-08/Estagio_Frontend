import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Users, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { slManagerApi } from '../../../services/api';
import { cn } from '../../../lib/utils';
import TeamActivityFeed from '../components/TeamActivityFeed';
import { SERVICE_LINE_LABELS } from '../../../types';
import type { ServiceLine } from '../../../types';

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md px-5 py-4 shadow-sm">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Experience level badge ────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-muted-foreground/40">—</span>;
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {level}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SlManagerPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['sl-manager', 'overview'],
    queryFn: () => slManagerApi.getOverview().then((r) => r.data),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['sl-manager', 'users'],
    queryFn: () => slManagerApi.getUsers().then((r) => r.data),
  });

  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? pt : enUS;
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);

  const lineLabel = overview?.serviceLine
    ? (SERVICE_LINE_LABELS[overview.serviceLine as ServiceLine] ?? overview.serviceLine)
    : null;

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginatedUsers = users.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-blue-600 text-white shadow-sm shadow-blue-600/20">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {t('slManager.title')}
            </h1>
            {lineLabel && (
              <span className="inline-flex items-center rounded-full bg-blue-600/10 border border-blue-600/20 px-3 py-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                {lineLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('slManager.subtitle')}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Users} label={t('slManager.kpi.activeMembers')}
          value={loadingOverview ? '—' : (overview?.activeMembers ?? '—')}
          sub={overview ? t('slManager.kpi.totalSub', { n: overview.totalMembers }) : undefined}
          color="bg-softinsa-blue/10 text-softinsa-blue"
        />
        <KpiCard
          icon={CheckCircle2} label={t('slManager.kpi.completedTrainings')}
          value={loadingOverview ? '—' : (overview?.trainingStats.totalCompleted ?? '—')}
          sub={overview ? t('slManager.kpi.completedSub', { n: overview.trainingStats.completedLast30Days }) : undefined}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Activity} label={t('slManager.kpi.ongoing')}
          value={loadingOverview ? '—' : (overview?.trainingStats.ongoing ?? '—')}
          sub={overview ? t('slManager.kpi.ongoingSub', { avg: overview.trainingStats.avgCompletedPerMember }) : undefined}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Team table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4 bg-background/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t('slManager.table.title')}
          </h2>
          {!loadingUsers && (
            <span className="ml-auto text-xs text-muted-foreground">{t('slManager.table.memberCount', { count: users.length })}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colMember')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colRole')}</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colTrainings')}</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colCerts')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colLastActivity')}</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('slManager.table.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${55 + (i * j) % 35}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {t('slManager.table.empty')}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className={cn('border-b border-border last:border-0 hover:bg-muted/30 transition-colors', !u.isActive && 'opacity-60')}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-softinsa-blue/10 text-softinsa-blue text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-foreground">
                            {u.name}
                            {!u.isActive && (
                              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-500">{t('slManager.detail.inactive')}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-foreground/80">{u.userFunction ?? '—'}</span>
                        <LevelBadge level={u.experienceLevel} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-foreground">{u.trainings.completed}</span>
                        {u.trainings.ongoing > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500">
                            <Clock className="h-3 w-3" />{t('slManager.table.ongoing', { n: u.trainings.ongoing })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-foreground">{u.certificates.active}</span>
                        {u.certificates.expiringSoon > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500">
                            <AlertTriangle className="h-3 w-3" />{t('slManager.table.expiring', { n: u.certificates.expiringSoon })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {u.trainings.lastCompletedAt
                        ? format(parseISO(u.trainings.lastCompletedAt), 'dd MMM yyyy', { locale: dateLocale })
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/sl-manager/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-700 transition-all"
                      >
                        {t('slManager.table.details')}
                        <TrendingUp className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loadingUsers && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('common.back')}
            </button>
            <span className="text-[11px] text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('common.next')}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Activity feed */}
      <TeamActivityFeed />
    </div>
  );
}

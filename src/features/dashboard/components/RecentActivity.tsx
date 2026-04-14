import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { TrainingRecord } from '@/types';
import {
  PlayCircle,
  CheckCircle2,
  Bookmark,
  Timer,
  XCircle,
  Star,
  Activity,
} from 'lucide-react';

// ─── Activity event derivation ────────────────────────────────────────────────

interface ActivityEvent {
  id: string;
  title: string;
  platform?: string;
  action: string;
  actionColor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  date: Date;
  url: string;
}

function deriveEvent(r: TrainingRecord): ActivityEvent {
  // Pick the most meaningful timestamp and label
  if (r.status === 'completed' && r.completedAt) {
    return {
      id: r.id,
      title: r.title,
      platform: r.platform?.name,
      action: 'dashboard.recentActivity.actionCompleted',
      actionColor: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      date: new Date(r.completedAt),
      url: r.url,
    };
  }
  if (r.status === 'ongoing') {
    return {
      id: r.id,
      title: r.title,
      platform: r.platform?.name,
      action: 'dashboard.recentActivity.actionOngoing',
      actionColor: 'text-blue-600 dark:text-blue-400',
      icon: PlayCircle,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      date: new Date(r.startedAt ?? r.createdAt ?? Date.now()),
      url: r.url,
    };
  }
  if ((r.status === 'later' || r.status === 'priority') && r.createdAt) {
    return {
      id: r.id,
      title: r.title,
      platform: r.platform?.name,
      action: r.status === 'priority' ? 'dashboard.recentActivity.actionPriority' : 'dashboard.recentActivity.actionSaved',
      actionColor: r.status === 'priority'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground',
      icon: r.status === 'priority' ? Star : Bookmark,
      iconColor: r.status === 'priority'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground',
      iconBg: r.status === 'priority'
        ? 'bg-amber-100 dark:bg-amber-900/30'
        : 'bg-muted/60',
      date: new Date(r.createdAt),
      url: r.url,
    };
  }
  if (r.status === 'accessed' && r.createdAt) {
    return {
      id: r.id,
      title: r.title,
      platform: r.platform?.name,
      action: 'dashboard.recentActivity.actionAccessed',
      actionColor: 'text-indigo-600 dark:text-indigo-400',
      icon: Timer,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      date: new Date(r.createdAt),
      url: r.url,
    };
  }
  // cancelled or fallback
  return {
    id: r.id,
    title: r.title,
    platform: r.platform?.name,
    action: 'dashboard.recentActivity.actionCancelled',
    actionColor: 'text-red-500 dark:text-red-400',
    icon: XCircle,
    iconColor: 'text-red-500 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    date: r.createdAt ? new Date(r.createdAt) : new Date(0),
    url: r.url,
  };
}

function relativeTime(date: Date, t: (key: string, opts?: Record<string, unknown>) => string, locale: string): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return t('dashboard.recentActivity.justNow');
  if (mins < 60) return t('dashboard.recentActivity.minutesAgo', { n: mins });
  if (hours < 24) return t('dashboard.recentActivity.hoursAgo', { n: hours });
  if (days === 1) return t('dashboard.recentActivity.yesterday');
  if (days < 7) return t('dashboard.recentActivity.daysAgo', { n: days });
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentActivityProps {
  records: TrainingRecord[];
  isLoading?: boolean;
  max?: number;
}

export function RecentActivity({ records, isLoading, max = 5 }: RecentActivityProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  if (isLoading) return <RecentActivitySkeleton />;

  // Sort all records by most recent meaningful date, take top `max`
  const events = records
    .map(deriveEvent)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, max);

  if (events.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-border/60 bg-background/20 p-8 flex flex-col items-center justify-center gap-2 text-center">
        <Activity className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">{t('dashboard.recentActivity.empty')}</p>
        <button
          onClick={() => navigate('/search')}
          className="mt-1 text-xs font-bold text-primary hover:underline"
        >
          {t('dashboard.recentActivity.exploreCourses')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              {t('dashboard.recentActivity.title')}
            </p>
            <p className="text-sm font-black tracking-tight text-foreground leading-tight">
              {t('dashboard.recentActivity.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/my-learning')}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          {t('dashboard.recentActivity.viewAll')}
        </button>
      </div>

      {/* Feed */}
      <div className="divide-y divide-border/30">
        {events.map((ev, idx) => {
          const Icon = ev.icon;
          return (
            <a
              key={ev.id}
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30',
                idx === 0 && 'bg-primary/[0.02]'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                ev.iconBg,
              )}>
                <Icon className={cn('h-3.5 w-3.5', ev.iconColor)} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                  {ev.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('text-[10px] font-bold', ev.actionColor)}>
                    {t(ev.action)}
                  </span>
                  {ev.platform && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">
                        {ev.platform}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                {relativeTime(ev.date, t, locale)}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

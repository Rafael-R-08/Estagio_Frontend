import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { TrainingRecord, TrainingStats } from '@/types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats decimal hours into a readable string: "2h 30m", "45min", "—" */
function formatHoursDisplay(h: number): string {
  if (!h || h <= 0) return '—';
  if (h < 1) {
    const mins = Math.round(h * 60);
    return `${mins}min`;
  }
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function computeMonthlyHours(timeline: TrainingRecord[], monthLabels?: string[]): { label: string; hours: number }[] {
  const labels = monthLabels ?? MONTH_LABELS;
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const hours = timeline
      .filter((t) => {
        if (!t.completedAt) return false;
        const c = new Date(t.completedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((sum, t) => sum + (t.durationHours || 0), 0);
    return { label: labels[d.getMonth()], hours };
  });
}

export function computeStreak(timeline: TrainingRecord[]): number {
  const dates = new Set(
    timeline.filter((t) => t.completedAt).map((t) => new Date(t.completedAt!).toDateString()),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

const COMPANY_AVG_HOURS = 42;

export function LearningImpactCard({ stats, timeline }: { stats?: TrainingStats; timeline: TrainingRecord[] }) {
  const { t } = useTranslation();
  const monthlyHours = useMemo(() => computeMonthlyHours(timeline, (t('profile.months', { returnObjects: true }) as string[])), [timeline, t]);
  const streak = useMemo(() => computeStreak(timeline), [timeline]);
  const maxBarHours = Math.max(...monthlyHours.map((m) => m.hours), 1);

  // Derive completed count from the actual timeline array — more reliable than stats endpoint
  const completedCount = timeline.length;

  // Compute totalHours from timeline (populated after durationHours fix); fall back to stats
  const computedHours = useMemo(
    () => timeline.reduce((sum, t) => sum + (t.durationHours || 0), 0),
    [timeline],
  );
  const userHours = computedHours || stats?.totalHours || 0;
  const comparisonMax = Math.max(userHours, COMPANY_AVG_HOURS, 1);

  return (
    <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-2xl backdrop-blur-2xl overflow-hidden">
      <div className="border-b border-border/40 px-6 py-4 bg-muted/10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{t('profile.impact.section')}</h2>
        <p className="font-black text-foreground tracking-tight">{t('profile.impact.title')}</p>
      </div>
      <div className="space-y-8 p-6">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
            <p className="text-xl font-black text-foreground">{formatHoursDisplay(userHours)}</p>
            <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{t('profile.impact.totalHours')}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
            <p className="text-xl font-black text-foreground">{completedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{t('profile.impact.coursesCompleted')}</p>
          </div>
          <div className={cn('rounded-2xl p-4 border border-border/40 transition-colors', streak > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50' : 'bg-muted/40')}>
            <p className={cn('text-xl font-black', streak > 0 ? 'text-amber-500' : 'text-foreground')}>
              {streak} {streak > 0 && '🔥'}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{t('profile.impact.streak')}</p>
          </div>
        </div>

        {/* Bar chart — horas por mês */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">{t('profile.impact.hoursPerMonth')}</p>
          <div className="flex h-24 items-end gap-1.5">
            {monthlyHours.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                {m.hours > 0 && (
                  <span className="text-[9px] font-medium text-muted-foreground">{formatHoursDisplay(m.hours)}</span>
                )}
                <div className="flex w-full flex-1 items-end rounded-sm bg-muted/50">
                  <div
                    className="w-full rounded-sm bg-primary transition-all duration-500"
                    style={{ height: `${Math.max((m.hours / maxBarHours) * 100, m.hours > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparação com empresa */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">{t('profile.impact.companyComparison')}</p>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{t('profile.impact.you')}</span>
                <span className="text-xs text-muted-foreground">{formatHoursDisplay(userHours)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(userHours / comparisonMax) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('profile.impact.companyAvg')}</span>
                <span className="text-xs text-muted-foreground">{COMPANY_AVG_HOURS}h</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-muted-foreground/40 transition-all duration-500"
                  style={{ width: `${(COMPANY_AVG_HOURS / comparisonMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/50">
            {t('profile.impact.companyNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

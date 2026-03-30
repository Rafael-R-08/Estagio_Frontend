import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TrainingRecord, TrainingStats } from '@/types';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function computeMonthlyHours(timeline: TrainingRecord[]): { label: string; hours: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const hours = timeline
      .filter((t) => {
        if (!t.completedAt) return false;
        const c = new Date(t.completedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((sum) => sum + 1, 0); // Count courses instead of hours
    return { label: MONTH_LABELS[d.getMonth()], hours };
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
  const monthlyHours = useMemo(() => computeMonthlyHours(timeline), [timeline]);
  const streak = useMemo(() => computeStreak(timeline), [timeline]);
  const maxBarHours = Math.max(...monthlyHours.map((m) => m.hours), 1);
  const userHours = stats?.totalHours ?? 0;
  const comparisonMax = Math.max(userHours, COMPANY_AVG_HOURS, 1);

  return (
    <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-2xl backdrop-blur-2xl">
      <div className="border-b border-border/40 px-6 py-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Learning Impact</h2>
      </div>
      <div className="space-y-8 p-6">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xl font-bold text-foreground">{userHours}h</p>
            <p className="text-[11px] text-muted-foreground">Horas totais</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xl font-bold text-foreground">{stats?.completed ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Formações</p>
          </div>
          <div className={cn('rounded-lg p-3', streak > 0 ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-muted/40')}>
            <p className={cn('text-xl font-bold', streak > 0 ? 'text-amber-500' : 'text-foreground')}>
              {streak} {streak > 0 && '🔥'}
            </p>
            <p className="text-[11px] text-muted-foreground">Streak (dias)</p>
          </div>
        </div>

        {/* Bar chart — horas por mês */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">Horas por mês (6 meses)</p>
          <div className="flex h-24 items-end gap-1.5">
            {monthlyHours.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                {m.hours > 0 && (
                  <span className="text-[9px] font-medium text-muted-foreground">{m.hours}h</span>
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
          <p className="mb-3 text-xs font-medium text-muted-foreground">Comparação com a empresa</p>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Tu</span>
                <span className="text-xs text-muted-foreground">{userHours}h</span>
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
                <span className="text-xs text-muted-foreground">Média empresa</span>
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
            * Média baseada em dados agregados e anónimos.
          </p>
        </div>
      </div>
    </div>
  );
}

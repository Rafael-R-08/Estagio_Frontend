import { type ReactNode } from 'react';
import { CheckCircle2, PlayCircle, Bookmark, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingStats } from '@/types';

// ─── Single stat bar ─────────────────────────────────────────────────────────

function StatBar({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: ReactNode;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{value}</span>
          <span className="text-muted-foreground/60">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Big stat card ─────────────────────────────────────────────────────────────

function BigStat({
  value,
  label,
  sub,
}: {
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StatsHeaderProps {
  stats: TrainingStats | undefined;
  isLoading?: boolean;
}

export function StatsHeader({ stats, isLoading }: StatsHeaderProps) {
  if (isLoading || !stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Big stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigStat value={stats.total} label="Total de cursos" />
        <BigStat value={`${completionRate}%`} label="Taxa de conclusão" sub={`${stats.completed} concluídos`} />
        <BigStat
          value={stats.totalHours > 0 ? `${stats.totalHours}h` : '—'}
          label="Horas de aprendizagem"
        />
        <BigStat
          value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : '—'}
          label="Avaliação média"
        />
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <StatBar
          label="Em Progresso"
          value={stats.ongoing}
          total={stats.total}
          color="bg-blue-500"
          icon={<PlayCircle className="h-3.5 w-3.5 text-blue-500" />}
        />
        <StatBar
          label="Concluídos"
          value={stats.completed}
          total={stats.total}
          color="bg-emerald-500"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        />
        <StatBar
          label="Prioritários"
          value={stats.priority}
          total={stats.total}
          color="bg-orange-400"
          icon={<Star className="h-3.5 w-3.5 text-orange-400" />}
        />
        <StatBar
          label="Guardados"
          value={stats.later}
          total={stats.total}
          color="bg-muted-foreground/40"
          icon={<Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}

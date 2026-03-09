import { CheckCircle2, ExternalLink, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingRecord } from '@/types';

// ─── Stars (read-only) ────────────────────────────────────────────────────────

function Stars({ rating }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            'text-sm leading-none',
            (rating ?? 0) >= n ? 'text-amber-400' : 'text-muted-foreground/25',
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function TimelineItem({
  training,
  isLast,
}: {
  training: TrainingRecord;
  isLast: boolean;
}) {
  const date = training.completedAt
    ? new Date(training.completedAt).toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="flex gap-4">
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={cn('min-w-0 flex-1 pb-6', isLast && 'pb-0')}>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {training.platform && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {training.platform.name}
                  </span>
                )}
                {training.certificate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Trophy className="h-3 w-3" />
                    Certificado
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                {training.title}
              </h3>
            </div>
            <a
              href={training.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Stars rating={training.rating ?? undefined} />
              {training.durationHours && (
                <span className="text-[11px] text-muted-foreground">
                  {training.durationHours}h
                </span>
              )}
            </div>
            {date && (
              <span className="text-[11px] text-muted-foreground">{date}</span>
            )}
          </div>

          {/* Notes */}
          {training.notes && (
            <p className="mt-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
              {training.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group by month ───────────────────────────────────────────────────────────

function groupByMonth(records: TrainingRecord[]) {
  const groups: Record<string, TrainingRecord[]> = {};
  for (const r of records) {
    const d = r.completedAt ? new Date(r.completedAt) : new Date(r.createdAt ?? '');
    const key = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return groups;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompletedTimelineProps {
  trainings: TrainingRecord[];
}

export function CompletedTimeline({ trainings }: CompletedTimelineProps) {
  if (trainings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum curso concluído ainda</p>
        <p className="text-xs text-muted-foreground">
          Quando concluíres um curso, aparece aqui na linha do tempo.
        </p>
      </div>
    );
  }

  const sorted = [...trainings].sort((a, b) => {
    const da = new Date(a.completedAt ?? a.createdAt ?? 0).getTime();
    const db = new Date(b.completedAt ?? b.createdAt ?? 0).getTime();
    return db - da; // mais recente primeiro
  });

  const groups = groupByMonth(sorted);

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([month, items]) => (
        <div key={month}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {month}
          </p>
          <div>
            {items.map((t, i) => (
              <TimelineItem key={t.id} training={t} isLast={i === items.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

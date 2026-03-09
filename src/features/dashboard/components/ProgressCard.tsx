import { ExternalLink, Clock, Star, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingRecord, TrainingStatus } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrainingStatus, { label: string; className: string }> = {
  ongoing:   { label: 'Em progresso',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Concluído',     className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  priority:  { label: 'Prioritário',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  later:     { label: 'Guardado',      className: 'bg-muted text-muted-foreground' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ProgressCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-1/3 rounded bg-muted" />
      <div className="h-2 w-full rounded-full bg-muted" />
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-7 w-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface ProgressCardProps {
  record: TrainingRecord;
  variant?: 'progress' | 'saved';
}

export function ProgressCard({ record, variant = 'progress' }: ProgressCardProps) {
  const status = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.later;
  const platform = record.platform?.name ?? 'Plataforma desconhecida';

  const dateLabel = (() => {
    if (record.startedAt) {
      return `Iniciado em ${new Date(record.startedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
    }
    if (record.createdAt) {
      return `Guardado em ${new Date(record.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}`;
    }
    return null;
  })();

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition hover:shadow-md hover:border-primary/30">
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="flex-1 text-sm font-semibold text-foreground leading-snug line-clamp-2"
          title={record.title}
        >
          {record.title}
        </h3>
        <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', status.className)}>
          {status.label}
        </span>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{platform}</span>
      </div>

      {/* Progress bar — indeterminate shimmer for ongoing, plain fill for others */}
      {variant === 'progress' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-primary opacity-60 origin-left animate-pulse" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {dateLabel && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateLabel}
            </span>
          )}
          {record.durationHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {record.durationHours}h
            </span>
          )}
          {record.rating && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              {record.rating}/5
            </span>
          )}
        </div>

        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          {variant === 'progress' ? 'Continuar' : 'Ver curso'}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

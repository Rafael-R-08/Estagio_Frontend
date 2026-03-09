import { useState, type ReactNode } from 'react';
import {
  ExternalLink,
  MoreVertical,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Bookmark,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingRecord, TrainingStatus } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TrainingStatus,
  { label: string; color: string; icon: ReactNode }
> = {
  ongoing: {
    label: 'Em Progresso',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <PlayCircle className="h-3 w-3" />,
  },
  completed: {
    label: 'Concluído',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  priority: {
    label: 'Prioritário',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    icon: <Star className="h-3 w-3" />,
  },
  later: {
    label: 'Guardado',
    color: 'bg-muted text-muted-foreground',
    icon: <Bookmark className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: TrainingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        cfg.color,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Stars({ rating, onRate }: { rating?: number; onRate?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || rating || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={cn(
            'text-base leading-none transition-colors',
            active >= n ? 'text-amber-400' : 'text-muted-foreground/25',
            onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default',
          )}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ status }: { status: TrainingStatus }) {
  const pct =
    status === 'completed'
      ? 100
      : status === 'ongoing'
        ? 45          // mock — backend doesn't track % yet
        : status === 'priority'
          ? 0
          : 0;

  if (status === 'later') return null;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Progresso</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            status === 'completed'
              ? 'bg-emerald-500'
              : status === 'ongoing'
                ? 'bg-blue-500'
                : 'bg-orange-400',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TrainingCardProps {
  training: TrainingRecord;
  onStatusChange: (id: string, status: TrainingStatus) => void;
  onDelete: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  isUpdating?: boolean;
}

export function TrainingCard({
  training,
  onStatusChange,
  onDelete,
  onRate,
  isUpdating,
}: TrainingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const otherStatuses = (
    ['ongoing', 'priority', 'later', 'completed'] as TrainingStatus[]
  ).filter((s) => s !== training.status);

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        isUpdating && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Platform + status */}
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {training.platform && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {training.platform.name}
              </span>
            )}
            <StatusBadge status={training.status} />
            {training.certificate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Trophy className="h-3 w-3" />
                Certificado
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {training.title}
          </h3>

          {/* Meta */}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {training.durationHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {training.durationHours}h
              </span>
            )}
            {training.startedAt && (
              <span>
                Iniciado {new Date(training.startedAt).toLocaleDateString('pt-PT')}
              </span>
            )}
            {training.completedAt && (
              <span>
                Concluído {new Date(training.completedAt).toLocaleDateString('pt-PT')}
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              {/* backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-popover py-1.5 shadow-lg">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mover para
                </p>
                {otherStatuses.map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        onStatusChange(training.id, s);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    onDelete(training.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar status={training.status} />

      {/* Rating */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stars rating={training.rating ?? undefined} onRate={(v) => onRate(training.id, v)} />
          {training.rating && (
            <span className="text-[11px] text-muted-foreground">{training.rating}/5</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {training.notes && (
            <button
              onClick={() => setNotesOpen((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              Notas
              {notesOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
          <a
            href={training.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/20"
          >
            Abrir
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Notes panel */}
      {notesOpen && training.notes && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {training.notes}
        </div>
      )}

      {/* Quick action buttons */}
      {training.status === 'priority' && (
        <button
          onClick={() => onStatusChange(training.id, 'ongoing')}
          className="mt-3 w-full rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Começar agora
        </button>
      )}
      {training.status === 'ongoing' && (
        <button
          onClick={() => onStatusChange(training.id, 'completed')}
          className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Marcar como concluído
        </button>
      )}
    </div>
  );
}

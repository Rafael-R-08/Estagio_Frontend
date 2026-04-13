import { useState, type ReactNode } from 'react';
import {
  ExternalLink,
  MoreVertical,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Bookmark,
  Star,
  Trophy,
  Target,
  FileText,
  RotateCcw,
  XCircle,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { TrainingRecord, TrainingStatus } from '@/types';
import { TrainingResourcesInline } from './TrainingResourcesInline';
import { CompletionModal } from './CompletionModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TrainingStatus, { color: string; icon: ReactNode }> = {
  ongoing:   { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: <PlayCircle className="h-3 w-3" /> },
  completed: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  priority:  { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <Star className="h-3 w-3" /> },
  later:     { color: 'bg-muted text-muted-foreground',                                           icon: <Bookmark className="h-3 w-3" /> },
  accessed:  { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: <Timer className="h-3 w-3" /> },
  cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             icon: <XCircle className="h-3 w-3" /> },
};

const STATUS_LABEL_KEY: Record<TrainingStatus, string> = {
  ongoing:   'myLearning.trainingCard.statusOngoing',
  completed: 'myLearning.trainingCard.statusCompleted',
  priority:  'myLearning.trainingCard.statusPriority',
  later:     'myLearning.trainingCard.statusSaved',
  accessed:  'myLearning.trainingCard.statusAccessed',
  cancelled: 'myLearning.trainingCard.statusCancelled',
};

function StatusBadge({ status }: { status: TrainingStatus }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] border border-border/40',
        cfg.color,
      )}
    >
      {cfg.icon}
      {t(STATUS_LABEL_KEY[status])}
    </span>
  );
}

function RatingDisplay({ rating, relevance }: { rating?: number; relevance?: number }) {
  if (!rating && !relevance) return null;
  return (
    <div className="flex items-center gap-3 mt-1">
      {rating && (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-black underline decoration-amber-400/30 underline-offset-2">{rating}/5</span>
        </div>
      )}
      {relevance && (
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-black underline decoration-primary/30 underline-offset-2">{relevance}/5</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TrainingCardProps {
  training: TrainingRecord;
  onStatusChange: (id: string, status: TrainingStatus, extra?: any) => void;
  onDelete: (id: string) => void;
  onUpdateDetail: (id: string, data: any) => void;
  isUpdating?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const STAGES = [
  { id: 'inicio',    labelKey: 'myLearning.trainingCard.stageStart',  color: 'bg-blue-500' },
  { id: 'meio',      labelKey: 'myLearning.trainingCard.stageMid',    color: 'bg-blue-600' },
  { id: 'finalizar', labelKey: 'myLearning.trainingCard.stageFinish', color: 'bg-blue-700' },
];

function ProgressCircle({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-muted/20"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", colorClass)}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-[8px] font-black tabular-nums text-foreground/80">{percentage}%</span>
    </div>
  );
}

export function TrainingCard({
  training,
  onStatusChange,
  onDelete,
  onUpdateDetail,
  isUpdating,
  isExpanded,
  onToggleExpand,
}: TrainingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-US';

  const isOngoing = training.status === 'ongoing';
  const isCompleted = training.status === 'completed';
  const isSaved = training.status === 'later' || training.status === 'priority';
  const isCancelled = training.status === 'cancelled';

  const progressPercentage = (() => {
    if (training.progressLevel === 'início') return 25;
    if (training.progressLevel === 'meio') return 55;
    if (training.progressLevel === 'finalizar') return 90;
    return 0;
  })();

  const studyDuration = (() => {
    if (!isCompleted || !training.startedAt || !training.completedAt) return null;
    const start = new Date(training.startedAt);
    const end = new Date(training.completedAt);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('myLearning.trainingCard.finishedToday');
    return t('myLearning.trainingCard.focusDays', { count: diffDays });
  })();

  const handleStageChange = (stage: string) => {
    onUpdateDetail(training.id, { progressLevel: stage });
  };

  const handleCompleteConfirm = (rating: number, relevance: number) => {
    onStatusChange(training.id, 'completed', {
      rating,
      relevance,
      completedAt: new Date().toISOString()
    });
    setCompletionModalOpen(false);
  };

  const menuItems = (() => {
    if (isOngoing) {
      return (
        <button
          onClick={() => { onStatusChange(training.id, 'cancelled'); setMenuOpen(false); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-500 transition hover:bg-red-500/10"
        >
          <XCircle className="h-3.5 w-3.5" />
          {t('myLearning.trainingCard.cancel')}
        </button>
      );
    }
    if (isSaved) {
      return (
        <>
          <button
            onClick={() => {
              const nextStatus = training.status === 'priority' ? 'later' : 'priority';
              onUpdateDetail(training.id, { status: nextStatus });
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
          >
            <Star className={cn("h-3.5 w-3.5", training.status === 'priority' ? "fill-amber-500 text-amber-500" : "text-amber-500")} />
            {training.status === 'priority' ? t('myLearning.trainingCard.removePriority') : t('myLearning.trainingCard.priority')}
          </button>
          <button
            onClick={() => { onDelete(training.id); setMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('myLearning.trainingCard.remove')}
          </button>
        </>
      );
    }
    // Completed or Cancelled
    return (
      <>
        {isCancelled && (
          <button
            onClick={() => { onStatusChange(training.id, 'ongoing'); setMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
            {t('myLearning.trainingCard.reactivate')}
          </button>
        )}
        <button
          onClick={() => { onDelete(training.id); setMenuOpen(false); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('myLearning.trainingCard.remove')}
        </button>
      </>
    );
  })();

  return (
    <div
      className={cn(
        'relative rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-5 shadow-sm transition-all duration-500 hover:shadow-md hover:border-border',
        isUpdating && 'opacity-60 pointer-events-none',
        isCancelled && 'border-red-200 bg-red-50/10 dark:border-red-900/30 dark:bg-red-900/5',
        training.status === 'priority' && 'ring-1 ring-amber-500/30 border-amber-500/20 bg-amber-500/[0.02]',
        isExpanded && 'shadow-xl ring-2 ring-primary/20 bg-background/80'
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Platform + status (simplified for Saved/Cancelled) */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {training.platform && (
              <span className="rounded-full bg-muted/60 border border-border/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground mr-1">
                {training.platform.name}
              </span>
            )}

            {isCompleted && studyDuration && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20 shadow-sm transition-all hover:bg-emerald-500/20">
                <Timer className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                  {studyDuration}
                </span>
              </div>
            )}

            {(training.status !== 'ongoing' && training.status !== 'completed') && (
              <>
                <StatusBadge status={training.status} />
                {training.certificate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Trophy className="h-3 w-3" />
                    {t('myLearning.trainingCard.certificate')}
                  </span>
                )}
              </>
            )}
            {isOngoing && (
              <div className="ml-auto sm:ml-0">
                <ProgressCircle percentage={progressPercentage} colorClass="text-blue-500" />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold leading-snug text-foreground line-clamp-2 mt-1">
            {training.title}
          </h3>

          {/* Meta & Ratings (Hidden for Saved/Cancelled) */}
          {(isOngoing || isCompleted) && (
            <div className="mt-1.5 space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
                {training.startedAt && (
                  <span>
                    {t('myLearning.trainingCard.startedOn', { date: new Date(training.startedAt).toLocaleDateString(locale) })}
                  </span>
                )}
                {training.completedAt && (
                  <span>
                    {t('myLearning.trainingCard.completedOn', { date: new Date(training.completedAt).toLocaleDateString(locale) })}
                  </span>
                )}
              </div>

              {isCompleted && (
                <div className="flex flex-col gap-2">
                  <RatingDisplay rating={training.rating} relevance={training.relevance} />
                </div>
              )}
            </div>
          )}
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
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-popover py-1.5 shadow-lg">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-60">
                  {t('myLearning.trainingCard.actions')}
                </p>
                {menuItems}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ongoing Specific: Stage Selector */}
      {isOngoing && !isExpanded && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">{t('myLearning.trainingCard.currentStage')}</p>
          <div className="flex p-1 gap-1 bg-muted/40 rounded-xl border border-border/40 w-fit">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStageChange(s.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  training.progressLevel === s.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className={cn("mt-5 flex items-center justify-between gap-2", (isSaved || isCancelled) && "mt-6")}>
        {/* Notes button: Ongoing, Completed or Cancelled */}
        {(isOngoing || isCompleted || isCancelled) && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition active:scale-[0.98]",
              isExpanded
                ? "bg-primary text-background shadow-lg shadow-primary/20"
                : "bg-muted/60 text-foreground hover:bg-muted"
            )}
          >
            <FileText className={cn("h-3.5 w-3.5", isExpanded ? "text-background" : "text-primary/60")} />
            {isExpanded ? t('myLearning.trainingCard.collapse') : t('myLearning.trainingCard.resources')}
          </button>
        )}

        {/* Action Button 1: Iniciar (Saved) / Reativar (Cancelled) */}
        {isSaved && (
          <button
            onClick={() => onStatusChange(training.id, 'ongoing', { progressLevel: 'inicio' })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            {t('myLearning.trainingCard.start')}
            <PlayCircle className="h-3.5 w-3.5" />
          </button>
        )}


        {/* Action Button 2: Concluir (Ongoing) / Abrir (Everything else) */}
        {isOngoing ? (
          <button
            onClick={() => setCompletionModalOpen(true)}
            className="flex flex-[1.5] items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            {t('myLearning.trainingCard.complete')}
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <a
            href={training.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 px-4 text-xs font-semibold transition active:scale-[0.98]",
              isSaved || isCancelled
                ? "flex-1 bg-primary/10 text-primary hover:bg-primary/20"
                : "flex-[1.5] bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {t('myLearning.trainingCard.open')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Expanded Inline Resources */}
      {isExpanded && (
        <TrainingResourcesInline
          training={training}
          onClose={onToggleExpand}
          readOnly={isCompleted || isCancelled}
        />
      )}

      {/* Modals */}
      {completionModalOpen && (
        <CompletionModal
          training={training}
          onClose={() => setCompletionModalOpen(false)}
          onConfirm={handleCompleteConfirm}
          isSubmitting={isUpdating}
        />
      )}
    </div>
  );
}

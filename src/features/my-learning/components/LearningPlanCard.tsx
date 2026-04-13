import { ArrowRight, Star, ExternalLink, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TrainingRecord } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LearningPlanCardProps {
  training: TrainingRecord;
  rank: number;
  onStart: (id: string) => void;
  isUpdating?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LearningPlanCard({
  training,
  rank,
  onStart,
  isUpdating,
}: LearningPlanCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-US';
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${
        isUpdating ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {/* Drag handle + rank */}
      <div className="flex shrink-0 flex-col items-center gap-1 text-muted-foreground/40">
        <GripVertical className="h-4 w-4" />
        <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {training.platform && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {training.platform.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <Star className="h-3 w-3 fill-current" />
            {t('myLearning.planCard.priority')}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
          {training.title}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {training.durationHours && <span>{t('myLearning.planCard.estimatedHours', { n: training.durationHours })}</span>}
          {training.createdAt && (
            <span>
              {t('myLearning.planCard.addedOn', { date: new Date(training.createdAt).toLocaleDateString(locale) })}
            </span>
          )}
        </div>

        {/* Priority progress bar (decorative) */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-0 rounded-full bg-orange-400" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2">
        <button
          onClick={() => onStart(training.id)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {t('myLearning.planCard.start')}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <a
          href={training.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t('myLearning.planCard.view')}
        </a>
      </div>
    </div>
  );
}

import {
  X,
  Star,
  Clock,
  BarChart3,
  DollarSign,
  BookOpen,
  Tag,
  Users,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { CourseSearchResult } from '@/types';

interface CourseCompareModalProps {
  courses: CourseSearchResult[];
  onClose: () => void;
  onRemove: (externalId: string) => void;
}

const LEVEL_COLOR: Record<string, string> = {
  beginner: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800/40',
  intermediate: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-800/40',
  advanced: 'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-900/20 dark:border-violet-800/40',
};

function RowLabel({ label }: { label: string }) {
  return (
    <div className="w-28 shrink-0 py-4 pr-4 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/60">
      {label}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 py-4 px-3 border-l border-border/40">
      {children}
    </div>
  );
}

function NA() {
  const { t } = useTranslation();
  return <span className="text-xs text-muted-foreground/50">{t('compare.na')}</span>;
}

function formatDuration(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function CourseCompareModal({ courses, onClose, onRemove }: CourseCompareModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 bg-muted/10 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              {t('compare.modalSubtitle')}
            </p>
            <p className="font-black text-foreground tracking-tight">{t('compare.modalTitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-auto p-6 space-y-0">
          {/* Course headers */}
          <div className="flex border-b border-border/40 pb-4 mb-0">
            <div className="w-28 shrink-0" />
            {courses.map((c) => (
              <div key={c.externalId} className="flex-1 min-w-0 px-3 border-l border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground leading-tight line-clamp-3 tracking-tight">
                      {c.title}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-primary" />
                      {c.platformName}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(c.externalId)}
                    title={t('compare.removing')}
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Level row */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowLevel')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.level ? (
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest', LEVEL_COLOR[c.level] ?? 'text-muted-foreground bg-muted')}>
                    {t(`searchCard.level${c.level.charAt(0).toUpperCase()}${c.level.slice(1)}`)}
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Duration row */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowDuration')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.durationHours ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDuration(c.durationHours)}
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Platform rating */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowRating')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.rating !== undefined ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {c.rating.toFixed(1)}
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Internal rating */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowInternalRating')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.internalRating !== undefined ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {c.internalRating.toFixed(1)}
                    <span className="text-[9px] font-black uppercase opacity-70">int</span>
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Colleagues */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowColleagues')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.completedCount ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.completedCount}
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Relevance */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowRelevance')} />
            {courses.map((c) => {
              const rel = c.relevanceScore ?? c.similarityScore ?? c.relevance;
              return (
                <Cell key={c.externalId}>
                  {rel !== undefined ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {Math.round(rel * 100)}%
                    </span>
                  ) : <NA />}
                </Cell>
              );
            })}
          </div>

          {/* Price */}
          <div className="flex border-b border-border/40">
            <RowLabel label={t('compare.rowPrice')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.isFree === true ? (
                  <span className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    {t('compare.free')}
                  </span>
                ) : c.isFree === false ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {c.price || t('compare.paid')}
                  </span>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Tags */}
          <div className="flex">
            <RowLabel label={t('compare.rowTags')} />
            {courses.map((c) => (
              <Cell key={c.externalId}>
                {c.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                    {c.tags.length > 5 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{c.tags.length - 5}
                      </span>
                    )}
                  </div>
                ) : <NA />}
              </Cell>
            ))}
          </div>

          {/* Action row */}
          <div className="flex pt-5 mt-2 border-t border-border/40">
            <div className="w-28 shrink-0" />
            {courses.map((c) => (
              <div key={c.externalId} className="flex-1 min-w-0 px-3">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-background transition hover:opacity-90 active:scale-95"
                >
                  {t('compare.viewCourse')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

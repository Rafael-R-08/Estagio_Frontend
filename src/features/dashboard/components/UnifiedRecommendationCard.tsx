import { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ExternalLink, TrendingUp, Lightbulb, Target, Clock, BookOpen, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RecommendationResponse, RecommendedCourse } from '@/types';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  improvement: {
    icon: TrendingUp,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50/60 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200/60 dark:border-emerald-500/20',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  interests: {
    icon: Lightbulb,
    iconColor: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50/60 dark:bg-amber-500/10',
    borderColor: 'border-amber-200/60 dark:border-amber-500/20',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  missing_skills: {
    icon: Target,
    iconColor: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50/60 dark:bg-blue-500/10',
    borderColor: 'border-blue-200/60 dark:border-blue-500/20',
    badgeBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  },
} as const;

// ─── Skeletons ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function RecommendationSkeleton() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-56" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/40 p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: RecommendedCourse }) {
  const { t } = useTranslation();
  const cfg = CATEGORY_CONFIG[course.category];
  const Icon = cfg.icon;
  const levelLabel = course.level ? t(`dashboard.recommendations.levels.${course.level.toLowerCase()}`, { defaultValue: course.level }) : null;

  return (
    <div className={cn(
      'flex flex-col gap-3 rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-md',
      cfg.borderColor, cfg.bgColor,
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-black tracking-tight text-foreground leading-snug flex-1">
          {course.title}
        </p>
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm', cfg.iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="text-[12px] font-medium text-muted-foreground leading-relaxed">
        {course.reason}
      </p>

      {(levelLabel || course.estimatedHours) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/20 mt-auto">
          {levelLabel && (
            <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider', cfg.badgeBg)}>
              {levelLabel}
            </span>
          )}
          {typeof course.estimatedHours === 'number' && course.estimatedHours > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {course.estimatedHours}h
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UnifiedRecommendationCardProps {
  data?: RecommendationResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

type Category = keyof typeof CATEGORY_CONFIG;

// ─── Main Component ───────────────────────────────────────────────────────────

export function UnifiedRecommendationCard({ data, isLoading, isError, onRetry }: UnifiedRecommendationCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Category>('improvement');

  // ── Conditional renders ──

  if (isLoading) {
    return (
      <div className="rounded-[2.5rem] border border-border/60 bg-muted/10 h-auto min-h-80">
        <RecommendationSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-destructive/20 bg-destructive/5 py-16 px-8 text-center backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{t('dashboard.recs.error.title', 'Falha nas recomendações')}</p>
          <p className="text-xs text-muted-foreground opacity-70">{t('dashboard.recs.error.subtitle', 'Ocorreu um erro ao contactar o motor RAG.')}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="rounded-full bg-foreground px-6 py-2.5 text-xs font-black text-background transition hover:opacity-90 active:scale-95">
            {t('common.retry', 'TENTAR NOVAMENTE')}
          </button>
        )}
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const hasCourses = courses.length > 0;

  if (!hasCourses) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-border/60 bg-muted/10 py-16 px-8 text-center backdrop-blur-sm">
        <Sparkles className="h-10 w-10 text-muted-foreground/30" />
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-bold text-muted-foreground">
            {data?.summary || t('dashboard.recs.empty', 'Ainda não foram geradas recomendações para o teu perfil.')}
          </p>
          {!data?.hasContextualCourses && (
            <p className="text-[11px] text-muted-foreground/60">
              {t('dashboard.recommendations.completeProfile')}
            </p>
          )}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="rounded-full border border-border px-5 py-2 text-xs font-black text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-95">
            {t('common.retry', 'TENTAR NOVAMENTE')}
          </button>
        )}
      </div>
    );
  }

  // Build tabs only for categories that have courses
  const activeTabs = (Object.keys(CATEGORY_CONFIG) as Category[]).filter(
    (cat) => courses.some((c) => c.category === cat),
  );

  // Fall back to first available tab if current tab has no courses
  const safeTab = activeTabs.includes(activeTab) ? activeTab : activeTabs[0];
  const tabCourses = courses.filter((c) => c.category === safeTab);
  const cfg = CATEGORY_CONFIG[safeTab];
  const TabIcon = cfg.icon;

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/40 shadow-xl shadow-foreground/5 transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/10">
      {/* Decorative gradient */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all duration-700 group-hover:bg-primary/10 pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/40 bg-background/20 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-500 group-hover:scale-110">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              {t('dashboard.recs.label', 'Insights Personalizados')}
            </p>
            <p className="text-base font-black tracking-tight text-foreground sm:text-xl">
              {t('dashboard.recs.unifiedTitle', 'Recomendações Personalizadas')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.metadata?.fromCache && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-muted/40 px-2.5 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              <Zap className="h-2.5 w-2.5" /> Cache
            </span>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-90"
              title={t('dashboard.recommendations.refreshAria')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {data?.summary && (
        <div className="relative z-10 border-b border-border/20 bg-muted/10 px-6 py-3 sm:px-8">
          <p className="text-[12px] font-medium text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </div>
      )}

      {/* ── Category tabs ── */}
      {activeTabs.length > 1 && (
        <div className="relative z-10 flex gap-2 overflow-x-auto border-b border-border/20 bg-muted/5 px-6 py-3 scrollbar-hide sm:px-8">
          {activeTabs.map((cat) => {
            const c = CATEGORY_CONFIG[cat];
            const Icon = c.icon;
            const count = courses.filter((x) => x.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                  safeTab === cat
                    ? cn('border border-current/20 shadow-sm', c.bgColor, c.iconColor)
                    : 'border border-border/60 bg-background text-muted-foreground hover:bg-muted/80',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t(`dashboard.recommendations.categories.${cat}.label`)}</span>
                <span className="inline sm:hidden">{t(`dashboard.recommendations.categories.${cat}.shortLabel`)}</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-black',
                  safeTab === cat ? 'bg-current/10' : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Course grid ── */}
      <div className="relative z-10 px-6 py-6 sm:px-8">
        <div className="mb-4 flex items-center gap-2">
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-xl bg-background/80 shadow-sm', cfg.iconColor)}>
            <TabIcon className="h-3.5 w-3.5" />
          </div>
          <h3 className={cn('text-sm font-black tracking-tight', cfg.iconColor)}>
            {t(`dashboard.recommendations.categories.${safeTab}.label`)}
          </h3>
          <span className="text-[11px] text-muted-foreground/50 font-medium">
            {t('dashboard.recommendations.coursesCount', { count: tabCourses.length })}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {tabCourses.map((course, i) => (
            <CourseCard key={`${course.title}-${i}`} course={course} />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 flex flex-col gap-4 border-t border-border/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          {typeof data?.metadata?.profileScore === 'number' && (
            <span className="flex items-center gap-1.5 rounded-md bg-muted/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                data.metadata.profileScore >= 0.8 ? 'bg-emerald-500' : data.metadata.profileScore >= 0.5 ? 'bg-amber-500' : 'bg-rose-500',
              )} />
              {t('dashboard.recommendations.profileLabel', { n: Math.round(data.metadata.profileScore * 100) })}
            </span>
          )}
          {typeof data?.metadata?.sourcesCount === 'number' && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              <BookOpen className="h-3 w-3" />
              {t('dashboard.recommendations.sourcesLabel', { n: data.metadata.sourcesCount })}
            </span>
          )}
        </div>
        <a
          href="/ai"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto"
        >
          {t('dashboard.recs.openAi', 'Abrir Assistente')}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

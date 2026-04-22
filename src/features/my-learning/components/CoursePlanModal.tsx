import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  X,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Map,
} from 'lucide-react';
import { chatApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { CoursePlanResponse, CoursePlanPhase } from '@/types';

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  accent = 'blue',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
}) {
  const colors = {
    blue:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber:   'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    violet:  'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    rose:    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', colors[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function PhaseCard({ phase, index }: { phase: CoursePlanPhase; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-foreground truncate">{phase.phase}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <Clock className="h-3 w-3" />
            {phase.estimatedTime}
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border/40 px-4 py-3 space-y-1.5">
          {phase.topics.map((topic, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="text-sm text-foreground/80">{topic}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Focus Selector ───────────────────────────────────────────────────────────

const FOCUS_OPTIONS = [
  { value: undefined,     labelKey: 'coursePlan.focusBalanced' },
  { value: 'prático',     labelKey: 'coursePlan.focusPractical' },
  { value: 'teórico',     labelKey: 'coursePlan.focusTheoretical' },
] as const;

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface CoursePlanModalProps {
  trainingId: string;
  courseTitle: string;
  onClose: () => void;
}

export function CoursePlanModal({ trainingId, courseTitle, onClose }: CoursePlanModalProps) {
  const { t } = useTranslation();
  const [focus, setFocus] = useState<string | undefined>(undefined);
  const [plan, setPlan] = useState<CoursePlanResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => chatApi.generateCoursePlan(trainingId, focus),
    onSuccess: (res) => setPlan(res.data),
  });

  const handleGenerate = () => {
    setPlan(null);
    mutation.mutate();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-[2rem] border border-border/60 bg-card shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-border/40 px-6 py-5 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-violet-600/10 text-violet-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                {t('coursePlan.modalSubtitle')}
              </p>
              <h2 className="font-black text-foreground tracking-tight leading-tight line-clamp-2">
                {courseTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Focus selector + generate button */}
          {!plan && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('coursePlan.description')}
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t('coursePlan.focusLabel')}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {FOCUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.labelKey}
                      onClick={() => setFocus(opt.value)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-xs font-bold transition-all',
                        focus === opt.value
                          ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-600/20'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-violet-500/50 hover:text-foreground',
                      )}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={mutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('coursePlan.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('coursePlan.generate')}
                  </>
                )}
              </button>

              {mutation.isError && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t('coursePlan.error')}
                </div>
              )}
            </div>
          )}

          {/* Plan result */}
          {plan && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Header summary */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-4 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-base font-black text-foreground">{plan.courseTitle}</p>
                  <span className="flex items-center gap-1.5 rounded-full bg-violet-600/10 px-3 py-1 text-[10px] font-black text-violet-600 dark:text-violet-400">
                    <Clock className="h-3 w-3" />
                    {plan.totalEstimatedTime}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.overview}</p>
              </div>

              {/* Prerequisites */}
              {plan.prerequisites.length > 0 && (
                <Section icon={BookOpen} title={t('coursePlan.prerequisites')} accent="amber">
                  <div className="flex flex-wrap gap-2">
                    {plan.prerequisites.map((p, i) => (
                      <span key={i} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                        {p}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Learning path */}
              <Section icon={Map} title={t('coursePlan.learningPath')} accent="blue">
                <div className="space-y-2">
                  {plan.learningPath.map((phase, i) => (
                    <PhaseCard key={i} phase={phase} index={i} />
                  ))}
                </div>
              </Section>

              {/* Key objectives */}
              {plan.keyObjectives.length > 0 && (
                <Section icon={Target} title={t('coursePlan.keyObjectives')} accent="emerald">
                  <ul className="space-y-2">
                    {plan.keyObjectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Study tips */}
              {plan.studyTips.length > 0 && (
                <Section icon={Lightbulb} title={t('coursePlan.studyTips')} accent="violet">
                  <ul className="space-y-2">
                    {plan.studyTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-600/10 text-[9px] font-black text-violet-600 dark:text-violet-400">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* After completion */}
              {plan.afterCompletion && (
                <div className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t('coursePlan.afterCompletion')}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{plan.afterCompletion}</p>
                </div>
              )}

              {/* Regenerate button */}
              <button
                onClick={() => setPlan(null)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('coursePlan.regenerate')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

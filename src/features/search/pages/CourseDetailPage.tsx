import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Clock,
  BookOpen,
  Tag,
  CheckCircle2,
  Bookmark,
  AlertCircle,
  Sparkles,
  User,
  Globe,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Users,
  FolderPlus,
} from 'lucide-react';

import { searchApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { toast } from '@/lib/toast-store';
import { cn } from '@/lib/utils';
import type { CourseSearchResult } from '@/types';

import { SearchResultCard } from '../components/SearchResultCard';
import { AddToCollectionModal } from '@/features/collections/components/AddToCollectionModal';

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200/50',
  intermediate: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 border-sky-200/50',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border-violet-200/50',
};

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <Sk className="h-4 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Sk className="h-6 w-24 rounded-full" />
            <Sk className="h-12 w-full" />
            <Sk className="h-12 w-2/3" />
          </div>
          <div className="flex gap-6">
            <Sk className="h-4 w-32" />
            <Sk className="h-4 w-32" />
          </div>
          <Sk className="h-24 w-full rounded-3xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Sk key={i} className="h-24 rounded-3xl" />)}
          </div>
        </div>
        <div className="space-y-6">
          <Sk className="h-80 rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

interface ActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  loading?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, active, className, loading }: ActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-full border px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        active
          ? 'bg-primary text-primary-foreground border-transparent shadow-xl shadow-primary/20'
          : 'border-border/60 bg-background/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: string | number, colorClass?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-border/40 bg-background/40 p-5 backdrop-blur-md transition-all hover:border-foreground/10 hover:bg-background/60 shadow-sm">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">{label}</p>
        <p className="text-sm font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── CourseDetailPage ─────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const externalId = rawId ? decodeURIComponent(rawId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Course detail — first try location.state (passed from search card click)
  const stateData = location.state as CourseSearchResult | null;

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', externalId],
    queryFn: () => searchApi.getCourse(externalId).then((r) => r.data),
    enabled: !!externalId && !stateData,
    initialData: stateData ?? undefined,
    staleTime: 1000 * 60 * 10,
  });

  // Related courses
  const { data: related = [] } = useQuery({
    queryKey: ['course-related', externalId],
    queryFn: () => searchApi.getRelated(externalId).then((r) => r.data),
    enabled: !!externalId,
    staleTime: 1000 * 60 * 10,
  });

  // User's training records
  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  const existingRecord = trainings.find((t) => t.url === course?.url);

  // Create/Update training mutation
  const createTraining = useMutation({
    mutationFn: trainingApi.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (variables.status === 'ongoing') {
        // Optimistically stamp startedAt so RecentActivity sorts to top
        queryClient.setQueryData<any[]>(['trainings', 'all'], (old) =>
          old ? [...old, { ...data.data, startedAt: new Date().toISOString() }] : old
        );
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }, 3000);
      }
    },
  });
  const updateTraining = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof trainingApi.update>[1] }) =>
      trainingApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (variables.dto.status === 'ongoing') {
        queryClient.setQueryData<any[]>(['trainings', 'all'], (old) =>
          old ? old.map((t: any) =>
            t.id === variables.id ? { ...t, startedAt: new Date().toISOString() } : t
          ) : old
        );
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }, 3000);
      }
      if (variables.dto.status === 'completed') {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }, 3000);
      }
    },
  });

  const handleAction = (status: 'ongoing' | 'completed' | 'later') => {
    if (!course) return;

    if (existingRecord) {
      if (existingRecord.status === status) return;
      updateTraining.mutate(
        { id: existingRecord.id, dto: { status } },
        {
          onSuccess: () => toast.success(t('search.courseDetail.toastUpdated')),
          onError: () => toast.error(t('search.courseDetail.toastUpdateError')),
        },
      );
    } else {
      createTraining.mutate(
        { title: course.title, url: course.url, status, platformId: course.platformId, durationHours: course.durationHours },
        {
          onSuccess: () => {
            const labels: Record<string, string> = {
              ongoing: t('search.courseDetail.toastSavedOngoing'),
              completed: t('search.courseDetail.toastSavedCompleted'),
              later: t('search.courseDetail.toastSaved'),
            };
            toast.success(labels[status]);
          },
          onError: () => toast.error(t('search.courseDetail.toastSaveError')),
        },
      );
    }
  };

  const isPending = createTraining.isPending || updateTraining.isPending;
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !course) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">{t('search.courseDetail.notFoundTitle')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('search.courseDetail.notFoundDesc')}
          </p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="rounded-full bg-foreground px-6 py-3 text-xs font-black uppercase tracking-widest text-background hover:opacity-90 transition-all"
        >
          {t('search.courseDetail.notFoundBtn')}
        </button>
      </div>
    );
  }

  const levelStyle = course.level ? LEVEL_STYLES[course.level] : undefined;
  const levelLabelKey: Record<string, string> = {
    beginner: t('search.courseDetail.levelBeginner'),
    intermediate: t('search.courseDetail.levelIntermediate'),
    advanced: t('search.courseDetail.levelAdvanced'),
  };
  const levelLabel = course.level ? levelLabelKey[course.level] : undefined;

  const formatHours = (h?: number) => {
    if (!h) return t('search.courseDetail.durationVariable');
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}min`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}min`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        {t('search.courseDetail.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* ── Left Column: Main Info ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.platformName}
                </span>
                {levelStyle && (
                  <span className={cn('rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm', levelStyle)}>
                    {levelLabel}
                  </span>
                )}
                {existingRecord && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {existingRecord.status === 'completed' ? t('search.courseDetail.statusCompleted') : t('search.courseDetail.statusSaved')}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl leading-[1.1]">
                {course.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-xs font-black uppercase tracking-widest text-muted-foreground/80">
              {course.instructor && (
                <span className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-primary/60" />
                  {course.instructor}
                </span>
              )}
              {course.language && (
                <span className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-primary/60" />
                  {course.language}
                </span>
              )}
            </div>

            {course.description && (
              <p className="text-lg leading-relaxed text-muted-foreground/90 font-medium italic border-l-4 border-primary/20 pl-6 py-2">
                {course.description}
              </p>
            )}

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 rounded-full bg-muted/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/40 transition-all hover:border-foreground/20 hover:text-foreground hover:bg-muted/60"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard 
              icon={Clock} 
              label={t('search.courseDetail.statDuration')} 
              value={formatHours(course.durationHours)} 
            />
            <StatCard 
              icon={Star} 
              label={t('search.courseDetail.statRating')} 
              value={course.rating ? `${course.rating.toFixed(1)} / 5.0` : 'N/A'}
              colorClass="text-amber-500"
            />
            {course.internalRating !== undefined && (
              <StatCard 
                icon={Star} 
                label={t('search.courseDetail.statInternalRating')} 
                value={`${course.internalRating.toFixed(1)} / 5.0`}
                colorClass="text-orange-500"
              />
            )}
            {!!course.completedCount && (
              <StatCard 
                icon={Users} 
                label={t('search.courseDetail.statCompletedBy')} 
                value={t('search.courseDetail.statCompletedByValue', { count: course.completedCount })}
                colorClass="text-violet-500"
              />
            )}
            <StatCard 
              icon={BarChart3} 
              label={t('search.courseDetail.statRelevance')} 
              value={(course.relevanceScore || course.similarityScore) ? `${Math.round((course.relevanceScore || course.similarityScore || 0) * 100)}%` : 'N/A'}
              colorClass="text-blue-500"
            />
            <StatCard 
              icon={DollarSign} 
              label={t('search.courseDetail.statCost')} 
              value={
                course.isFree === true
                  ? t('search.courseDetail.statCostFree')
                  : course.isFree === false
                    ? (course.price || t('search.courseDetail.statCostPaid'))
                    : (course.price || '—')
              }
              colorClass={
                course.isFree === true || course.price?.toLowerCase().includes('free')
                  ? 'text-emerald-500'
                  : ''
              }
            />
          </div>

          {/* Why recommended? */}
          {course.similarityScore !== undefined && (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 backdrop-blur-md">
              <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-primary/10 blur-[80px]" />
              <div className="relative flex items-center gap-5 mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-primary text-white shadow-2xl shadow-primary/30">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-1">{t('search.courseDetail.aiSectionLabel')}</h2>
                  <p className="text-sm font-bold text-foreground/60">{t('search.courseDetail.aiSectionSub')}</p>
                </div>
              </div>
              <p className="relative text-xl leading-relaxed text-foreground/80 font-medium tracking-tight">
                {t('search.courseDetail.aiSectionBody_1')} <span className="font-black text-primary underline decoration-primary/30 underline-offset-8 decoration-2">{Math.round(course.similarityScore * 100)}%</span>{t('search.courseDetail.aiSectionBody_2')} <span className="font-black text-foreground">{course.tags.slice(0, 3).join(', ')}</span>{t('search.courseDetail.aiSectionBody_3')}
              </p>
            </div>
          )}
        </div>

        {/* ── Right Column: Sidebar Actions ───────────────────────────────── */}
        <div className="space-y-6">
          <div className="sticky top-10 rounded-[2.5rem] border border-border/60 bg-background/60 p-8 shadow-2xl shadow-foreground/5 backdrop-blur-3xl space-y-8 border-t-primary/20 border-t-2">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 border-b border-border/40 pb-4">{t('search.courseDetail.sidebarTitle')}</h3>
              <div className="flex flex-col gap-4">
                <ActionButton
                  icon={Bookmark}
                  label={existingRecord?.status === 'later' ? t('search.courseDetail.actionSaved') : t('search.courseDetail.actionSave')}
                  onClick={() => handleAction('later')}
                  active={existingRecord?.status === 'later'}
                  loading={isPending}
                />
                <ActionButton
                  icon={CheckCircle2}
                  label={existingRecord?.status === 'completed' ? t('search.courseDetail.actionCompleted') : t('search.courseDetail.actionComplete')}
                  onClick={() => handleAction('completed')}
                  active={existingRecord?.status === 'completed'}
                  loading={isPending}
                />
                <ActionButton
                  icon={FolderPlus}
                  label={t('collections.addButton')}
                  onClick={() => setShowCollectionModal(true)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
                  {t('search.courseDetail.externalAccess')}
                </p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                  {t('search.courseDetail.externalAccessDesc')}
                </p>
              </div>
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-8 py-5 text-xs font-black uppercase tracking-[0.25em] text-background shadow-2xl transition-all hover:scale-[1.02] active:scale-95 hover:shadow-primary/10"
              >
                {t('search.courseDetail.startNow')}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related courses ───────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="space-y-10 pt-20 border-t border-border/40">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-foreground">{t('search.courseDetail.relatedTitle')}</h2>
              <p className="text-sm text-muted-foreground font-medium italic">{t('search.courseDetail.relatedSub')}</p>
            </div>
            <button 
              onClick={() => navigate('/search')}
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all"
            >
              {t('search.courseDetail.viewAllResults')}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>
          <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((r: CourseSearchResult) => (
              <SearchResultCard
                key={r.externalId}
                course={r}
                alreadyAttended={trainings.some((t) => t.url === r.url)}
              />
            ))}
          </div>
        </div>
      )}

      {showCollectionModal && course && (
        <AddToCollectionModal
          course={{ externalId: course.externalId, title: course.title, url: course.url, platformName: course.platformName, platformId: course.platformId }}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </div>
  );
}

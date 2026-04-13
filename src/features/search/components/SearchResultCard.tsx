import {
  Star,
  Clock,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  BookOpen,
  Tag,
  DollarSign,
  BarChart3,
  User,
  Globe,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { trainingApi } from '@/services/api';
import type { CourseSearchResult } from '@/types';

// ─── Level badge ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200/50',
  intermediate: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 border-sky-200/50',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border-violet-200/50',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SearchResultCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-6 w-3/4 rounded-lg bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-9 w-28 rounded-full bg-muted" />
        <div className="h-9 w-32 rounded-full bg-muted" />
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}

function ActionBtn({ icon: Icon, label, onClick, active, activeClass }: ActionBtnProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-all duration-300 active:scale-95',
        active
          ? cn('border-transparent shadow-sm', activeClass ?? 'bg-blue-600 text-white')
          : 'border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface SearchResultCardProps {
  course: CourseSearchResult;
  alreadyAttended?: boolean;
  onSave?: (c: CourseSearchResult) => void;
  savedExternalIds?: Set<string>;
}

export function SearchResultCard({
  course,
  alreadyAttended = false,
  onSave,
  savedExternalIds = new Set(),
}: SearchResultCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [localSaved, setLocalSaved] = useState(savedExternalIds.has(course.externalId));

  const levelStyle = course.level ? LEVEL_STYLES[course.level] : undefined;
  const levelLabel = course.level ? t(`searchCard.level${course.level.charAt(0).toUpperCase() + course.level.slice(1)}`) : undefined;

  const formatDuration = (h?: number) => {
    if (!h) return t('searchCard.durationVariable');
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const handleSave = () => {
    setLocalSaved((v) => !v);
    onSave?.(course);
  };

  const handleViewCourse = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    // Fire-and-forget tracking
    trainingApi.trackAccess({
      externalId: course.externalId,
      title: course.title,
      url: course.url,
      platformId: course.platformId,
    }).catch(err => console.error('Failed to track course access', err));
  };

  return (
    <div
      onClick={() => navigate(`/course/${encodeURIComponent(course.externalId)}`)}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-4 rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-6',
        'transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5 hover:border-foreground/20 hover:bg-background/50',
        alreadyAttended && 'border-emerald-300/50 dark:border-emerald-700/40',
      )}
    >
      {/* Already attended badge */}
      {alreadyAttended && (
        <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {t('searchCard.attended')}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-xl font-black text-foreground leading-[1.2] group-hover:text-primary transition-colors tracking-tight">
            {course.title}
          </h3>
        </div>
        {levelStyle && (
          <span className={cn('shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest font-black shadow-sm', levelStyle)}>
            {levelLabel}
          </span>
        )}
      </div>

      {/* Primary Meta (Platform, Instructor, Language) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <span className="flex items-center gap-1.5 text-foreground/90">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          {course.platformName}
        </span>
        {course.instructor && (
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {course.instructor}
          </span>
        )}
        {course.language && (
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            {course.language}
          </span>
        )}
      </div>

      {/* Secondary Meta (Duration, Rating, Relevance, Price) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {course.durationHours && (
          <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(course.durationHours)}
          </div>
        )}
        {/* Avaliação externa (rating da plataforma de origem) */}
        {course.rating !== undefined && (
          <div className="flex items-center gap-1 rounded-md bg-amber-50/50 px-2 py-0.5 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold border border-amber-200/30" title={t('searchCard.platformRatingAria')}>
            <Star className="h-3.5 w-3.5 fill-current" />
            {course.rating.toFixed(1)}
          </div>
        )}
        {/* Avaliação interna Softinsa */}
        {course.internalRating !== undefined && (
          <div className="flex items-center gap-1 rounded-md bg-orange-50/50 px-2 py-0.5 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 font-bold border border-orange-200/30" title={t('searchCard.internalRatingAria')}>
            <Star className="h-3.5 w-3.5 fill-current" />
            {course.internalRating.toFixed(1)}
            <span className="text-[9px] font-black uppercase tracking-wider opacity-70">int</span>
          </div>
        )}
        {/* Número de colegas que completaram */}
        {!!course.completedCount && (
          <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-muted-foreground" title="Concluído por colegas Softinsa">
            <Users className="h-3 w-3" />
            {course.completedCount}
          </div>
        )}
        {/* Relevância semântica */}
        {(course.relevanceScore !== undefined || course.similarityScore !== undefined || course.relevance !== undefined) && (
          <div className="flex items-center gap-1 rounded-md bg-blue-50/50 px-2 py-0.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold border border-blue-200/30" title="Relevância semântica">
            <BarChart3 className="h-3.5 w-3.5" />
            {Math.round(((course.relevanceScore || course.similarityScore || course.relevance || 0)) * 100)}%
          </div>
        )}
        {/* Preço — usa isFree boolean (backend) com fallback para price string */}
        <div className="ml-auto">
          {course.isFree === true || (course.price && course.price.toLowerCase().includes('free')) ? (
            <span className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <DollarSign className="inline h-2.5 w-2.5 mr-0.5 mb-0.5" />
              Free
            </span>
          ) : course.isFree === false ? (
            <span className="rounded-md bg-muted/80 border border-border text-muted-foreground px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <DollarSign className="inline h-2.5 w-2.5 mr-0.5 mb-0.5" />
              {course.price || t('filter.paid')}
            </span>
          ) : (
            <span className="rounded-md bg-muted/50 border border-border/60 text-muted-foreground/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
              <DollarSign className="inline h-2.5 w-2.5 mr-0.5 mb-0.5" />
              {course.price || '—'}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {course.description}
        </p>
      )}

      {/* Tags */}
      {course.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {course.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {course.tags.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              +{course.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between gap-4 pt-2 mt-auto border-t border-border/40">
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <ActionBtn
            icon={Bookmark}
            label={localSaved ? t('searchCard.saved') : t('searchCard.save')}
            onClick={handleSave}
            active={localSaved}
            activeClass="bg-blue-600 text-white border-transparent shadow-lg shadow-blue-500/20"
          />
        </div>

        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleViewCourse}
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-background transition-all duration-300 hover:opacity-90 active:scale-95 shadow-xl shadow-foreground/10"
        >
          {t('searchCard.viewCourse')}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

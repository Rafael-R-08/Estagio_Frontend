import {
  Star,
  Clock,
  ExternalLink,
  Bookmark,
  Flame,
  PlusCircle,
  CheckCircle2,
  BookOpen,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { trainingApi } from '@/services/api';
import type { CourseSearchResult } from '@/types';

// ─── Level badge ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante', intermediate: 'Intermédio', advanced: 'Avançado',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SearchResultCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-14 rounded-full bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex justify-between pt-1">
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-muted" />
          <div className="h-8 w-20 rounded-lg bg-muted" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-muted" />
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
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition active:scale-95',
        active
          ? cn('border-transparent', activeClass ?? 'bg-primary/10 text-primary')
          : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
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
  onPriority?: (c: CourseSearchResult) => void;
  onAddToPlan?: (c: CourseSearchResult) => void;
  savedExternalIds?: Set<string>;
  priorityExternalIds?: Set<string>;
  ongoingExternalIds?: Set<string>;
}

export function SearchResultCard({
  course,
  alreadyAttended = false,
  onSave,
  onPriority,
  onAddToPlan,
  savedExternalIds = new Set(),
  priorityExternalIds = new Set(),
  ongoingExternalIds = new Set(),
}: SearchResultCardProps) {
  const navigate = useNavigate();
  const [localSaved, setLocalSaved] = useState(savedExternalIds.has(course.externalId));
  const [localPriority, setLocalPriority] = useState(priorityExternalIds.has(course.externalId));
  const [localOngoing, setLocalOngoing] = useState(ongoingExternalIds.has(course.externalId));

  const levelStyle = course.level ? LEVEL_STYLES[course.level] : undefined;
  const levelLabel = course.level ? LEVEL_LABELS[course.level] : undefined;

  const handleSave = () => {
    setLocalSaved((v) => !v);
    onSave?.(course);
  };
  const handlePriority = () => {
    setLocalPriority((v) => !v);
    onPriority?.(course);
  };
  const handlePlan = () => {
    setLocalOngoing((v) => !v);
    onAddToPlan?.(course);
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
        'group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-5',
        'transition-all duration-200',
        'hover:-translate-y-[3px] hover:shadow-lg hover:shadow-black/10 hover:border-primary/30',
        alreadyAttended && 'border-emerald-300/50 dark:border-emerald-700/40',
      )}
    >
      {/* Already attended badge */}
      {alreadyAttended && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Frequentado
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 pr-4">
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
            {course.title}
          </h3>
        </div>
        {levelStyle && (
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', levelStyle)}>
            {levelLabel}
          </span>
        )}
      </div>

      {/* Platform + meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-medium text-foreground/80">
          <BookOpen className="h-3.5 w-3.5 text-primary/70" />
          {course.platformName}
        </span>
        {course.durationHours && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.durationHours}h
          </span>
        )}
        {course.rating && (
          <span className="flex items-center gap-1 text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            {course.rating.toFixed(1)}
          </span>
        )}
        {course.similarityScore !== undefined && (
          <span className="ml-auto text-[11px] text-primary/70 font-medium">
            {Math.round(course.similarityScore * 100)}% relevante
          </span>
        )}
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
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <ActionBtn
            icon={Bookmark}
            label={localSaved ? 'Guardado' : 'Guardar'}
            onClick={handleSave}
            active={localSaved}
            activeClass="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
          />
          <ActionBtn
            icon={Flame}
            label={localPriority ? 'Prioritário' : 'Prioritário'}
            onClick={handlePriority}
            active={localPriority}
            activeClass="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
          />
          <ActionBtn
            icon={PlusCircle}
            label={localOngoing ? 'A fazer' : 'Plano'}
            onClick={handlePlan}
            active={localOngoing}
            activeClass="bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400"
          />
        </div>

        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleViewCourse}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          Ver curso
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

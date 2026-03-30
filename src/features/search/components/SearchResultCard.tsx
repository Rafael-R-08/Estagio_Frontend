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
  DollarSign,
  BarChart3,
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
    <div className="animate-pulse rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 space-y-4">
      <div className="flex justify-between">
        <div className="h-5 w-2/3 rounded-lg bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-full bg-muted" />
        <div className="h-7 w-20 rounded-full bg-muted" />
      </div>
      <div className="flex justify-between pt-2">
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-full bg-muted" />
          <div className="h-9 w-24 rounded-full bg-muted" />
        </div>
        <div className="h-9 w-28 rounded-full bg-muted" />
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
          ? cn('border-transparent shadow-sm', activeClass ?? 'bg-foreground text-background')
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
          Frequentado
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 pr-5">
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {course.title}
          </h3>
        </div>
        {levelStyle && (
          <span className={cn('shrink-0 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold', levelStyle)}>
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
        {course.rating !== undefined && (
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            {course.rating.toFixed(1)}
          </span>
        )}
        {(course.relevanceScore !== undefined || course.similarityScore !== undefined || course.relevance !== undefined) && (
          <span className="flex items-center gap-1 text-blue-500 font-bold">
            <BarChart3 className="h-3.5 w-3.5" />
            {Math.round(((course.relevanceScore || course.similarityScore || course.relevance || 0)) * 100)}%
          </span>
        )}
        <div className="ml-auto">
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border",
            course.price && course.price.toLowerCase().includes('free') 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800"
              : "bg-muted border-border text-muted-foreground"
          )}>
            <DollarSign className="inline h-2.5 w-2.5 mr-0.5 mb-0.5" />
            {course.price || 'Free'}
          </span>
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
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-background transition-all duration-300 hover:opacity-90 active:scale-95 shadow-md shadow-foreground/5 ml-auto"
        >
          Ver curso
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

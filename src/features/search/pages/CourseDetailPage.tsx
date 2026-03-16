import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Clock,
  BookOpen,
  Tag,
  CheckCircle2,
  TrendingUp,
  Bookmark,
  Flame,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import { searchApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { toast } from '@/lib/toast-store';
import { cn } from '@/lib/utils';
import type { CourseSearchResult } from '@/types';

import { SearchResultCard, SearchResultCardSkeleton } from '../components/SearchResultCard';

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante', intermediate: 'Intermédio', advanced: 'Avançado',
};

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Sk className="h-5 w-32" />
      <div className="space-y-3">
        <Sk className="h-8 w-3/4" />
        <Sk className="h-4 w-48" />
        <div className="flex gap-3">
          <Sk className="h-6 w-20 rounded-full" />
          <Sk className="h-6 w-20 rounded-full" />
          <Sk className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-5/6" />
        <Sk className="h-4 w-4/5" />
      </div>
      <div className="flex gap-3">
        <Sk className="h-10 w-32 rounded-xl" />
        <Sk className="h-10 w-32 rounded-xl" />
        <Sk className="h-10 w-36 rounded-xl" />
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
  color?: string;
  loading?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, active, color = '', loading }: ActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition active:scale-95',
        active
          ? cn('border-transparent shadow-sm', color)
          : 'border-border text-foreground hover:bg-muted',
        loading && 'opacity-60 cursor-not-allowed',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ─── CourseDetailPage ─────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const externalId = rawId ? decodeURIComponent(rawId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

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

  // Create training mutation
  const createTraining = useMutation({
    mutationFn: trainingApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
  });
  const updateTraining = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof trainingApi.update>[1] }) =>
      trainingApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
  });

  const handleAction = (status: 'ongoing' | 'completed' | 'later' | 'priority') => {
    if (!course) return;

    if (existingRecord) {
      if (existingRecord.status === status) return; // no-op
      updateTraining.mutate(
        { id: existingRecord.id, dto: { status } },
        {
          onSuccess: () => toast.success('Estado atualizado!'),
          onError: () => toast.error('Erro ao atualizar.'),
        },
      );
    } else {
      createTraining.mutate(
        { title: course.title, url: course.url, status, platformId: course.platformId },
        {
          onSuccess: () => {
            const labels: Record<string, string> = {
              ongoing: 'Adicionado ao plano!',
              completed: 'Marcado como concluído!',
              later: 'Guardado!',
              priority: 'Marcado como prioritário!',
            };
            toast.success(labels[status]);
          },
          onError: () => toast.error('Erro ao guardar.'),
        },
      );
    }
  };

  const isPending = createTraining.isPending || updateTraining.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Curso não encontrado</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Este curso pode não estar na cache ainda. Tenta pesquisar primeiro.
          </p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ir para pesquisa
        </button>
      </div>
    );
  }

  const levelStyle = course.level ? LEVEL_STYLES[course.level] : undefined;
  const levelLabel = course.level ? LEVEL_LABELS[course.level] : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* ── Back ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Title + level */}
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-foreground leading-snug">
            {course.title}
          </h1>
          {levelStyle && (
            <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-bold', levelStyle)}>
              {levelLabel}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <BookOpen className="h-4 w-4 text-primary/70" />
            {course.platformName}
          </span>
          {course.durationHours && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.durationHours} horas
            </span>
          )}
          {course.rating && (
            <span className="flex items-center gap-1.5 text-amber-500 font-medium">
              <Star className="h-4 w-4 fill-current" />
              {course.rating.toFixed(1)} / 5
            </span>
          )}
          {existingRecord && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {existingRecord.status === 'completed' ? 'Concluído' :
               existingRecord.status === 'ongoing' ? 'Em progresso' :
               existingRecord.status === 'priority' ? 'Prioritário' : 'Guardado'}
            </span>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        {/* Tags */}
        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <ActionButton
            icon={TrendingUp}
            label="Adicionar ao plano"
            onClick={() => handleAction('ongoing')}
            active={existingRecord?.status === 'ongoing'}
            color="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400"
            loading={isPending}
          />
          <ActionButton
            icon={CheckCircle2}
            label="Marcar concluído"
            onClick={() => handleAction('completed')}
            active={existingRecord?.status === 'completed'}
            color="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
            loading={isPending}
          />
          <ActionButton
            icon={Bookmark}
            label="Guardar"
            onClick={() => handleAction('later')}
            active={existingRecord?.status === 'later'}
            color="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
            loading={isPending}
          />
          <ActionButton
            icon={Flame}
            label="Prioritário"
            onClick={() => handleAction('priority')}
            active={existingRecord?.status === 'priority'}
            color="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
            loading={isPending}
          />
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Abrir curso
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* ── Why recommended ──────────────────────────────────────────────── */}
      {course.similarityScore !== undefined && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Por que é recomendado?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Este curso tem uma relevância semântica de{' '}
            <span className="font-semibold text-primary">
              {Math.round(course.similarityScore * 100)}%
            </span>{' '}
            em relação à tua pesquisa, baseada em análise de conteúdo por IA. As tags{' '}
            <span className="font-medium text-foreground">
              {course.tags.slice(0, 3).join(', ')}
            </span>{' '}
            correspondem ao teu perfil e interesses.
          </p>
        </div>
      )}

      {/* ── Related courses ───────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Cursos relacionados</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.slice(0, 4).map((r: CourseSearchResult) =>
              isLoading ? (
                <SearchResultCardSkeleton key={r.externalId} />
              ) : (
                <SearchResultCard
                  key={r.externalId}
                  course={r}
                  alreadyAttended={trainings.some((t) => t.url === r.url)}
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

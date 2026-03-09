import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { toast } from '@/lib/toast-store';

import { searchApi, trainingApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { CourseSearchResult } from '@/types';

import { SearchBar } from '../components/SearchBar';
import { FilterSidebar, type Filters } from '../components/FilterSidebar';
import { SearchResultCard, SearchResultCardSkeleton } from '../components/SearchResultCard';

// ─── Empty / Error states ─────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Search className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {query ? `Sem resultados para "${query}"` : 'Começa a pesquisar'}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {query
            ? 'Tenta outros termos ou remove os filtros.'
            : 'Escreve um tema, tecnologia ou nome de curso.'}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Erro ao pesquisar</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Verifica a ligação ao backend.</p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  );
}

// ─── SearchPage ───────────────────────────────────────────────────────────────

export default function SearchPage() {
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ platforms: [], levels: [] });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Available platforms ──────────────────────────────────────────────────
  const { data: platforms = [] } = useQuery({
    queryKey: ['search-platforms'],
    queryFn: () => searchApi.getPlatforms().then((r) => r.data),
    staleTime: Infinity,
  });

  // ── Search results ───────────────────────────────────────────────────────
  const {
    data: searchResponse,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['search', searchQuery, filters.platforms],
    queryFn: () =>
      searchApi
        .search(searchQuery, 20, filters.platforms.length ? filters.platforms : undefined)
        .then((r) => r.data),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  // ── User's training records (for "já frequentado") ───────────────────────
  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  const attendedUrls = useMemo(
    () => new Set(trainings.map((t) => t.url)),
    [trainings],
  );
  const savedExternalIds = useMemo(
    () =>
      new Set(
        trainings
          .filter((t) => t.status === 'later')
          .map((t) => t.url),   // we'll compare by url since we don't store externalId
      ),
    [trainings],
  );
  const priorityUrls = useMemo(
    () => new Set(trainings.filter((t) => t.status === 'priority').map((t) => t.url)),
    [trainings],
  );
  const ongoingUrls = useMemo(
    () => new Set(trainings.filter((t) => t.status === 'ongoing').map((t) => t.url)),
    [trainings],
  );

  // ── Apply client-side level filter ───────────────────────────────────────
  const filteredResults = useMemo(() => {
    const results = searchResponse?.results ?? [];
    if (filters.levels.length === 0) return results;
    return results.filter(
      (c) => c.level && (filters.levels as string[]).includes(c.level),
    );
  }, [searchResponse, filters.levels]);

  // ── Training mutations ────────────────────────────────────────────────────
  const createTraining = useMutation({
    mutationFn: trainingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });

  const handleSave = (course: CourseSearchResult) => {
    const existing = trainings.find((t) => t.url === course.url);
    if (existing) return; // already saved — toggle handled by card local state
    createTraining.mutate(
      {
        title: course.title,
        url: course.url,
        status: 'later',
        platformId: course.platformId,
      },
      {
        onSuccess: () => toast.success(`"${course.title}" guardado!`),
        onError: () => toast.error('Erro ao guardar curso.'),
      },
    );
  };

  const handlePriority = (course: CourseSearchResult) => {
    const existing = trainings.find((t) => t.url === course.url);
    if (existing) return;
    createTraining.mutate(
      {
        title: course.title,
        url: course.url,
        status: 'priority',
        platformId: course.platformId,
      },
      {
        onSuccess: () => toast.success(`"${course.title}" marcado como prioritário!`),
        onError: () => toast.error('Erro ao marcar como prioritário.'),
      },
    );
  };

  const handleAddToPlan = (course: CourseSearchResult) => {
    const existing = trainings.find((t) => t.url === course.url);
    if (existing) return;
    createTraining.mutate(
      {
        title: course.title,
        url: course.url,
        status: 'ongoing',
        platformId: course.platformId,
      },
      {
        onSuccess: () => toast.success(`"${course.title}" adicionado ao plano!`),
        onError: () => toast.error('Erro ao adicionar ao plano.'),
      },
    );
  };

  const handleSearch = (q: string) => setSearchQuery(q);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesquisa</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Procura cursos em todas as plataformas ativas.
        </p>
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <SearchBar
        value={inputValue}
        onChange={setInputValue}
        onSearch={handleSearch}
        isLoading={isFetching}
        className="w-full"
      />

      {/* ── Semantic ranking badge ─────────────────────────────────────── */}
      {searchResponse?.semanticRanking && (
        <p className="text-xs text-primary/80 font-medium">
          ✦ Resultados ordenados por relevância semântica
        </p>
      )}

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden md:block">
          <FilterSidebar
            platforms={platforms}
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* Results */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar */}
          {(searchQuery || filteredResults.length > 0) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isFetching
                  ? 'A pesquisar…'
                  : filteredResults.length > 0
                  ? `${filteredResults.length} resultado${filteredResults.length !== 1 ? 's' : ''}`
                  : ''}
              </p>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded-md p-1.5 transition',
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label="Grid"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-md p-1.5 transition',
                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label="Lista"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isFetching && (
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SearchResultCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!isFetching && isError && (
            <ErrorState onRetry={() => refetch()} />
          )}

          {/* Empty state */}
          {!isFetching && !isError && filteredResults.length === 0 && (
            <EmptyState query={searchQuery} />
          )}

          {/* Results grid */}
          {!isFetching && !isError && filteredResults.length > 0 && (
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
            )}>
              {filteredResults.map((course) => (
                <SearchResultCard
                  key={course.externalId}
                  course={course}
                  alreadyAttended={attendedUrls.has(course.url)}
                  savedExternalIds={savedExternalIds}
                  priorityExternalIds={priorityUrls}
                  ongoingExternalIds={ongoingUrls}
                  onSave={handleSave}
                  onPriority={handlePriority}
                  onAddToPlan={handleAddToPlan}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

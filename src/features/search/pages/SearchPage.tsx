import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle, LayoutGrid, List, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';

import { searchApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CourseSearchResult } from '@/types';

import { SearchBar } from '../components/SearchBar';
import { FilterSidebar, type Filters } from '../components/FilterSidebar';
import { SearchResultCard, SearchResultCardSkeleton } from '../components/SearchResultCard';

// ─── Empty / Error states ─────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Search className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {query ? t('search.empty.withQuery', { query }) : t('search.empty.noQuery')}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {query
            ? t('search.empty.withQueryDesc')
            : t('search.empty.noQueryDesc')}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t('search.error.title')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('search.error.desc')}</p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        {t('search.error.retry')}
      </button>
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function SearchPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    platforms: [],
    level: undefined,
    isFree: undefined,
    minInternalRating: undefined,
    minExternalRating: undefined,
    minRelevance: undefined,
    language: undefined
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Reset page when search or filters change
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  // ── Available platforms ──────────────────────────────────────────────────
  const { data: platforms = [] } = useQuery({
    queryKey: ['search-platforms'],
    queryFn: () => searchApi.getPlatforms().then((r) => toList(r.data)),
    staleTime: Infinity,
  });

  // ── Search results ───────────────────────────────────────────────────────
  const {
    data: searchResponse,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'search',
      searchQuery,
      page,
      filters.platforms,
      filters.isFree,
      filters.minInternalRating,
      filters.minExternalRating,
      filters.minRelevance,
      filters.level,
      filters.language
    ],
    queryFn: () =>
      searchApi
        .search(
          searchQuery,
          PAGE_SIZE,
          filters.platforms.length ? filters.platforms : undefined,
          filters.isFree,
          filters.minInternalRating,
          filters.minRelevance,
          filters.level,
          filters.language,
          page,
          filters.minExternalRating
        )
        .then((r) => r.data),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  // ── User's training records (for "já frequentado") ───────────────────────
  const { data: trainings = [] } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => toList(r.data)),
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

  // ── Apply client-side level filter ───────────────────────────────────────
  const filteredResults = useMemo(() => {
    return searchResponse?.results ?? [];
  }, [searchResponse]);

  // ── Training mutations ────────────────────────────────────────────────────
  const createTraining = useMutation({
    mutationFn: trainingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });

  const handleSave = (course: CourseSearchResult) => {
    const existing = trainings.find((t) => t.url === course.url);
    if (existing) return;
    createTraining.mutate(
      {
        title: course.title,
        url: course.url,
        status: 'later',
        platformId: course.platformId,
      },
      {
        onSuccess: () => toast.success(t('search.toastSaved', { title: course.title })),
        onError: () => toast.error(t('search.toastSaveError')),
      },
    );
  };


  return (
    <div className="space-y-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="px-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t('search.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('search.subtitle')}
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

      {/* ── Browse banner (sem query ativa) ───────────────────────────── */}
      {!searchQuery && !isFetching && (searchResponse?.total ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            <span className="font-bold">{searchResponse!.total.toLocaleString()}</span>{'+ '}
            {t('search.browseHint')}
          </p>
        </div>
      )}

      {/* ── Semantic ranking badge (só com query activa) ──────────────── */}
      {searchQuery && searchResponse?.semanticRanking && (
        <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-80 animate-pulse px-1">
          ✦ {t('search.semanticRanking')}
        </p>
      )}

      {/* ── Filters Bar ────────────────────────────────────────────────── */}
      <div className="border-t border-border/40 pt-3">
        <FilterSidebar
          platforms={platforms}
          filters={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* ── Results Area ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">

        {/* Results */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar */}
          {(searchQuery || filteredResults.length > 0) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isFetching
                  ? t('search.searching')
                  : (searchResponse?.total ?? 0) > 0
                    ? t('search.resultsCount', { count: searchResponse!.total })
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
                  aria-label="List"
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

          {/* Empty state — only when there is an active query with no results,
               or when the initial browse load returned nothing */}
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
                  onSave={handleSave}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isFetching && !isError && searchResponse && (searchResponse.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-4 py-8 border-t border-border/40">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('search.prevPage')}
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                  {t('search.pageOf', { page, total: searchResponse.totalPages })}
                </span>
              </div>

              <button
                disabled={page >= (searchResponse.totalPages ?? 1)}
                onClick={() => setPage(p => Math.min((searchResponse.totalPages ?? 1), p + 1))}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('search.nextPage')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

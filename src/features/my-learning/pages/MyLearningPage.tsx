import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  CheckCircle2,
  Bookmark,
  Plus,
  XCircle,
  Calendar,
  Star,
  Target,
  Layers,
  ArrowDownUp,
  Clock,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';

import { trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TrainingStatus } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { TrainingCard } from '../components/TrainingCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ongoing' | 'completed' | 'later' | 'cancelled';

// ─── Stat tile ────────────────────────────────────────────────────────────────

function NavSegment({
  label,
  value,
  icon: Icon,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  value: number;
  icon: any;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3.5 transition-all duration-500',
        active
          ? cn('shadow-sm ring-1 ring-inset ring-foreground/5', activeColor)
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-lg transition-transform duration-500",
        active ? "scale-110" : "group-hover:scale-105"
      )}>
        <Icon className={cn("h-4 w-4", !active && "opacity-70")} />
      </div>

      <span className="hidden text-[10px] font-black uppercase tracking-[0.15em] sm:inline-block">
        {label}
      </span>

      <span className={cn(
        "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-all duration-500",
        active
          ? "bg-blue-600 text-white"
          : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20 group-hover:text-foreground"
      )}>
        {value}
      </span>

      {active && (
        <div className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-current opacity-50 blur-[2px]" />
      )}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onDiscover }: { onDiscover: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Plus className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t('myLearning.emptyHereTitle')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('myLearning.emptyHereDesc')}</p>
      </div>
      <button
        onClick={onDiscover}
        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        {t('myLearning.discoverCourses')}
      </button>
    </div>
  );
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-24 rounded-md bg-muted" />
        <div className="h-5 w-16 rounded-md bg-muted" />
      </div>
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-8 w-28 rounded-lg bg-muted mt-1" />
    </div>
  );
}

// ─── MyLearningPage ───────────────────────────────────────────────────────────

export default function MyLearningPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('ongoing');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setExpandedCardId(null);
    setSearchTerm('');
    setIsSearchVisible(false); // Reset search state on tab change
    setSortBy(tab === 'completed' ? 'date' : 'newest');
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: allTrainings = [], isLoading } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => toList(r.data)),
    staleTime: 1000 * 60 * 2,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & any) =>
      trainingApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      // When a training is marked completed, backend fires the notification async —
      // schedule a refetch after 3s to pick it up without waiting the full polling cycle
      if (variables.status === 'completed') {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }, 3000);
      }
    },
    onError: () => toast.error(t('myLearning.errorUpdate')),
  });

  const deleteMutation = useMutation({
    mutationFn: trainingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success(t('myLearning.deleted'));
    },
    onError: () => toast.error(t('myLearning.errorDelete')),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusChange = (id: string, status: TrainingStatus, extra?: any) => {
    updateMutation.mutate({ id, status, ...extra }, {
      onSuccess: () => {
        toast.success(t(`myLearning.statusToast.${status}`, t('myLearning.statusToast.default')));
      },
    });
  };

  const handleUpdateDetail = (id: string, data: any) => {
    updateMutation.mutate({ id, ...data });
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const counts: Record<Tab, number> = {
    ongoing: allTrainings.filter((t) => t.status === 'ongoing').length,
    completed: allTrainings.filter((t) => t.status === 'completed').length,
    later: allTrainings.filter((t) => t.status === 'later' || t.status === 'priority').length,
    cancelled: allTrainings.filter((t) => t.status === 'cancelled').length,
  };

  const tabTrainings = allTrainings.filter((t) => {
    const matchesTab = activeTab === 'later'
      ? t.status === 'later' || t.status === 'priority'
      : t.status === activeTab;

    if (!matchesTab) return false;

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (t.title?.toLowerCase().includes(search)) ||
      (t.platform?.name?.toLowerCase().includes(search))
    );
  });

  // Apply sorting
  if (activeTab === 'ongoing') {
    if (sortBy === 'newest') tabTrainings.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
    if (sortBy === 'oldest') tabTrainings.sort((a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime());
    if (sortBy === 'stage') {
      const stageOrder: Record<string, number> = { inicio: 0, meio: 1, finalizar: 2 };
      tabTrainings.sort((a, b) => (stageOrder[b.progressLevel || 'inicio'] || 0) - (stageOrder[a.progressLevel || 'inicio'] || 0));
    }
  } else if (activeTab === 'completed') {
    if (sortBy === 'date') tabTrainings.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    if (sortBy === 'rating') tabTrainings.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'relevance') tabTrainings.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t('myLearning.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('myLearning.hello')}, <span className="font-bold text-foreground">{(user?.name ?? 'Utilizador').split(' ')[0]}</span>.
            {' '}{t('myLearning.greetingSubtitle')}
          </p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="shrink-0 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          {t('myLearning.discoverBtn')}
        </button>
      </div>

      {/* ── Status Navigation ── */}
      <div className="rounded-[2.2rem] bg-muted/30 backdrop-blur-xl border border-border/40 p-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          <NavSegment
            label={t('myLearning.navTab.ongoing')}
            value={counts.ongoing}
            activeColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            icon={PlayCircle}
            active={activeTab === 'ongoing'}
            onClick={() => handleTabChange('ongoing')}
          />
          <NavSegment
            label={t('myLearning.navTab.completed')}
            value={counts.completed}
            activeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            icon={CheckCircle2}
            active={activeTab === 'completed'}
            onClick={() => handleTabChange('completed')}
          />
          <NavSegment
            label={t('myLearning.navTab.later')}
            value={counts.later}
            activeColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            icon={Bookmark}
            active={activeTab === 'later'}
            onClick={() => handleTabChange('later')}
          />
          <NavSegment
            label={t('myLearning.navTab.cancelled')}
            value={counts.cancelled}
            activeColor="bg-red-500/10 text-red-600 dark:text-red-400"
            icon={XCircle}
            active={activeTab === 'cancelled'}
            onClick={() => handleTabChange('cancelled')}
          />
        </div>
      </div>


      {/* ── Tab content ── */}
      <div className="min-h-[280px]">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : tabTrainings.length === 0 ? (
          searchTerm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-4 ring-1 ring-border/50">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t('myLearning.noResultsTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
                {t('myLearning.noResultsDesc', { term: searchTerm })}
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 text-sm font-bold text-primary hover:underline underline-offset-4"
              >
                {t('myLearning.clearSearch')}
              </button>
            </div>
          ) : (
            <EmptyState onDiscover={() => navigate('/search')} />
          )
        ) : activeTab === 'completed' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-1 mb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h2 className={cn(
                    "text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all duration-300",
                    isSearchVisible && "hidden sm:block opacity-40 shrink-0"
                  )}>
                    {t('myLearning.sectionCompleted')}
                  </h2>
                </div>

                {/* Collapsible Search */}
                <div className={cn(
                  "relative flex items-center transition-all duration-500 ease-in-out",
                  isSearchVisible ? "w-64" : "w-10"
                )}>
                  {!isSearchVisible ? (
                    <button
                      onClick={() => setIsSearchVisible(true)}
                      className="p-2 rounded-full hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex w-full items-center">
                      <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        placeholder={t('myLearning.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-full rounded-2xl border border-border/40 bg-muted/20 pl-9 pr-8 text-[11px] font-bold focus:bg-background focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all shadow-sm"
                      />
                      <button
                        onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }}
                        className="absolute right-2 p-1 rounded-full hover:bg-muted text-muted-foreground/60 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
                {[
                  { id: 'date', label: t('myLearning.sort.date'), icon: Calendar },
                  { id: 'rating', label: t('myLearning.sort.rating'), icon: Star },
                  { id: 'relevance', label: t('myLearning.sort.relevance'), icon: Target },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      sortBy === opt.id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <opt.icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tabTrainings.map((t) => (
                <div key={t.id} className={cn(expandedCardId === t.id && 'sm:col-span-2 transition-all duration-500')}>
                  <TrainingCard
                    training={t}
                    onStatusChange={handleStatusChange}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onUpdateDetail={handleUpdateDetail}
                    isUpdating={updateMutation.isPending}
                    isExpanded={expandedCardId === t.id}
                    onToggleExpand={() => setExpandedCardId(expandedCardId === t.id ? null : t.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'ongoing' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-1 mb-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-blue-500" />
                    <h2 className={cn(
                      "text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all duration-300",
                      isSearchVisible && "hidden sm:block opacity-40 shrink-0"
                    )}>
                      {t('myLearning.sectionOngoing')}
                    </h2>
                  </div>

                  {/* Collapsible Search */}
                  <div className={cn(
                    "relative flex items-center transition-all duration-500 ease-in-out",
                    isSearchVisible ? "w-64" : "w-10"
                  )}>
                    {!isSearchVisible ? (
                      <button
                        onClick={() => setIsSearchVisible(true)}
                        className="p-2 rounded-full hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex w-full items-center">
                        <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder={t('myLearning.searchPlaceholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-9 w-full rounded-2xl border border-border/40 bg-muted/20 pl-9 pr-8 text-[11px] font-bold focus:bg-background focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all shadow-sm"
                        />
                        <button
                          onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }}
                          className="absolute right-2 p-1 rounded-full hover:bg-muted text-muted-foreground/60 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
                  {[
                    { id: 'newest', label: t('myLearning.sort.newest'), icon: Clock },
                    { id: 'oldest', label: t('myLearning.sort.oldest'), icon: ArrowDownUp },
                    { id: 'stage', label: t('myLearning.sort.stage'), icon: Layers },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                        sortBy === opt.id
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <opt.icon className="h-3 w-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {tabTrainings.map((t) => (
                <div key={t.id} className={cn(expandedCardId === t.id && 'sm:col-span-2 transition-all duration-500')}>
                  <TrainingCard
                    training={t}
                    onStatusChange={handleStatusChange}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onUpdateDetail={handleUpdateDetail}
                    isUpdating={updateMutation.isPending}
                    isExpanded={expandedCardId === t.id}
                    onToggleExpand={() => setExpandedCardId(expandedCardId === t.id ? null : t.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


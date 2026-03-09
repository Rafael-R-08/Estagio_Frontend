import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Star,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast-store';

import { trainingApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { TrainingStatus } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { TrainingCard } from '../components/TrainingCard';
import { CompletedTimeline } from '../components/CompletedTimeline';
import { LearningPlanCard } from '../components/LearningPlanCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ongoing' | 'completed' | 'later' | 'priority';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ongoing',   label: 'Em Progresso' },
  { id: 'completed', label: 'Concluídos'   },
  { id: 'later',     label: 'Guardados'    },
  { id: 'priority',  label: 'Planos'       },
];

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  iconColor,
  icon,
  active,
}: {
  label: string;
  value: number;
  iconColor: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-colors',
        active ? 'border-primary' : 'border-border',
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-none text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EMPTY_COPY: Record<Tab, { title: string; desc: string }> = {
  ongoing: {
    title: 'Sem cursos em progresso',
    desc: 'Inicia um curso guardado ou procura formação na plataforma.',
  },
  completed: {
    title: 'Nenhum curso concluído',
    desc: 'Os cursos concluídos aparecerão aqui com a respetiva data e certificado.',
  },
  later: {
    title: 'Nenhum curso guardado',
    desc: 'Guarda cursos da pesquisa para consultar mais tarde.',
  },
  priority: {
    title: 'Plano de formação vazio',
    desc: 'Marca cursos como prioritários para estruturar o teu plano de aprendizagem.',
  },
};

function EmptyState({ tab, onDiscover }: { tab: Tab; onDiscover: () => void }) {
  const { title, desc } = EMPTY_COPY[tab];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Plus className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={onDiscover}
        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        Descobrir formação
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
  const [activeTab, setActiveTab] = useState<Tab>('ongoing');

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: allTrainings = [], isLoading } = useQuery({
    queryKey: ['trainings', 'all'],
    queryFn: () => trainingApi.getAll().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, ...dto }: { id: string; status?: TrainingStatus; rating?: number; completedAt?: string }) =>
      trainingApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
    onError: () => toast.error('Erro ao actualizar registo.'),
  });

  const deleteMutation = useMutation({
    mutationFn: trainingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Curso removido.');
    },
    onError: () => toast.error('Erro ao remover registo.'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusChange = (id: string, status: TrainingStatus) => {
    const extra = status === 'completed' ? { completedAt: new Date().toISOString() } : {};
    updateMutation.mutate({ id, status, ...extra }, {
      onSuccess: () => {
        const labels: Record<TrainingStatus, string> = {
          ongoing:   'movido para Em Progresso.',
          completed: 'marcado como concluído.',
          priority:  'adicionado ao plano.',
          later:     'guardado para mais tarde.',
        };
        toast.success(`Curso ${labels[status]}`);
      },
    });
  };

  const handleStart = (id: string) => handleStatusChange(id, 'ongoing');

  // ── Derived data ──────────────────────────────────────────────────────────
  const counts: Record<Tab, number> = {
    ongoing:   allTrainings.filter((t) => t.status === 'ongoing').length,
    completed: allTrainings.filter((t) => t.status === 'completed').length,
    later:     allTrainings.filter((t) => t.status === 'later').length,
    priority:  allTrainings.filter((t) => t.status === 'priority').length,
  };

  const tabTrainings = allTrainings.filter((t) => t.status === activeTab);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Progresso</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Olá, <span className="font-medium text-foreground">{(user?.name ?? 'Utilizador').split(' ')[0]}</span>.
            Acompanha o teu progresso de aprendizagem.
          </p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="shrink-0 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Adicionar curso
        </button>
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Em Progresso"
          value={counts.ongoing}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          icon={<PlayCircle className="h-5 w-5" />}
          active={activeTab === 'ongoing'}
        />
        <StatTile
          label="Concluídos"
          value={counts.completed}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          icon={<CheckCircle2 className="h-5 w-5" />}
          active={activeTab === 'completed'}
        />
        <StatTile
          label="Guardados"
          value={counts.later}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          icon={<Clock className="h-5 w-5" />}
          active={activeTab === 'later'}
        />
        <StatTile
          label="Planos"
          value={counts.priority}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          icon={<Star className="h-5 w-5" />}
          active={activeTab === 'priority'}
        />
      </div>

      {/* ── Tab bar (underline style) ── */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
              )}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div className="min-h-[280px]">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : tabTrainings.length === 0 ? (
          <EmptyState tab={activeTab} onDiscover={() => navigate('/search')} />
        ) : activeTab === 'completed' ? (
          <CompletedTimeline trainings={tabTrainings} />
        ) : activeTab === 'priority' ? (
          <div className="space-y-2">
            {tabTrainings.map((t, i) => (
              <LearningPlanCard
                key={t.id}
                training={t}
                rank={i + 1}
                onStart={handleStart}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tabTrainings.map((t) => (
              <TrainingCard
                key={t.id}
                training={t}
                onStatusChange={handleStatusChange}
                onDelete={(id) => deleteMutation.mutate(id)}
                onRate={(id, rating) => updateMutation.mutate({ id, rating })}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


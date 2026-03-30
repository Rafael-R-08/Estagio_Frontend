import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, CheckCircle2, Star, ExternalLink, User as UserIcon, Edit2,
  Download, RefreshCw, Briefcase, Link2,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { profileApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SERVICE_LINE_LABELS } from '@/types';
import type { ExperienceLevel, User, TrainingRecord, TrainingStats, ServiceLine } from '@/types';

import { TagInput } from '../components/TagInput';
import { LearningImpactCard } from '../components/LearningImpactCard';

// ─── RatingStars ─────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20',
          )}
        />
      ))}
    </span>
  );
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-foreground text-3xl font-bold text-background shadow-2xl ring-4 ring-foreground/10">
      {initials || <UserIcon className="h-10 w-10" />}
    </div>
  );
}

// ─── LEVELS ──────────────────────────────────────────────────────────────────

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-level' },
  { value: 'SENIOR', label: 'Senior' },
];

const LEVEL_SUBTITLE: Record<ExperienceLevel, string> = {
  JUNIOR: 'Junior Professional',
  MID: 'Mid-level Professional',
  SENIOR: 'Senior Professional',
};


// ─── ProfileSidebar ───────────────────────────────────────────────────────────

interface SidebarProps {
  user: User;
  isEditing: boolean;
  onEditToggle: () => void;
  draftName: string;
  draftLevel: ExperienceLevel | undefined;
  draftInterests: string[];
  draftUserFunction: string;
  draftServiceLine: ServiceLine | null;
  onNameChange: (v: string) => void;
  onLevelChange: (v: ExperienceLevel | undefined) => void;
  onInterestsChange: (v: string[]) => void;
  onUserFunctionChange: (v: string) => void;
  onServiceLineChange: (v: ServiceLine | null) => void;
}

function ProfileSidebar({
  user, isEditing, onEditToggle,
  draftName, draftLevel, draftInterests,
  draftUserFunction, draftServiceLine,
  onNameChange, onLevelChange, onInterestsChange,
  onUserFunctionChange, onServiceLineChange,
}: SidebarProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="rounded-[2.5rem] border border-border/60 bg-card/40 p-1 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col items-center p-8 pb-6 text-center">
          <UserAvatar name={draftName || user.name || 'U'} />
          <div className="mt-4 space-y-0.5">
            {isEditing ? (
              <input
                type="text"
                value={draftName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1 text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <h2 className="text-lg font-bold text-foreground">{draftName || user.name}</h2>
            )}
            <p className="text-sm font-medium text-primary">
              {draftLevel ? LEVEL_SUBTITLE[draftLevel] : user.role === 'ADMIN' ? t('profile.admin') : t('profile.collaborator')}
            </p>
            {draftLevel && (
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {draftLevel}
              </span>
            )}
            {!isEditing && draftUserFunction && (
              <p className="flex items-center justify-center gap-1 pt-1 text-xs font-medium text-foreground">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {draftUserFunction}
              </p>
            )}
            {!isEditing && draftServiceLine && (
              <div className="mt-1 flex justify-center">
                <p className="text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 inline-block">
                  {SERVICE_LINE_LABELS[draftServiceLine]}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onEditToggle}
            className={cn(
              'mt-6 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition active:scale-95',
              isEditing
                ? 'bg-foreground text-background shadow-xl'
                : 'border border-border/60 bg-background/40 text-foreground hover:bg-background/80',
            )}
          >
            <Edit2 className="h-3.5 w-3.5" />
            {isEditing ? t('profile.editActive') : t('profile.editProfile')}
          </button>

          {isEditing && (
            <div className="mt-3 w-full space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('profile.experienceLevel')}</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => onLevelChange(draftLevel === l.value ? undefined : l.value)}
                      className={cn(
                        'rounded-full px-3 py-0.5 text-xs font-medium transition',
                        draftLevel === l.value
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{t('profile.jobTitle')}</p>
                <input
                  type="text"
                  value={draftUserFunction}
                  onChange={(e) => onUserFunctionChange(e.target.value)}
                  placeholder={t('profile.jobTitlePlaceholder')}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Service Line</p>
                <select
                  value={draftServiceLine || ''}
                  onChange={(e) => onServiceLineChange((e.target.value as ServiceLine) || null)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Não definido</option>
                  {Object.entries(SERVICE_LINE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/40 px-6 py-4 text-center bg-muted/20">
          <p className="text-xs font-medium text-foreground">{user.email}</p>
          {user.createdAt && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Membro desde{' '}
              {new Date(user.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>


      {/* Learning Interests */}
      <div className="rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-xl backdrop-blur-2xl">
        {isEditing ? (
          <TagInput
            label="Interesses"
            description="Áreas temáticas que queres explorar"
            tags={draftInterests}
            onChange={onInterestsChange}
            placeholder="Ex: Cloud, DevOps, Machine Learning…"
            colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
          />
        ) : (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Learning Interests
            </p>
            {draftInterests.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">Nenhum interesse adicionado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {draftInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-md bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Learning Impact */}
    </div>
  );
}



// ─── TimelineItem ─────────────────────────────────────────────────────────────

function TimelineItem({ training, isLast }: { training: TrainingRecord; isLast: boolean }) {
  return (
    <li className={cn('pb-5', isLast && 'pb-0')}>
      <div className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{training.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {training.platform?.name && (
              <span className="text-xs text-muted-foreground">{training.platform.name}</span>
            )}
            {training.rating != null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Rating:</span>
                <RatingStars rating={training.rating} />
              </div>
            )}
            {training.relevance != null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Relevância:</span>
                <RatingStars rating={training.relevance} />
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">
            {training.completedAt
              ? new Date(training.completedAt).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <a
          href={training.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </li>
  );
}

// ─── ProfileFormBody ──────────────────────────────────────────────────────────
// Isolated with `key` so it remounts when profile loads

interface FormBodyProps {
  initialValues: User;
  timeline: TrainingRecord[];
  stats?: TrainingStats;
}

function ProfileFormBody({ initialValues, timeline, stats }: FormBodyProps) {
  const { setUser: setAuthUser } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);

  const [draftName, setDraftName] = useState(initialValues.name ?? '');
  const [draftLevel, setDraftLevel] = useState<ExperienceLevel | undefined>(initialValues.experienceLevel);
  const [draftInterests, setDraftInterests] = useState<string[]>(initialValues.interests ?? []);
  const [draftUserFunction, setDraftUserFunction] = useState(initialValues.userFunction ?? '');
  const [draftServiceLine, setDraftServiceLine] = useState<ServiceLine | null>(initialValues.serviceLine ?? null);

  const dirty = useMemo(
    () =>
      draftName !== (initialValues.name ?? '') ||
      draftLevel !== initialValues.experienceLevel ||
      JSON.stringify(draftInterests) !== JSON.stringify(initialValues.interests ?? []) ||
      draftUserFunction !== (initialValues.userFunction ?? '') ||
      draftServiceLine !== (initialValues.serviceLine ?? null),
    [draftName, draftLevel, draftInterests, draftUserFunction, draftServiceLine, initialValues],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: draftName || undefined,
        experienceLevel: draftLevel,
        interests: draftInterests,
        userFunction: draftUserFunction,
        serviceLine: draftServiceLine || undefined,
      }),
    onSuccess: (res) => {
      setAuthUser(res.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('profile.saveSuccess'));
      setIsEditing(false);
    },
    onError: () => {
      toast.error(t('profile.saveError'));
    },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Left sidebar ── */}
      <div className="lg:col-span-1">
        <div className="space-y-4 lg:sticky lg:top-6">
          <ProfileSidebar
            user={initialValues}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing((v) => !v)}
            draftName={draftName}
            draftLevel={draftLevel}
            draftInterests={draftInterests}
            draftUserFunction={draftUserFunction}
            draftServiceLine={draftServiceLine}
            onNameChange={setDraftName}
            onLevelChange={setDraftLevel}
            onInterestsChange={setDraftInterests}
            onUserFunctionChange={setDraftUserFunction}
            onServiceLineChange={setDraftServiceLine}
          />
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Save bar */}
        {dirty && (
          <div className="flex items-center justify-between rounded-full border border-foreground/10 bg-foreground px-6 py-3 text-background shadow-2xl animate-in fade-in slide-in-from-top-4">
            <p className="text-sm font-bold">Tens alterações por guardar.</p>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        )}

        {/* Learning Impact */}
        <LearningImpactCard stats={stats} timeline={timeline} />

        {/* Learning Timeline */}
        <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-xl backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Learning Timeline</h2>
            {timeline.length > 0 && (
              <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-black text-background">
                {timeline.length}
              </span>
            )}
          </div>
          <div className="p-6">
            {timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground/60">
                Ainda não concluíste nenhuma formação.
              </p>
            ) : (
              <ol className="relative space-y-0 border-l border-border pl-6">
                {timeline.map((t, i) => (
                  <TimelineItem key={t.id} training={t} isLast={i === timeline.length - 1} />
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Integrações & Ações */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Integrações &amp; Ações</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            <button
              type="button"
              onClick={() => toast.success('Integração LinkedIn Learning brevemente disponível.')}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="text-xs font-medium text-foreground">LinkedIn Learning</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success('Integração Credly brevemente disponível.')}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-xs font-medium text-foreground">Credly</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted"
            >
              <Download className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">Exportar CV PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copiado para a área de transferência!');
              }}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition hover:bg-muted"
            >
              <Link2 className="h-4 w-4 shrink-0 text-violet-500" />
              <span className="text-xs font-medium text-foreground">Partilhar perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await profileApi.getMe();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: completedTrainings = [] } = useQuery({
    queryKey: ['trainings', 'completed'],
    queryFn: async () => {
      const res = await trainingApi.getAll({ status: 'completed' });
      return toList(res.data);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['trainings', 'stats'],
    queryFn: async () => {
      const res = await trainingApi.getStats();
      return res.data;
    },
  });

  const timeline = useMemo(
    () =>
      [...completedTrainings].sort((a, b) => {
        const da = new Date(a.completedAt ?? a.createdAt ?? 0).getTime();
        const db = new Date(b.completedAt ?? b.createdAt ?? 0).getTime();
        return db - da;
      }),
    [completedTrainings],
  );

  const formSource = profile ?? authUser;
  const formKey = profile ? 'profile' : 'auth';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Gere a tua presença e visualiza o teu impacto.
        </p>
      </div>
      {formSource && (
        <ProfileFormBody
          key={formKey}
          initialValues={formSource}
          timeline={timeline}
          stats={stats}
        />
      )}
    </div>
  );
}

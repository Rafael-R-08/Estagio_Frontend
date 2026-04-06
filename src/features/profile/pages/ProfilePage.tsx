import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, User as UserIcon, Edit2,
  Download, RefreshCw, Briefcase, Link2,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { profileApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SERVICE_LINE_LABELS } from '@/types';
import type { ExperienceLevel, User, TrainingRecord, TrainingStats, ServiceLine, UserSkill } from '@/types';

import { TagInput } from '../components/TagInput';
import { LearningImpactCard } from '../components/LearningImpactCard';
import { SkillsSection } from '../components/SkillsSection';

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-blue-600 text-3xl font-bold text-white shadow-2xl ring-4 ring-blue-600/20">
      {initials || <UserIcon className="h-10 w-10" />}
    </div>
  );
}

// ─── LEVELS ──────────────────────────────────────────────────────────────────

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'intermedio', label: 'Intermédio' },
  { value: 'senior', label: 'Sénior' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'lider', label: 'Líder' },
];

const LEVEL_SUBTITLE: Record<ExperienceLevel, string> = {
  junior: 'Junior Professional',
  intermedio: 'Mid-level Professional',
  senior: 'Senior Professional',
  especialista: 'Technical Specialist',
  lider: 'Team Lead / Manager',
};


// ─── ProfileSidebar ───────────────────────────────────────────────────────────

interface SidebarProps {
  user: User;
  isEditing: boolean;
  onEditToggle: () => void;
  draftName: string;
  draftLevel: ExperienceLevel | undefined;
  draftInterests: string[];
  draftSkills: UserSkill[];
  draftUserFunction: string;
  draftServiceLine: ServiceLine | null;
  onNameChange: (v: string) => void;
  onLevelChange: (v: ExperienceLevel | undefined) => void;
  onInterestsChange: (v: string[]) => void;
  onSkillsChange: (v: UserSkill[]) => void;
  onUserFunctionChange: (v: string) => void;
  onServiceLineChange: (v: ServiceLine | null) => void;
}

function ProfileSidebar({
  user, isEditing, onEditToggle,
  draftName, draftLevel, draftInterests, draftSkills,
  draftUserFunction, draftServiceLine,
  onNameChange, onLevelChange, onInterestsChange, onSkillsChange,
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
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
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
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
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
                        'rounded-full px-3 py-0.5 text-[10px] font-medium transition uppercase',
                        draftLevel === l.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-medium text-muted-foreground ml-1">{t('profile.jobTitle')}</p>
                <input
                  type="text"
                  value={draftUserFunction}
                  onChange={(e) => onUserFunctionChange(e.target.value)}
                  placeholder={t('profile.jobTitlePlaceholder')}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-medium text-muted-foreground ml-1">Service Line</p>
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
      <div className="rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-xl backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-colors" />
        {isEditing ? (
          <TagInput
            label="Interesses de Aprendizagem"
            description="Áreas que gostarias de explorar"
            tags={draftInterests}
            onChange={onInterestsChange}
            placeholder="Ex: Cloud, DevOps..."
            colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
          />
        ) : (
          <div className="relative z-10">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              Learning Interests
            </p>
            {draftInterests.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 italic">Nenhum interesse adicionado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {draftInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-md bg-violet-100/80 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Technical Skills - NEW */}
      <div className="rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-xl backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
        <div className="relative z-10">
          <SkillsSection
            label="Competências Técnicas"
            description="Aptidões e níveis de proficiência"
            skills={draftSkills}
            onChange={onSkillsChange}
            isEditing={isEditing}
          />
        </div>
      </div>

    </div>
  );
}



// ─── TimelineItem ─────────────────────────────────────────────────────────────

// ─── ProfileFormBody ──────────────────────────────────────────────────────────

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
  const [draftSkills, setDraftSkills] = useState<UserSkill[]>(initialValues.skills ?? []);
  const [draftUserFunction, setDraftUserFunction] = useState(initialValues.userFunction ?? '');
  const [draftServiceLine, setDraftServiceLine] = useState<ServiceLine | null>(initialValues.serviceLine ?? null);

  const dirty = useMemo(
    () =>
      draftName !== (initialValues.name ?? '') ||
      draftLevel !== initialValues.experienceLevel ||
      JSON.stringify(draftInterests) !== JSON.stringify(initialValues.interests ?? []) ||
      JSON.stringify(draftSkills) !== JSON.stringify(initialValues.skills ?? []) ||
      draftUserFunction !== (initialValues.userFunction ?? '') ||
      draftServiceLine !== (initialValues.serviceLine ?? null),
    [draftName, draftLevel, draftInterests, draftSkills, draftUserFunction, draftServiceLine, initialValues],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: draftName || undefined,
        experienceLevel: draftLevel,
        interests: draftInterests,
        skills: draftSkills,
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pb-12">
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
            draftSkills={draftSkills}
            draftUserFunction={draftUserFunction}
            draftServiceLine={draftServiceLine}
            onNameChange={setDraftName}
            onLevelChange={setDraftLevel}
            onInterestsChange={setDraftInterests}
            onSkillsChange={setDraftSkills}
            onUserFunctionChange={setDraftUserFunction}
            onServiceLineChange={setDraftServiceLine}
          />
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Save bar */}
        {dirty && (
          <div className="flex items-center justify-between rounded-full border border-blue-600/20 bg-blue-600 px-6 py-3 text-white shadow-2xl animate-in fade-in slide-in-from-top-4 relative z-50">
            <p className="text-sm font-black tracking-tight">Tens alterações por guardar.</p>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-full bg-background px-6 py-2 text-xs font-black text-foreground transition hover:opacity-90 disabled:opacity-60 active:scale-95 shadow-lg"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'A guardar…' : 'GRAVAR PERFIL'}
            </button>
          </div>
        )}

        {/* Learning Impact */}
        <LearningImpactCard stats={stats} timeline={timeline} />

        {/* Integrações & Ações */}
        <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-xl backdrop-blur-2xl overflow-hidden">
          <div className="border-b border-border/40 px-8 py-6 bg-muted/10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Conectividade</h2>
            <p className="font-black text-foreground tracking-tight">Integrações & Ações</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8">
            <button
              type="button"
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/10 px-5 py-4 text-left transition hover:bg-muted/30 group"
            >
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-foreground">LinkedIn Learning</span>
                <p className="text-[10px] font-medium text-muted-foreground">Sincronizar progresso</p>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/10 px-5 py-4 text-left transition hover:bg-muted/30 group"
            >
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-foreground">Credly</span>
                <p className="text-[10px] font-medium text-muted-foreground">Badges digitais</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/10 px-5 py-4 text-left transition hover:bg-muted/30 group"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-foreground">Exportar CV PDF</span>
                <p className="text-[10px] font-medium text-muted-foreground">Formato oficial Softinsa</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link de perfil copiado!');
              }}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/10 px-5 py-4 text-left transition hover:bg-muted/30 group"
            >
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-foreground">Partilhar perfil</span>
                <p className="text-[10px] font-medium text-muted-foreground">Link interno direto</p>
              </div>
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
      <div className="px-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          {t('profile.title')}
        </h1>
        <p className="mt-2 text-base font-medium text-muted-foreground max-w-2xl">
          Gere a tua presença digital na Softinsa, visualiza as tuas conquistas e partilha o teu impacto com a equipa.
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

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, CheckCircle2, Star, ExternalLink, User as UserIcon, Edit2,
  MapPin, Briefcase, Globe, Link2, Download, RefreshCw,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { profileApi, trainingApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ExperienceLevel, User, TrainingRecord, TrainingStats } from '@/types';

import { TagInput } from '../components/TagInput';

// ─── localStorage helpers for extra profile fields ────────────────────────────
// (campos não suportados pelo backend ainda — guardados localmente por utilizador)

interface LocalProfileExtra {
  jobTitle?: string;
  department?: string;
  location?: string;
  language?: string;
}

function loadLocalExtra(userId: string): LocalProfileExtra {
  try {
    const raw = localStorage.getItem(`profile_extra_${userId}`);
    return raw ? (JSON.parse(raw) as LocalProfileExtra) : {};
  } catch {
    return {};
  }
}

function saveLocalExtra(userId: string, data: LocalProfileExtra) {
  localStorage.setItem(`profile_extra_${userId}`, JSON.stringify(data));
}

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
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-lg ring-4 ring-primary/20">
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

// Decorative skill display bars (no per-skill data in model)
const SKILL_DISPLAY = ['Expert', 'Advanced', 'Intermediate', 'Expert', 'Advanced'];
const SKILL_BAR_WIDTHS = [95, 75, 55, 90, 70];

// ─── ProfileSidebar ───────────────────────────────────────────────────────────

interface SidebarProps {
  user: User;
  isEditing: boolean;
  onEditToggle: () => void;
  draftName: string;
  draftLevel: ExperienceLevel | undefined;
  draftSkills: string[];
  draftInterests: string[];
  draftJobTitle: string;
  draftDepartment: string;
  draftLocation: string;
  draftLanguage: string;
  onNameChange: (v: string) => void;
  onLevelChange: (v: ExperienceLevel | undefined) => void;
  onSkillsChange: (v: string[]) => void;
  onInterestsChange: (v: string[]) => void;
  onJobTitleChange: (v: string) => void;
  onDepartmentChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onLanguageChange: (v: string) => void;
}

function ProfileSidebar({
  user, isEditing, onEditToggle,
  draftName, draftLevel, draftSkills, draftInterests,
  draftJobTitle, draftDepartment, draftLocation, draftLanguage,
  onNameChange, onLevelChange, onSkillsChange, onInterestsChange,
  onJobTitleChange, onDepartmentChange, onLocationChange, onLanguageChange,
}: SidebarProps) {
  return (
    <div className="space-y-4">
      {/* Identity card */}
      <div className="rounded-xl border border-primary/30 bg-card shadow-sm">
        <div className="flex flex-col items-center p-6 pb-4 text-center">
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
              {draftLevel ? LEVEL_SUBTITLE[draftLevel] : user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
            </p>
            {draftLevel && (
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {draftLevel}
              </span>
            )}
            {!isEditing && draftJobTitle && (
              <p className="flex items-center justify-center gap-1 pt-1 text-xs font-medium text-foreground">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                {draftJobTitle}{draftDepartment ? ` · ${draftDepartment}` : ''}
              </p>
            )}
            {!isEditing && draftLocation && (
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {draftLocation === 'escritorio' ? 'Escritório' : draftLocation === 'remoto' ? 'Remoto' : 'Híbrido'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onEditToggle}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
              isEditing
                ? 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                : 'border-border bg-transparent text-foreground hover:bg-muted',
            )}
          >
            <Edit2 className="h-3.5 w-3.5" />
            {isEditing ? 'Modo edição activo' : 'Editar Perfil'}
          </button>

          {isEditing && (
            <div className="mt-3 w-full space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Nível de experiência</p>
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
                <p className="text-xs font-medium text-muted-foreground">Cargo</p>
                <input
                  type="text"
                  value={draftJobTitle}
                  onChange={(e) => onJobTitleChange(e.target.value)}
                  placeholder="Ex: Software Engineer"
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Departamento</p>
                <input
                  type="text"
                  value={draftDepartment}
                  onChange={(e) => onDepartmentChange(e.target.value)}
                  placeholder="Ex: Engenharia"
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Localização</p>
                <select
                  value={draftLocation}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Não definido</option>
                  <option value="escritorio">Escritório</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.createdAt && (
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              Membro desde{' '}
              {new Date(user.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Professional Skills */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {isEditing ? (
          <TagInput
            label="Stack tecnológica"
            description="Tecnologias e linguagens que utilizas"
            tags={draftSkills}
            onChange={onSkillsChange}
            placeholder="Ex: React, Azure, Python…"
            colorClass="bg-primary/10 text-primary"
          />
        ) : (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Professional Skills
            </p>
            {draftSkills.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">Nenhuma skill adicionada.</p>
            ) : (
              <ul className="space-y-3">
                {draftSkills.map((skill, i) => (
                  <li key={skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{skill}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {SKILL_DISPLAY[i % SKILL_DISPLAY.length]}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted">
                      <div
                        className="h-1 rounded-full bg-primary"
                        style={{ width: `${SKILL_BAR_WIDTHS[i % SKILL_BAR_WIDTHS.length]}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Learning Interests */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
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

      {/* Preferências */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          Preferências
        </p>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Idioma de formação</p>
          {isEditing ? (
            <select
              value={draftLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Não definido</option>
              <option value="PT">🇵🇹 Português</option>
              <option value="EN">🇬🇧 English</option>
              <option value="ES">🇪🇸 Español</option>
              <option value="FR">🇫🇷 Français</option>
            </select>
          ) : (
            <p className="text-sm text-foreground">
              {draftLanguage === 'PT' ? '🇵🇹 Português'
                : draftLanguage === 'EN' ? '🇬🇧 English'
                : draftLanguage === 'ES' ? '🇪🇸 Español'
                : draftLanguage === 'FR' ? '🇫🇷 Français'
                : <span className="text-xs text-muted-foreground/60">Não definido</span>}
            </p>
          )}
        </div>
      </div>

      {/* Learning Impact */}
    </div>
  );
}

// ─── helpers: monthly hours & streak ─────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function computeMonthlyHours(timeline: TrainingRecord[]): { label: string; hours: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const hours = timeline
      .filter((t) => {
        if (!t.completedAt) return false;
        const c = new Date(t.completedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((sum, t) => sum + (t.durationHours ?? 0), 0);
    return { label: MONTH_LABELS[d.getMonth()], hours };
  });
}

function computeStreak(timeline: TrainingRecord[]): number {
  const dates = new Set(
    timeline.filter((t) => t.completedAt).map((t) => new Date(t.completedAt!).toDateString()),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

// ─── LearningImpactCard ───────────────────────────────────────────────────────

const COMPANY_AVG_HOURS = 42; // mock — sem API de média da empresa ainda

function LearningImpactCard({ stats, timeline }: { stats?: TrainingStats; timeline: TrainingRecord[] }) {
  const monthlyHours = useMemo(() => computeMonthlyHours(timeline), [timeline]);
  const streak = useMemo(() => computeStreak(timeline), [timeline]);
  const maxBarHours = Math.max(...monthlyHours.map((m) => m.hours), 1);
  const userHours = stats?.totalHours ?? 0;
  const comparisonMax = Math.max(userHours, COMPANY_AVG_HOURS, 1);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Learning Impact</h2>
      </div>
      <div className="space-y-6 p-5">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xl font-bold text-foreground">{userHours}h</p>
            <p className="text-[11px] text-muted-foreground">Horas totais</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xl font-bold text-foreground">{stats?.completed ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Formações</p>
          </div>
          <div className={cn('rounded-lg p-3', streak > 0 ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-muted/40')}>
            <p className={cn('text-xl font-bold', streak > 0 ? 'text-amber-500' : 'text-foreground')}>
              {streak} {streak > 0 && '🔥'}
            </p>
            <p className="text-[11px] text-muted-foreground">Streak (dias)</p>
          </div>
        </div>

        {/* Bar chart — horas por mês */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">Horas por mês (6 meses)</p>
          <div className="flex h-24 items-end gap-1.5">
            {monthlyHours.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                {m.hours > 0 && (
                  <span className="text-[9px] font-medium text-muted-foreground">{m.hours}h</span>
                )}
                <div className="flex w-full flex-1 items-end rounded-sm bg-muted/50">
                  <div
                    className="w-full rounded-sm bg-primary transition-all duration-500"
                    style={{ height: `${Math.max((m.hours / maxBarHours) * 100, m.hours > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparação com empresa */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">Comparação com a empresa</p>
          <div className="space-y-2.5">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Tu</span>
                <span className="text-xs text-muted-foreground">{userHours}h</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(userHours / comparisonMax) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Média empresa</span>
                <span className="text-xs text-muted-foreground">{COMPANY_AVG_HOURS}h</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-muted-foreground/40 transition-all duration-500"
                  style={{ width: `${(COMPANY_AVG_HOURS / comparisonMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/50">
            * Média baseada em dados agregados e anónimos.
          </p>
        </div>
      </div>
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
            {training.rating != null && <RatingStars rating={training.rating} />}
            {training.durationHours && (
              <span className="text-xs text-muted-foreground">{training.durationHours}h</span>
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

  const [isEditing, setIsEditing] = useState(false);

  const [draftName, setDraftName] = useState(initialValues.name ?? '');
  const [draftLevel, setDraftLevel] = useState<ExperienceLevel | undefined>(initialValues.experienceLevel);
  const [draftSkills, setDraftSkills] = useState<string[]>(initialValues.techStack ?? []);
  const [draftInterests, setDraftInterests] = useState<string[]>(initialValues.interests ?? []);

  // Extra fields stored in localStorage (not yet supported by the backend)
  const localExtra = useMemo(() => loadLocalExtra(initialValues.id), [initialValues.id]);
  const [draftJobTitle, setDraftJobTitle] = useState(localExtra.jobTitle ?? '');
  const [draftDepartment, setDraftDepartment] = useState(localExtra.department ?? '');
  const [draftLocation, setDraftLocation] = useState(localExtra.location ?? '');
  const [draftLanguage, setDraftLanguage] = useState(localExtra.language ?? '');

  const dirty = useMemo(
    () =>
      draftName !== (initialValues.name ?? '') ||
      draftLevel !== initialValues.experienceLevel ||
      JSON.stringify(draftSkills) !== JSON.stringify(initialValues.techStack ?? []) ||
      JSON.stringify(draftInterests) !== JSON.stringify(initialValues.interests ?? []) ||
      draftJobTitle !== (localExtra.jobTitle ?? '') ||
      draftDepartment !== (localExtra.department ?? '') ||
      draftLocation !== (localExtra.location ?? '') ||
      draftLanguage !== (localExtra.language ?? ''),
    [draftName, draftLevel, draftSkills, draftInterests, draftJobTitle, draftDepartment, draftLocation, draftLanguage, initialValues, localExtra],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: draftName || undefined,
        experienceLevel: draftLevel,
        techStack: draftSkills,
        interests: draftInterests,
      }),
    onSuccess: (res) => {
      setAuthUser(res.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      saveLocalExtra(initialValues.id, {
        jobTitle: draftJobTitle || undefined,
        department: draftDepartment || undefined,
        location: draftLocation || undefined,
        language: draftLanguage || undefined,
      });
      toast.success('Perfil guardado com sucesso!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erro ao guardar o perfil.');
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
            draftSkills={draftSkills}
            draftInterests={draftInterests}
            draftJobTitle={draftJobTitle}
            draftDepartment={draftDepartment}
            draftLocation={draftLocation}
            draftLanguage={draftLanguage}
            onNameChange={setDraftName}
            onLevelChange={setDraftLevel}
            onSkillsChange={setDraftSkills}
            onInterestsChange={setDraftInterests}
            onJobTitleChange={setDraftJobTitle}
            onDepartmentChange={setDraftDepartment}
            onLocationChange={setDraftLocation}
            onLanguageChange={setDraftLanguage}
          />
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Save bar */}
        {dirty && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
            <p className="text-sm text-foreground">Tens alterações por guardar.</p>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        )}

        {/* Learning Impact */}
        <LearningImpactCard stats={stats} timeline={timeline} />

        {/* Learning Timeline */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Learning Timeline</h2>
            {timeline.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {timeline.length}
              </span>
            )}
          </div>
          <div className="p-5">
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
      return res.data;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere o teu perfil.
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

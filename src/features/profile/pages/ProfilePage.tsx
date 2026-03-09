import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle2, Star, ExternalLink } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { profileApi, trainingApi, certificatesApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ExperienceLevel, User, TrainingRecord, Certificate } from '@/types';

import { ProfileHeader } from '../components/ProfileHeader';
import { TagInput } from '../components/TagInput';
import { CertificateAlerts } from '../components/CertificateAlerts';

// ─── Rating stars ─────────────────────────────────────────────────────────────

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

// ─── ProfileFormBody ─────────────────────────────────────────────────────────
// Isolated with `key` so it remounts (and re-initializes state) when profile loads

interface FormBodyProps {
  initialValues: User;
  certificates: Certificate[];
  timeline: TrainingRecord[];
}

function ProfileFormBody({ initialValues, certificates, timeline }: FormBodyProps) {
  const { setUser: setAuthUser } = useAuth();
  const queryClient = useQueryClient();

  const [draftName, setDraftName] = useState(initialValues.name ?? '');
  const [draftLevel, setDraftLevel] = useState<ExperienceLevel | undefined>(initialValues.experienceLevel);
  const [draftSkills, setDraftSkills] = useState<string[]>(initialValues.techStack ?? []);
  const [draftInterests, setDraftInterests] = useState<string[]>(initialValues.interests ?? []);

  const dirty = useMemo(
    () =>
      draftName !== (initialValues.name ?? '') ||
      draftLevel !== initialValues.experienceLevel ||
      JSON.stringify(draftSkills) !== JSON.stringify(initialValues.techStack ?? []) ||
      JSON.stringify(draftInterests) !== JSON.stringify(initialValues.interests ?? []),
    [draftName, draftLevel, draftSkills, draftInterests, initialValues],
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
      toast.success('Perfil guardado com sucesso!');
    },
    onError: () => toast.error('Erro ao guardar o perfil.'),
  });

  return (
    <div className="flex flex-col gap-6">
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

      {/* Profile header card */}
      <ProfileHeader
        user={initialValues}
        draftName={draftName}
        draftLevel={draftLevel}
        onNameChange={setDraftName}
        onLevelChange={setDraftLevel}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: skills + interests */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <TagInput
              label="Stack tecnológica"
              description="Tecnologias e linguagens que utilizas"
              tags={draftSkills}
              onChange={setDraftSkills}
              placeholder="Ex: React, Azure, Python…"
              colorClass="bg-primary/10 text-primary"
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <TagInput
              label="Interesses"
              description="Áreas temáticas que queres explorar"
              tags={draftInterests}
              onChange={setDraftInterests}
              placeholder="Ex: Cloud, DevOps, Machine Learning…"
              colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
            />
          </div>
        </div>

        {/* Right: certificate alerts + timeline */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Alertas de certificados</h2>
            <CertificateAlerts certificates={certificates} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Formações concluídas
              {timeline.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {timeline.length}
                </span>
              )}
            </h2>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground/60">
                Ainda não concluíste nenhuma formação.
              </p>
            ) : (
              <ol className="relative space-y-0 border-l border-border pl-6">
                {timeline.map((t, i) => (
                  <li key={t.id} className={cn('pb-5', i === timeline.length - 1 && 'pb-0')}>
                    <div className="absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {t.platform?.name && (
                            <span className="text-xs text-muted-foreground">{t.platform.name}</span>
                          )}
                          {t.rating != null && <RatingStars rating={t.rating} />}
                          {t.durationHours && (
                            <span className="text-xs text-muted-foreground">{t.durationHours}h</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                          {t.completedAt
                            ? new Date(t.completedAt).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            )}
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

  const { data: certificates = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const res = await certificatesApi.getAll();
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
  // 'auth' → 'profile' remounts ProfileFormBody once with correct server values
  const formKey = profile ? 'profile' : 'auth';

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gere as tuas informações e preferências de aprendizagem
        </p>
      </div>

      {formSource && (
        <ProfileFormBody
          key={formKey}
          initialValues={formSource}
          certificates={certificates}
          timeline={timeline}
        />
      )}
    </div>
  );
}

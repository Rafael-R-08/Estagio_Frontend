import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, Award, CheckCircle2, Clock, Star,
  AlertTriangle, Zap, ShieldCheck, Brain,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { slManagerApi } from '../../../services/api';
import { cn } from '../../../lib/utils';

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md px-5 py-4 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4 bg-background/20">
      <div className="flex h-8 w-8 items-center justify-center rounded-[0.7rem] bg-blue-600 text-white shadow-sm shadow-blue-600/20">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

// ─── Expiry badge ──────────────────────────────────────────────────────────────

function ExpiryBadge({ days, isExpired }: { days: number | null; isExpired: boolean }) {
  if (isExpired) return <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-semibold">Expirado</span>;
  if (days === null) return <span className="text-xs text-muted-foreground/40">Sem validade</span>;
  if (days <= 30) return <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
  if (days <= 60) return <span className="rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
  return <span className="rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
}

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'completed' | 'ongoing' | 'certificates' | 'skills';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SlManagerUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('completed');

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['sl-manager', 'users', id, 'detail'],
    queryFn: () => slManagerApi.getUserDetail(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-4 text-destructive">
        <p>Não foi possível carregar os detalhes do colega.</p>
        <Link to="/sl-manager" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Voltar à equipa
        </Link>
      </div>
    );
  }

  const { profile, summary } = detail;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'completed', label: 'Concluídas', count: detail.completedTrainings.length },
    { id: 'ongoing', label: 'Em curso', count: detail.ongoingTrainings.length },
    { id: 'certificates', label: 'Certificados', count: detail.certificates.length },
    { id: 'skills', label: 'Skills', count: detail.skills.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 px-2">
        <Link
          to="/sl-manager"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60 backdrop-blur-xl text-muted-foreground hover:bg-foreground hover:text-background transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{profile.name}</h1>
            {!profile.isActive && (
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">Inativo</span>
            )}
            {profile.experienceLevel && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{profile.experienceLevel}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.userFunction ?? profile.email}
            {profile.userFunction && <span className="mx-2 opacity-40">·</span>}
            {profile.userFunction && <span>{profile.email}</span>}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <KpiCard icon={CheckCircle2} label="Concluídas" value={summary.completedTrainings} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Clock} label="Em curso" value={summary.ongoingTrainings} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <KpiCard icon={BookOpen} label="Horas de aprendizagem" value={`${summary.totalLearningHours}h`} color="bg-softinsa-blue/10 text-softinsa-blue" />
        <KpiCard icon={Star} label="Nota média" value={summary.avgRating !== null ? `${summary.avgRating}/5` : '—'} color="bg-amber-100 dark:bg-amber-900/30 text-amber-500" />
        <KpiCard icon={Award} label="Certs. ativos" value={summary.activeCertificates} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <KpiCard icon={AlertTriangle} label="A expirar (90d)" value={summary.certificatesExpiringSoon} color="bg-red-100 dark:bg-red-900/30 text-red-500" />
      </div>

      {/* Tabs + content */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border/40 bg-background/20 px-5 pt-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px',
                tab === t.id
                  ? 'border-foreground text-foreground bg-background/60'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground')}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Completed trainings */}
        {tab === 'completed' && (
          <div className="p-5">
            {detail.completedTrainings.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem formações concluídas.</p>
            ) : (
              <div className="space-y-3">
                {detail.completedTrainings.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border/40 bg-background/40 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.platform && <span>{t.platform}</span>}
                        {t.completedAt && (
                          <span>{format(parseISO(t.completedAt), 'dd MMM yyyy', { locale: pt })}</span>
                        )}
                        {t.durationHours && <span>{t.durationHours}h</span>}
                      </div>
                    </div>
                    {t.rating && (
                      <div className="flex shrink-0 items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span className="text-sm font-bold">{t.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Ongoing trainings */}
        {tab === 'ongoing' && (
          <div className="p-5">
            {detail.ongoingTrainings.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma formação em curso.</p>
            ) : (
              <div className="space-y-3">
                {detail.ongoingTrainings.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/40 bg-background/40 px-5 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{t.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.platform && <span>{t.platform}</span>}
                        {t.startedAt && <span>Iniciada {format(parseISO(t.startedAt), 'dd MMM yyyy', { locale: pt })}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">Em curso</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Certificates */}
        {tab === 'certificates' && (
          <div className="p-5">
            {detail.certificates.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem certificados registados.</p>
            ) : (
              <div className="space-y-3">
                {detail.certificates.map((c) => (
                  <div key={c.id} className={cn('flex items-start justify-between gap-4 rounded-[1.5rem] border bg-background/40 px-5 py-4',
                    c.isExpired ? 'border-red-200 dark:border-red-900/40' : 'border-border/40',
                  )}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={cn('h-4 w-4 shrink-0', c.isExpired ? 'text-red-400' : 'text-emerald-500')} />
                        <p className="font-semibold text-foreground truncate">{c.courseName ?? 'Sem nome'}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {c.provider && <span>{c.provider}</span>}
                        {c.completionDate && <span>Emitido {format(parseISO(c.completionDate), 'dd MMM yyyy', { locale: pt })}</span>}
                        {c.expirationDate && <span>Expira {format(parseISO(c.expirationDate), 'dd MMM yyyy', { locale: pt })}</span>}
                      </div>
                    </div>
                    <ExpiryBadge days={c.daysUntilExpiry} isExpired={c.isExpired} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Skills */}
        {tab === 'skills' && (
          <div className="p-5">
            {detail.skills.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem skills registadas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detail.skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5">
                    <Brain className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{s.skillName}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">{s.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
          <SectionHeader icon={Zap} title="Interesses declarados" count={profile.interests.length} />
          <div className="flex flex-wrap gap-2 p-5">
            {profile.interests.map((interest, i) => (
              <span key={i} className="rounded-full bg-softinsa-blue/10 text-softinsa-blue px-3 py-1.5 text-xs font-semibold">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


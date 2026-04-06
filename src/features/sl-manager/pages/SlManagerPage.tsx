import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, BookOpen, Award, AlertTriangle, ChevronRight,
  CheckCircle2, Clock, TrendingUp, ShieldAlert, UserX, Activity,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { slManagerApi } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { SERVICE_LINE_LABELS } from '../../../types';
import type { ServiceLine } from '../../../types';

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md px-5 py-4 shadow-sm">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Urgency badge ─────────────────────────────────────────────────────────────

function UrgencyBadge({ days, urgency }: { days: number; urgency: 'critical' | 'warning' | 'info' }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', {
      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400': urgency === 'critical',
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400': urgency === 'warning',
      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400': urgency === 'info',
    })}>
      {days}d
    </span>
  );
}

// ─── Experience level badge ────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-muted-foreground/40">—</span>;
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {level}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SlManagerPage() {
  const [alertsOpen, setAlertsOpen] = useState(false);

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['sl-manager', 'overview'],
    queryFn: () => slManagerApi.getOverview().then((r) => r.data),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['sl-manager', 'users'],
    queryFn: () => slManagerApi.getUsers().then((r) => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['sl-manager', 'alerts'],
    queryFn: () => slManagerApi.getAlerts().then((r) => r.data),
  });

  const totalAlerts = alerts
    ? alerts.summary.certExpiryCritical + alerts.summary.certExpiryWarning + alerts.summary.inactiveUsersCount
    : 0;

  const lineLabel = overview?.serviceLine
    ? (SERVICE_LINE_LABELS[overview.serviceLine as ServiceLine] ?? overview.serviceLine)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-foreground text-background shadow-sm">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            A minha Equipa
            {lineLabel && (
              <span className="ml-3 text-base font-medium text-muted-foreground opacity-70">{lineLabel}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gere o progresso e certificações dos membros da tua Service Line.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={Users} label="Membros ativos"
          value={loadingOverview ? '—' : (overview?.activeMembers ?? '—')}
          sub={overview ? `${overview.totalMembers} total` : undefined}
          color="bg-softinsa-blue/10 text-softinsa-blue"
        />
        <KpiCard
          icon={CheckCircle2} label="Formações concluídas"
          value={loadingOverview ? '—' : (overview?.trainingStats.totalCompleted ?? '—')}
          sub={overview ? `+${overview.trainingStats.completedLast30Days} últimos 30d` : undefined}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Activity} label="Em progresso"
          value={loadingOverview ? '—' : (overview?.trainingStats.ongoing ?? '—')}
          sub={overview ? `${overview.trainingStats.avgCompletedPerMember} média/membro` : undefined}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={Award} label="Certs. a expirar (90d)"
          value={loadingOverview ? '—' : (overview?.certificateStats.expiringIn90Days ?? '—')}
          sub={overview ? `${overview.certificateStats.totalActive} ativos` : undefined}
          color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Alerts panel */}
      {totalAlerts > 0 && (
        <div className="rounded-[2rem] border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">
                {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''} que requerem atenção
              </span>
              {alerts && alerts.summary.certExpiryCritical > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {alerts.summary.certExpiryCritical} crítico{alerts.summary.certExpiryCritical !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', alertsOpen && 'rotate-90')} />
          </button>

          {alertsOpen && alerts && (
            <div className="border-t border-amber-200 dark:border-amber-900/30 px-5 pb-5 pt-4 space-y-5">
              {/* Cert expiry */}
              {alerts.certExpiryAlerts.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" /> Certificados a expirar
                  </p>
                  <div className="space-y-1.5">
                    {alerts.certExpiryAlerts.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{a.userName}</span>
                          <span className="mx-2 text-muted-foreground/40">·</span>
                          <span className="text-muted-foreground">{a.courseName}</span>
                        </div>
                        <UrgencyBadge days={a.daysLeft} urgency={a.urgency} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive users */}
              {alerts.inactiveUsers.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <UserX className="h-3.5 w-3.5" /> Sem atividade há 60+ dias
                  </p>
                  <div className="space-y-1.5">
                    {alerts.inactiveUsers.map((u, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{u.userName}</span>
                          {u.userFunction && (
                            <span className="ml-2 text-xs text-muted-foreground">{u.userFunction}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {u.hasNoCompletions ? 'Sem conclusões' : u.daysSinceActivity ? `${u.daysSinceActivity}d sem atividade` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No trainings */}
              {alerts.usersWithNoTrainings.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> Sem formações registadas
                  </p>
                  <div className="space-y-1.5">
                    {alerts.usersWithNoTrainings.map((u, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5 text-sm">
                        <span className="font-medium text-foreground">{u.userName}</span>
                        {u.userFunction && <span className="text-xs text-muted-foreground">{u.userFunction}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4 bg-background/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-foreground text-background shadow-sm">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Membros da Service Line
          </h2>
          {!loadingUsers && (
            <span className="ml-auto text-xs text-muted-foreground">{users.length} membro{users.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Colega</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Função / Nível</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Formações</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Certificados</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Última atividade</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${55 + (i * j) % 35}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    Ainda não existem membros na tua equipa.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={cn('border-b border-border last:border-0 hover:bg-muted/30 transition-colors', !u.isActive && 'opacity-60')}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-softinsa-blue/10 text-softinsa-blue text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-foreground">
                            {u.name}
                            {!u.isActive && (
                              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-500">inativo</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-foreground/80">{u.userFunction ?? '—'}</span>
                        <LevelBadge level={u.experienceLevel} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-foreground">{u.trainings.completed}</span>
                        {u.trainings.ongoing > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500">
                            <Clock className="h-3 w-3" />{u.trainings.ongoing} em curso
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-foreground">{u.certificates.active}</span>
                        {u.certificates.expiringSoon > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500">
                            <AlertTriangle className="h-3 w-3" />{u.certificates.expiringSoon} a expirar
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {u.trainings.lastCompletedAt
                        ? format(parseISO(u.trainings.lastCompletedAt), 'dd MMM yyyy', { locale: pt })
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/sl-manager/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background hover:opacity-80 transition-all"
                      >
                        Detalhes
                        <TrendingUp className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

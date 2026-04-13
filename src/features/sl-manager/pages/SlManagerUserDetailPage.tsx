import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, Award, CheckCircle2, Clock, Star,
  AlertTriangle, Zap, ShieldCheck, Brain,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
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
  const { t } = useTranslation();
  if (isExpired) return <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-semibold">{t('slManager.detail.expiry.expired')}</span>;
  if (days === null) return <span className="text-xs text-muted-foreground/40">{t('slManager.detail.expiry.noExpiry')}</span>;
  if (days <= 30) return <span className="rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
  if (days <= 60) return <span className="rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
  return <span className="rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 text-xs font-semibold">{days}d</span>;
}

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'completed' | 'ongoing' | 'certificates';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SlManagerUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('completed');
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? pt : enUS;

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
        <p>{t('slManager.detail.loadError')}</p>
        <Link to="/sl-manager" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          {t('slManager.detail.backLink')}
        </Link>
      </div>
    );
  }

  const { profile, summary } = detail;

  const expiredCerts = detail.certificates.filter((c) => c.isExpired);
  const expiringCritical = detail.certificates.filter((c) => !c.isExpired && c.daysUntilExpiry !== null && c.daysUntilExpiry <= 30);
  const expiringWarning = detail.certificates.filter((c) => !c.isExpired && c.daysUntilExpiry !== null && c.daysUntilExpiry > 30 && c.daysUntilExpiry <= 90);
  const hasNoTrainings = summary.completedTrainings === 0 && summary.ongoingTrainings === 0;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'completed', label: t('slManager.detail.tabs.completed'), count: detail.completedTrainings.length },
    { id: 'ongoing', label: t('slManager.detail.tabs.ongoing'), count: detail.ongoingTrainings.length },
    { id: 'certificates', label: t('slManager.detail.tabs.certificates'), count: detail.certificates.length },
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
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">{t('slManager.detail.inactive')}</span>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={CheckCircle2} label={t('slManager.detail.kpi.completed')} value={summary.completedTrainings} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Clock} label={t('slManager.detail.kpi.ongoing')} value={summary.ongoingTrainings} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <KpiCard icon={BookOpen} label={t('slManager.detail.kpi.hours')} value={`${summary.totalLearningHours}h`} color="bg-softinsa-blue/10 text-softinsa-blue" />
        <KpiCard icon={Award} label={t('slManager.detail.kpi.activeCerts')} value={summary.activeCertificates} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <KpiCard icon={AlertTriangle} label={t('slManager.detail.kpi.expiring90d')} value={summary.certificatesExpiringSoon} color="bg-red-100 dark:bg-red-900/30 text-red-500" />
      </div>

      {/* Alert banners */}
      {(expiredCerts.length > 0 || expiringCritical.length > 0 || expiringWarning.length > 0 || hasNoTrainings) && (
        <div className="space-y-2">
          {expiredCerts.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {t('slManager.detail.alerts.expiredCerts', { count: expiredCerts.length })}
              </p>
            </div>
          )}
          {expiringCritical.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t('slManager.detail.alerts.expiring30d', { count: expiringCritical.length })}
              </p>
            </div>
          )}
          {expiringWarning.length > 0 && expiringCritical.length === 0 && expiredCerts.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('slManager.detail.alerts.expiring90d', { count: expiringWarning.length })}
              </p>
            </div>
          )}
          {hasNoTrainings && (
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('slManager.detail.alerts.noTrainings')}</p>
            </div>
          )}
        </div>
      )}

      {/* Skills & Interests */}
      {(detail.skills.length > 0 || (profile.interests && profile.interests.length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {detail.skills.length > 0 && (
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
              <SectionHeader icon={Brain} title={t('slManager.detail.sections.skills')} count={detail.skills.length} />
              <div className="flex flex-wrap gap-2 p-5">
                {detail.skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5">
                    <span className="text-sm font-medium text-foreground">{s.skillName}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">{s.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
              <SectionHeader icon={Zap} title={t('slManager.detail.sections.interests')} count={profile.interests.length} />
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
      )}

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
              <p className="py-10 text-center text-sm text-muted-foreground">{t('slManager.detail.completed.empty')}</p>
            ) : (
              <div className="space-y-3">
                {detail.completedTrainings.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border/40 bg-background/40 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.platform && <span>{t.platform}</span>}
                        {t.completedAt && (
                          <span>{format(parseISO(t.completedAt), 'dd MMM yyyy', { locale: dateLocale })}</span>
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
              <p className="py-10 text-center text-sm text-muted-foreground">{t('slManager.detail.ongoing.empty')}</p>
            ) : (
              <div className="space-y-3">
                {detail.ongoingTrainings.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/40 bg-background/40 px-5 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{tr.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {tr.platform && <span>{tr.platform}</span>}
                        {tr.startedAt && <span>{t('slManager.detail.ongoing.startedOn', { date: format(parseISO(tr.startedAt), 'dd MMM yyyy', { locale: dateLocale }) })}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">{t('slManager.detail.ongoing.status')}</span>
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
              <p className="py-10 text-center text-sm text-muted-foreground">{t('slManager.detail.certificates.empty')}</p>
            ) : (
              <div className="space-y-3">
                {detail.certificates.map((c) => (
                  <div key={c.id} className={cn('flex items-start justify-between gap-4 rounded-[1.5rem] border bg-background/40 px-5 py-4',
                    c.isExpired ? 'border-red-200 dark:border-red-900/40' : 'border-border/40',
                  )}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={cn('h-4 w-4 shrink-0', c.isExpired ? 'text-red-400' : 'text-emerald-500')} />
                        <p className="font-semibold text-foreground truncate">{c.courseName ?? t('slManager.detail.certificates.noName')}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {c.provider && <span>{c.provider}</span>}
                        {c.completionDate && <span>{t('slManager.detail.certificates.issuedOn', { date: format(parseISO(c.completionDate), 'dd MMM yyyy', { locale: dateLocale }) })}</span>}
                        {c.expirationDate && <span>{t('slManager.detail.certificates.expiresOn', { date: format(parseISO(c.expirationDate), 'dd MMM yyyy', { locale: dateLocale }) })}</span>}
                      </div>
                    </div>
                    <ExpiryBadge days={c.daysUntilExpiry} isExpired={c.isExpired} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


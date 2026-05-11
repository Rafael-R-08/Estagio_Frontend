import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Award, BookOpen, CheckCircle2, Clock, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { reportsApi } from '@/services/api';
import { cn } from '@/lib/utils';

function StatBox({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-[2rem] border border-border/60 bg-background/40 p-5 text-center print:border print:rounded-xl')}>
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

export default function ProgressReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateLocale = i18n.language === 'pt' ? pt : enUS;

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', 'progress'],
    queryFn: () => reportsApi.getProgressReport().then((r) => r.data),
  });

  // Auto-print when ?print=1
  useEffect(() => {
    if (searchParams.get('print') === '1' && report) {
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [searchParams, report]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!report || !report.user || !report.stats) return null;

  const fmt = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try { return format(parseISO(dateStr), 'dd MMM yyyy', { locale: dateLocale }); }
    catch { return dateStr; }
  };

  return (
    <div className="space-y-8 pb-16 print:space-y-6 print:pb-0">
      {/* ── Screen-only toolbar ── */}
      <div className="flex items-center gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 ml-auto rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 active:scale-95"
        >
          <Printer className="h-4 w-4" />
          {t('report.print')}
        </button>
      </div>

      {/* ── Report Header ── */}
      <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-8 print:rounded-xl print:border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{t('report.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('report.generated', { date: fmt(report.generatedAt) })}</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/20 px-6 py-4 text-right print:text-left">
            <p className="text-lg font-black text-foreground">{report.user.name}</p>
            <p className="text-xs text-muted-foreground">{report.user.email}</p>
            {report.user.serviceLine && (
              <p className="text-xs text-muted-foreground mt-0.5">{report.user.serviceLine}</p>
            )}
            {report.user.memberSince && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">{t('report.memberSince', { date: fmt(report.user.memberSince) })}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label={t('report.stats.completed')} value={report.stats.totalCompleted ?? 0} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-500" />
        <StatBox label={t('report.stats.hours')} value={(report.stats.totalHours ?? 0).toFixed(0)} icon={Clock} color="bg-blue-500/10 text-blue-500" />
        <StatBox label={t('report.stats.avgRating')} value={(report.stats.avgRating ?? 0).toFixed(1)} icon={Star} color="bg-amber-500/10 text-amber-500" />
        <StatBox label={t('report.stats.avgRelevance')} value={(report.stats.avgRelevance ?? 0).toFixed(1)} icon={Star} color="bg-purple-500/10 text-purple-500" />
        <StatBox label={t('report.stats.certificates')} value={report.stats.totalCertificates ?? 0} icon={Award} color="bg-orange-500/10 text-orange-500" />
        <StatBox label={t('report.stats.ongoing')} value={report.ongoingTrainings?.length ?? 0} icon={BookOpen} color="bg-cyan-500/10 text-cyan-500" />
      </div>

      {/* ── Completed trainings ── */}
      {report.completedTrainings.length > 0 && (
        <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md overflow-hidden print:rounded-xl print:border">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t('report.completedTitle')} ({report.completedTrainings.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.title')}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.platform')}</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.hours')}</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.rating')}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.completedAt')}</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.cert')}</th>
                </tr>
              </thead>
              <tbody>
                {report.completedTrainings.map((tr) => (
                  <tr key={tr.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                    <td className="px-5 py-3 font-medium text-foreground max-w-xs truncate">{tr.title}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{tr.platform ?? '—'}</td>
                    <td className="px-5 py-3 text-center text-xs text-foreground">{tr.durationHours ? `${tr.durationHours}h` : '—'}</td>
                    <td className="px-5 py-3 text-center text-xs text-foreground">{tr.rating ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(tr.completedAt)}</td>
                    <td className="px-5 py-3 text-center">
                      {tr.hasCertificate
                        ? <Award className="h-4 w-4 text-amber-500 mx-auto" />
                        : <span className="text-muted-foreground/30 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Ongoing trainings ── */}
      {report.ongoingTrainings.length > 0 && (
        <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md overflow-hidden print:rounded-xl print:border">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t('report.ongoingTitle')} ({report.ongoingTrainings.length})
            </h2>
          </div>
          <div className="divide-y divide-border/20">
            {report.ongoingTrainings.map((tr) => (
              <div key={tr.id} className="flex items-center gap-3 px-6 py-3">
                <BookOpen className="h-4 w-4 shrink-0 text-blue-500/60" />
                <p className="text-sm text-foreground flex-1 truncate">{tr.title}</p>
                {tr.platform && <p className="text-xs text-muted-foreground shrink-0">{tr.platform}</p>}
                {tr.startedAt && <p className="text-xs text-muted-foreground/60 shrink-0">{fmt(tr.startedAt)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certificates ── */}
      {report.certificates.length > 0 && (
        <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md overflow-hidden print:rounded-xl print:border">
          <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
            <Award className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t('report.certsTitle')} ({report.certificates.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.certName')}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.provider')}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.issued')}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.expires')}</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('report.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {report.certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                    <td className="px-5 py-3 font-medium text-foreground max-w-xs truncate">{cert.courseName ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{cert.provider ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(cert.completionDate)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{fmt(cert.expirationDate)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        cert.isExpired
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
                      )}>
                        {cert.isExpired ? t('report.expired') : t('report.active')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

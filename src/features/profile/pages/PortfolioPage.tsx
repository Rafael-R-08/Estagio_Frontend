import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Clock, Download, User as UserIcon, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileApi, certificatesApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { SERVICE_LINE_LABELS } from '@/types';
import type { Certificate } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function certIsActive(cert: Certificate): boolean {
  if (!cert.expirationDate) return true;
  return new Date(cert.expirationDate).getTime() > Date.now();
}

function formatDate(iso?: string, locale?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale ?? 'en-GB', { month: 'short', year: 'numeric' });
}

// ─── PortfolioPage ────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  const { data: profile } = useQuery({
    queryKey: ['portfolio-profile'],
    queryFn: async () => (await profileApi.getMe()).data,
    staleTime: 1000 * 60 * 5,
  });

  const { data: rawCerts = [] } = useQuery({
    queryKey: ['portfolio-certs'],
    queryFn: async () => {
      const res = await certificatesApi.getAll();
      return toList(res.data);
    },
  });

  const { data: completedTrainings = [] } = useQuery({
    queryKey: ['portfolio-trainings-completed'],
    queryFn: async () => {
      const res = await trainingApi.getAll({ status: 'completed' });
      return toList(res.data);
    },
  });

  const user = profile ?? authUser;

  const autoPrint = searchParams.get('print') === '1';
  const dataReady = !!user;
  useEffect(() => {
    if (autoPrint && dataReady) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [autoPrint, dataReady]);

  const certs = useMemo(
    () => [...rawCerts].sort((a, b) => {
      const da = new Date(a.completionDate || a.createdAt || 0).getTime();
      const db = new Date(b.completionDate || b.createdAt || 0).getTime();
      return db - da;
    }),
    [rawCerts],
  );

  const activeCerts = useMemo(() => certs.filter(certIsActive), [certs]);
  const skills = user?.skills ?? [];
  const interests = user?.interests ?? [];

  // Calculate stats from actual completed trainings, not from the endpoint
  const portfolioStats = useMemo(() => ({
    totalHours: completedTrainings.reduce((sum, t) => sum + (t.durationHours || 0), 0),
    completed: completedTrainings.length,
  }), [completedTrainings]);

  function handlePrint() {
    window.print();
  }

  const generatedAt = new Date().toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20 print:bg-white text-foreground print:text-black font-sans">

      {/* ── Top Bar (Screen Only) ── */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/30 transition hover:bg-muted"
            title={t('profile.portfolio.backToProfile')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Curriculum Preview</h2>
            <p className="text-[11px] text-muted-foreground hidden sm:block">Print or export to PDF</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20"
        >
          <Download className="h-4 w-4" />
          {t('profile.portfolio.exportPDF')}
        </button>
      </div>

      {/* ── Document Container ── */}
      <div className="mx-auto max-w-5xl py-12 px-6 print:py-0 print:px-0">
        <div className="relative overflow-hidden bg-background print:bg-white shadow-2xl print:shadow-none ring-1 ring-border/50 print:ring-0 rounded-2xl print:rounded-none">

          {/* Header Strip */}
          <div className="h-4 bg-blue-600 print:bg-blue-600" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />

          <div className="p-10 sm:p-14 print:p-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 print:grid-cols-12">

              {/* ── Left Column: Identity & Skills ── */}
              <div className="md:col-span-4 print:col-span-4 space-y-10">
                {/* Identity */}
                <div className="space-y-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-blue-600/10 text-3xl font-black text-blue-600 ring-1 ring-blue-600/20" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    {user.name.split(' ').slice(0, 2).map((w) => w[0].toUpperCase()).join('')}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none print:text-black text-foreground">{user.name}</h1>
                    <p className="text-sm font-bold text-blue-600 print:text-blue-700 mt-2">
                      {user.userFunction || (user.role === 'ADMIN' ? 'Administrador' : 'Colaborador')}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground print:text-gray-600">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </p>
                    {user.serviceLine && (
                      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground print:text-gray-600">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-primary/10 text-[8px] font-bold text-primary" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>SL</span>
                        {SERVICE_LINE_LABELS[user.serviceLine]}
                      </p>
                    )}
                    {user.experienceLevel && (
                      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground print:text-gray-600 capitalize">
                        <UserIcon className="h-3.5 w-3.5" />
                        {user.experienceLevel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground print:text-gray-500">
                      {t('profile.portfolio.skillsTitle')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span
                          key={s.skillName}
                          className="rounded-md bg-muted/50 print:bg-gray-100 print:border-gray-200 border border-border px-2 py-1 text-[11px] font-bold text-foreground print:text-gray-800 tracking-tight"
                          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                          {s.skillName}
                          {s.level && <span className="ml-1.5 opacity-50 font-medium tracking-normal">({s.level})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground print:text-gray-500">
                      {t('profile.portfolio.interestsTitle')}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="text-[12px] font-medium text-foreground print:text-gray-700 before:content-['•'] before:mr-2 before:text-primary print:before:text-blue-600"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right Column: Metrics & Certs ── */}
              <div className="md:col-span-8 print:col-span-8 pb-10">
                {/* Stats Summary */}
                <div className="mb-10 rounded-2xl bg-muted/20 print:bg-gray-50 p-6 border border-border/50 print:border-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="grid grid-cols-3 gap-6 divide-x divide-border/50 print:divide-gray-300">
                    <div className="text-center px-4">
                      <p className="text-3xl font-black text-foreground print:text-gray-900">{portfolioStats.totalHours}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-500 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" /> Horas
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-3xl font-black text-foreground print:text-gray-900">{portfolioStats.completed}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-500 flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" /> Cursos
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-3xl font-black text-foreground print:text-gray-900">{activeCerts.length}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-500 flex items-center justify-center gap-1">
                        <Award className="h-3 w-3" /> Certificados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certifications List */}
                {activeCerts.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-lg font-black tracking-tight text-foreground print:text-gray-900">
                        {t('profile.portfolio.certsTitle', 'Certificações Principais')}
                      </h3>
                      <div className="h-px flex-1 bg-border print:bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                    </div>

                    <div className="space-y-5">
                      {activeCerts.map((cert) => {
                        const name = cert.courseName || cert.training?.title || 'Certificação';
                        const provider = cert.provider || '—';
                        return (
                          <div key={cert.id} className="group relative pl-4 print:pl-0 border-l-2 border-border print:border-none hover:border-primary print:mb-4 transition-colors">
                            <div className="print:hidden absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4 border-background bg-border group-hover:bg-primary transition-colors" />
                            <div className="flex justify-between items-start gap-4 flex-col sm:flex-row print:flex-row">
                              <div>
                                <p className="text-sm font-bold text-foreground print:text-black leading-tight">{name}</p>
                                <p className="text-xs font-medium text-muted-foreground print:text-gray-600 mt-0.5">{provider}</p>
                              </div>
                              <div className="sm:text-right print:text-right shrink-0">
                                <p className="inline-block text-[10px] font-bold text-emerald-600 print:text-emerald-700 bg-emerald-100 print:bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                  Válido
                                </p>
                                <p className="text-[10px] text-muted-foreground print:text-gray-500 mt-1 whitespace-nowrap">
                                  {formatDate(cert.completionDate || cert.createdAt, locale)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 border border-dashed rounded-xl border-border print:border-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{t('profile.portfolio.certsEmpty')}</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer Strip */}
          <div className="border-t border-border print:border-gray-200 bg-muted/10 print:bg-white px-10 py-4 text-[10px] font-medium text-muted-foreground print:text-gray-500 flex justify-between items-center" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <p>Gerado pelo {t('nav.appName', 'LearningHub Softinsa')}</p>
            <p>Data de Emissão: {generatedAt}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

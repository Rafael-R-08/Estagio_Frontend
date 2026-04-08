import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Clock, Download, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileApi, certificatesApi, trainingApi } from '@/services/api';
import { toList } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SERVICE_LINE_LABELS } from '@/types';
import type { Certificate } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function certIsActive(cert: Certificate): boolean {
  if (!cert.expirationDate) return true;
  return new Date(cert.expirationDate).getTime() > Date.now();
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[1.25rem] bg-blue-600 font-black text-white shadow-xl',
        size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-10 w-10 text-sm',
      )}
    >
      {initials || <UserIcon className="h-6 w-6" />}
    </div>
  );
}

// ─── CertBadge ────────────────────────────────────────────────────────────────

function CertBadge({ cert }: { cert: Certificate }) {
  const active = certIsActive(cert);
  const name = cert.courseName || cert.training?.title || 'Certificação';
  const provider = cert.provider || '—';
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border p-4 transition-colors print:break-inside-avoid',
        active
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-900/10'
          : 'border-border/40 bg-muted/30 opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
            active
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Award className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground leading-tight">{name}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{provider}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Concluído: {formatDate(cert.completionDate || cert.createdAt)}</span>
        {cert.expirationDate && (
          <span className={cn(active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
            {active ? `Válido até ${formatDate(cert.expirationDate)}` : 'Expirado'}
          </span>
        )}
        {!cert.expirationDate && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Permanente</span>
        )}
      </div>
    </div>
  );
}

// ─── PortfolioPage ────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();

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

  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats'],
    queryFn: async () => (await trainingApi.getStats()).data,
  });

  const user = profile ?? authUser;

  // Auto-print when navigated with ?print=1
  const autoPrint = searchParams.get('print') === '1';
  const dataReady = !!user && !!stats;
  useEffect(() => {
    if (autoPrint && dataReady) {
      const t = setTimeout(() => window.print(), 400);
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
  const expiredCerts = useMemo(() => certs.filter((c) => !certIsActive(c)), [certs]);

  const skills = user?.skills ?? [];
  const interests = user?.interests ?? [];

  function handlePrint() {
    window.print();
  }

  const generatedAt = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-6 py-3">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Perfil
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Portfolio content */}
      <div className="mx-auto max-w-3xl px-6 py-10 print:py-6 print:px-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-5 pb-8 border-b border-border/40 print:pb-5">
          {user && <Avatar name={user.name || 'U'} size="lg" />}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{user?.name ?? '—'}</h1>
            <p className="text-sm font-medium text-primary mt-0.5">
              {user?.userFunction || (user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador')}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user?.serviceLine && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {SERVICE_LINE_LABELS[user.serviceLine]}
                </span>
              )}
              {user?.experienceLevel && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.experienceLevel}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 print:block hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
              Gerado em
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">{generatedAt}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mt-1">
              LearningHub Softinsa
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">{stats?.totalHours ?? 0}h</p>
            <p className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground mt-0.5">
              Horas de Formação
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{stats?.completed ?? 0}</p>
            <p className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground mt-0.5">
              Cursos Concluídos
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <Award className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-foreground">{activeCerts.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground mt-0.5">
              Certificações Ativas
            </p>
          </div>
        </div>

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">
              Competências Técnicas
            </h2>
            <h3 className="font-black text-foreground tracking-tight mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div
                  key={s.skillName}
                  className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-1.5"
                >
                  <span className="text-sm font-bold text-foreground">{s.skillName}</span>
                  {s.level && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {s.level}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Interests ── */}
        {interests.length > 0 && (
          <div className="mt-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">
              Áreas de Interesse
            </h2>
            <h3 className="font-black text-foreground tracking-tight mb-4">Interesses</h3>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-md bg-violet-100/80 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Certificates ── */}
        <div className="mt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-1">
            Certificações
          </h2>
          <h3 className="font-black text-foreground tracking-tight mb-4">
            Portfólio de Certificações
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 align-middle">
              {activeCerts.length} ativas
            </span>
          </h3>

          {activeCerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 py-10 text-center">
              <Award className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Ainda sem certificações ativas</p>
            </div>
          )}

          {activeCerts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCerts.map((cert) => (
                <CertBadge key={cert.id} cert={cert} />
              ))}
            </div>
          )}

          {expiredCerts.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Expiradas ({expiredCerts.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expiredCerts.map((cert) => (
                  <CertBadge key={cert.id} cert={cert} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer (print only) ── */}
        <div className="hidden print:block mt-12 border-t border-border/30 pt-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            Portfólio gerado automaticamente pelo <strong>LearningHub Softinsa</strong> em {generatedAt}
          </p>
        </div>

        {/* ── Generated date (screen only) ── */}
        <div className="print:hidden mt-10 text-center">
          <p className="text-[11px] text-muted-foreground/50">
            LearningHub Softinsa • {generatedAt}
          </p>
        </div>
      </div>
    </div>
  );
}

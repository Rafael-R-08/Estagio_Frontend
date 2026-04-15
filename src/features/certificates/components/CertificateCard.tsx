import { Award, Clock, Calendar, ExternalLink, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Certificate } from '@/types';
import { getLinkedInCertificationUrl } from '@/lib/social';

// ─── Status helpers ───────────────────────────────────────────────────────────

type CertStatus = 'active' | 'expiring' | 'expired';

function getCertStatus(cert: Certificate): CertStatus {
  if (!cert.expirationDate) return 'active';
  const diff = new Date(cert.expirationDate).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
}

const STATUS_CONFIG: Record<CertStatus, { className: string }> = {
  active:   { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  expiring: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expired:  { className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const STATUS_LABEL_KEY: Record<CertStatus, string> = {
  active:   'certCard.statusActive',
  expiring: 'certCard.statusExpiring',
  expired:  'certCard.statusExpired',
};

function fmtDate(iso?: string, locale = 'pt-PT') {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function CertificateCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── CertificateCard ─────────────────────────────────────────────────────────

interface Props {
  cert: Certificate;
  onClick: () => void;
}

export function CertificateCard({ cert, onClick }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';
  const status = getCertStatus(cert);
  const { className } = STATUS_CONFIG[status];
  const label = t(STATUS_LABEL_KEY[status]);
  const title = cert.courseName ?? cert.training?.title ?? 'Certificado';

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col gap-4 rounded-[2rem] border border-border/60 bg-background/60 p-6 text-left transition-all hover:bg-background/80 hover:shadow-2xl active:scale-[0.98] backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-base font-black leading-tight text-foreground transition-colors">
              {title}
            </p>
            {cert.provider && (
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{cert.provider}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={cn('shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm', className)}>
            {label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(getLinkedInCertificationUrl(cert), '_blank');
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white transition-all shadow-sm"
            title={t('certificates.shareLinkedIn')}
          >
            <Linkedin className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground/80 pt-2 border-t border-border/20">
        {cert.completionDate && (
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {fmtDate(cert.completionDate, locale)}
          </span>
        )}
        {cert.durationHours != null && (
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {cert.durationHours}h
          </span>
        )}
        {cert.expirationDate && status !== 'active' && (
          <span className={cn(
            'flex items-center gap-2 font-bold',
            status === 'expired' ? 'text-red-500' : 'text-amber-500',
          )}>
            <ExternalLink className="h-4 w-4" />
            {fmtDate(cert.expirationDate, locale)}
          </span>
        )}
      </div>
    </button>
  );
}

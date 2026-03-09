import { Award, Clock, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Certificate } from '@/types';

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

const STATUS_CONFIG: Record<CertStatus, { label: string; className: string }> = {
  active:   { label: 'Ativo',      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  expiring: { label: 'A expirar',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expired:  { label: 'Expirado',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const status = getCertStatus(cert);
  const { label, className } = STATUS_CONFIG[status];
  const title = cert.courseName ?? cert.training?.title ?? 'Certificado';

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            {cert.provider && (
              <p className="mt-0.5 text-xs text-muted-foreground">{cert.provider}</p>
            )}
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', className)}>
          {label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {cert.completionDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fmtDate(cert.completionDate)}
          </span>
        )}
        {cert.durationHours != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {cert.durationHours}h
          </span>
        )}
        {cert.expirationDate && status !== 'active' && (
          <span className={cn(
            'flex items-center gap-1',
            status === 'expired' ? 'text-red-500' : 'text-amber-500',
          )}>
            <ExternalLink className="h-3 w-3" />
            Expira {fmtDate(cert.expirationDate)}
          </span>
        )}
      </div>
    </button>
  );
}

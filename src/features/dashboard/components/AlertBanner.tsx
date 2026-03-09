import { AlertTriangle, X, Award } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Certificate } from '@/types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Single alert row ─────────────────────────────────────────────────────────

function CertAlert({ cert, onDismiss }: { cert: Certificate; onDismiss: () => void }) {
  const navigate = useNavigate();
  const days = cert.expirationDate ? daysUntil(cert.expirationDate) : null;
  const name = cert.courseName ?? cert.training?.title ?? 'Certificado sem nome';

  const urgency =
    days !== null && days <= 7
      ? 'text-destructive border-destructive/30 bg-destructive/5'
      : 'text-amber-700 border-amber-300/50 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/10 dark:border-amber-500/20';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${urgency}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-current/10">
          <Award className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs opacity-80">
            {days !== null
              ? days === 0
                ? 'Expira hoje!'
                : `Expira em ${days} dia${days !== 1 ? 's' : ''}`
              : 'Data de expiração próxima'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/certificates')}
          className="rounded-lg border border-current/30 px-3 py-1 text-xs font-medium transition hover:bg-current/10"
        >
          Ver
        </button>
        <button
          onClick={onDismiss}
          className="rounded-full p-1 transition hover:bg-current/10"
          aria-label="Dispensar alerta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AlertBannerProps {
  certs: Certificate[];
}

export function AlertBanner({ certs }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = certs.filter((c) => !dismissed.has(c.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-semibold">
          {visible.length} certificado{visible.length !== 1 ? 's' : ''} a expirar em breve
        </span>
      </div>
      <div className="space-y-2">
        {visible.map((cert) => (
          <CertAlert
            key={cert.id}
            cert={cert}
            onDismiss={() => setDismissed((prev) => new Set([...prev, cert.id]))}
          />
        ))}
      </div>
    </div>
  );
}

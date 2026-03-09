import { AlertTriangle, XCircle, Award } from 'lucide-react';
import type { Certificate } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

// ─── CertificateAlerts ────────────────────────────────────────────────────────

interface Props {
  certificates: Certificate[];
}

export function CertificateAlerts({ certificates }: Props) {
  const alerts = certificates
    .filter((c) => c.expirationDate)
    .map((c) => ({ cert: c, days: daysUntil(c.expirationDate!) }))
    .filter(({ days }) => days <= 60)
    .sort((a, b) => a.days - b.days);

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Award className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Nenhuma renovação pendente nos próximos 60 dias.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map(({ cert, days }) => {
        const expired = days < 0;
        const urgent = days <= 14;
        return (
          <li
            key={cert.id}
            className={`flex items-start gap-3 rounded-lg border p-3 ${
              expired
                ? 'border-destructive/30 bg-destructive/5'
                : urgent
                ? 'border-amber-300/40 bg-amber-50 dark:bg-amber-900/10'
                : 'border-yellow-300/30 bg-yellow-50/60 dark:bg-yellow-900/10'
            }`}
          >
            {expired ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${urgent ? 'text-amber-500' : 'text-yellow-500'}`} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {cert.courseName ?? 'Certificado'}
              </p>
              {cert.provider && (
                <p className="text-xs text-muted-foreground">{cert.provider}</p>
              )}
            </div>
            <span
              className={`shrink-0 text-xs font-semibold ${
                expired ? 'text-destructive' : urgent ? 'text-amber-600' : 'text-yellow-600'
              }`}
            >
              {expired
                ? `Expirado há ${Math.abs(Math.round(days))}d`
                : `${Math.round(days)}d restantes`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

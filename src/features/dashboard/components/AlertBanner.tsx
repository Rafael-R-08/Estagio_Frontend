import { AlertTriangle, X, Lightbulb, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertData {
  expiringAlerts: { courseName: string; daysRemaining: number; message: string }[];
  staleKnowledgeSuggestions: { courseName: string; monthsSinceCompletion: number; message: string }[];
}

interface AlertBannerProps {
  data: AlertData;
}

// ─── AlertRow ─────────────────────────────────────────────────────────────────

function AlertRow({ 
  title, 
  message, 
  type, 
  onDismiss 
}: { 
  title: string; 
  message: string; 
  type: 'expiring' | 'suggestion'; 
  onDismiss: () => void; 
}) {
  const navigate = useNavigate();

  const isExpiring = type === 'expiring';
  const Icon = isExpiring ? ShieldAlert : Lightbulb;
  
  const urgencyClass = isExpiring
    ? 'text-orange-700 border-orange-300/50 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/10 dark:border-orange-500/20'
    : 'text-blue-700 border-blue-300/50 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/10 dark:border-blue-500/20';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 ${urgencyClass}`}>
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-current/10 mt-1 sm:mt-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-2 sm:line-clamp-1">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          onClick={() => navigate(isExpiring ? '/certificates' : '/search')}
          className="rounded-lg border border-current/30 px-3 py-1.5 text-xs font-medium transition hover:bg-current/10"
        >
          {isExpiring ? 'Ver certificado' : 'Procurar cursos'}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-full p-1.5 transition hover:bg-current/10"
          aria-label="Dispensar alerta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AlertBanner({ data }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleExpiring = data.expiringAlerts.filter(a => !dismissed.has(`exp-${a.courseName}`));
  const visibleSuggestions = data.staleKnowledgeSuggestions.filter(a => !dismissed.has(`sug-${a.courseName}`));

  const totalVisible = visibleExpiring.length + visibleSuggestions.length;

  if (totalVisible === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold">
          Alertas e Renovações ({totalVisible})
        </span>
      </div>
      <div className="space-y-2">
        {visibleExpiring.map((alert, idx) => (
          <AlertRow
            key={`exp-${alert.courseName}-${idx}`}
            title={alert.courseName}
            message={alert.message}
            type="expiring"
            onDismiss={() => setDismissed(prev => new Set([...prev, `exp-${alert.courseName}`]))}
          />
        ))}
        {visibleSuggestions.map((alert, idx) => (
          <AlertRow
            key={`sug-${alert.courseName}-${idx}`}
            title={`Atualizar: ${alert.courseName}`}
            message={alert.message}
            type="suggestion"
            onDismiss={() => setDismissed(prev => new Set([...prev, `sug-${alert.courseName}`]))}
          />
        ))}
      </div>
    </div>
  );
}

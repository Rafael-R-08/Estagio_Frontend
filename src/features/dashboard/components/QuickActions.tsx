import { Search, Sparkles, LayoutGrid, Upload, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ─── Action definition ────────────────────────────────────────────────────────

interface Action {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;  // tailwind bg + text color pair
}

const ACTIONS: Action[] = [
  {
    icon: LayoutGrid,
    label: 'Gerir Plataformas',
    description: 'Ativa ou configura plataformas',
    href: '/platforms',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: Upload,
    label: 'Carregar Certificado',
    description: 'Importa um certificado com IA',
    href: '/certificates',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    icon: Map,
    label: 'Plano de Aprendizagem',
    description: 'Constrói o teu percurso',
    href: '/ai',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Search,
    label: 'Explorar Cursos',
    description: 'Pesquisa em todas as plataformas',
    href: '/search',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Ações Rápidas</h2>
          <p className="text-xs text-muted-foreground">Atalhos para funcionalidades principais</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className={cn(
                'group flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5',
                'text-left transition hover:border-primary/30 hover:shadow-sm active:scale-[0.98]',
              )}
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition', action.color)}>
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{action.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

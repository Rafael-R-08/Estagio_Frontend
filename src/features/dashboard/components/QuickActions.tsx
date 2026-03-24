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
    <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Ações Rápidas</h2>
          <p className="font-bold text-foreground">Atalhos principais</p>
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
                'group flex flex-col gap-3 rounded-[2rem] border border-border/60 bg-background/50 p-4',
                'text-left transition-all duration-300 hover:border-border hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
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

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
    <div className="rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-xl p-8 shadow-xl shadow-foreground/5 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="mb-8 flex items-center gap-4 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-foreground/10">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Ações Rápidas</h2>
          <p className="text-lg font-black tracking-tight text-foreground">Gestão Direta</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className={cn(
                'group/btn flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/40 p-5',
                'text-left transition-all duration-300 hover:border-primary/30 hover:bg-background/60 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]',
              )}
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-3 shadow-sm', action.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-foreground leading-tight tracking-tight">{action.label}</p>
                <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-1 group-hover/btn:text-muted-foreground transition-colors">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

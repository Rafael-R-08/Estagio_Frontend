import { Search, Sparkles, BookOpen, Upload, Map, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Role } from '@/types';

// ─── Action definition ────────────────────────────────────────────────────────

interface Action {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
}

const USER_ACTIONS: Action[] = [
  {
    icon: BookOpen,
    label: 'As minhas Formações',
    description: 'Gere o teu percurso de aprendizagem',
    href: '/my-learning',
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

const SL_MANAGER_ACTIONS: Action[] = [
  {
    icon: Users,
    label: 'A minha Equipa',
    description: 'Progresso e atividade do team',
    href: '/sl-manager',
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

const ADMIN_ACTIONS: Action[] = [
  {
    icon: ShieldCheck,
    label: 'Painel Admin',
    description: 'Utilizadores, analytics e plataformas',
    href: '/admin',
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    description: 'Relatórios e métricas da plataforma',
    href: '/admin',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
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

function getActions(role?: Role): Action[] {
  if (role === 'ADMIN') return ADMIN_ACTIONS;
  if (role === 'SERVICE_LINE_MANAGER') return SL_MANAGER_ACTIONS;
  return USER_ACTIONS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const actions = getActions(user?.role);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Ações Rápidas</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className={cn(
                'group/btn flex flex-col gap-3 rounded-xl border border-border/50 bg-background/50 p-4',
                'text-left transition-all duration-200 hover:border-border hover:bg-background/80 hover:shadow-sm active:scale-[0.98]',
              )}
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover/btn:scale-105', action.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[12px] font-bold text-foreground leading-tight">{action.label}</p>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-1">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

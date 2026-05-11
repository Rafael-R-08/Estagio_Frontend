import { Search, Sparkles, BookOpen, Upload, Map, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Role } from '@/types';

// ─── Action definition ────────────────────────────────────────────────────────

interface ActionMeta {
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  href: string;
  color: string;
}

const USER_ACTIONS: ActionMeta[] = [
  {
    icon: BookOpen,
    labelKey: 'dashboard.quickActions.myLearning',
    descKey: 'dashboard.quickActions.myLearningDesc',
    href: '/my-learning',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: Upload,
    labelKey: 'dashboard.quickActions.uploadCert',
    descKey: 'dashboard.quickActions.uploadCertDesc',
    href: '/certificates',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    icon: Map,
    labelKey: 'dashboard.quickActions.learningPlan',
    descKey: 'dashboard.quickActions.learningPlanDesc',
    href: '/ai',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Search,
    labelKey: 'dashboard.quickActions.exploreCourses',
    descKey: 'dashboard.quickActions.exploreCoursesDesc',
    href: '/search',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
];

const SL_MANAGER_ACTIONS: ActionMeta[] = [
  {
    icon: Users,
    labelKey: 'dashboard.quickActions.myTeam',
    descKey: 'dashboard.quickActions.myTeamDesc',
    href: '/sl-manager',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: Upload,
    labelKey: 'dashboard.quickActions.uploadCert',
    descKey: 'dashboard.quickActions.uploadCertDesc',
    href: '/certificates',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    icon: Map,
    labelKey: 'dashboard.quickActions.learningPlan',
    descKey: 'dashboard.quickActions.learningPlanDesc',
    href: '/ai',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Search,
    labelKey: 'dashboard.quickActions.exploreCourses',
    descKey: 'dashboard.quickActions.exploreCoursesDesc',
    href: '/search',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
];

const ADMIN_ACTIONS: ActionMeta[] = [
  {
    icon: ShieldCheck,
    labelKey: 'dashboard.quickActions.adminPanel',
    descKey: 'dashboard.quickActions.adminPanelDesc',
    href: '/admin',
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    icon: BarChart3,
    labelKey: 'dashboard.quickActions.analytics',
    descKey: 'dashboard.quickActions.analyticsDesc',
    href: '/admin',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: Map,
    labelKey: 'dashboard.quickActions.learningPlan',
    descKey: 'dashboard.quickActions.learningPlanDesc',
    href: '/ai',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    icon: Search,
    labelKey: 'dashboard.quickActions.exploreCourses',
    descKey: 'dashboard.quickActions.exploreCoursesDesc',
    href: '/search',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
];

function getMeta(role?: Role): ActionMeta[] {
  if (role === 'ADMIN') return ADMIN_ACTIONS;
  if (role === 'SERVICE_LINE_MANAGER') return SL_MANAGER_ACTIONS;
  return USER_ACTIONS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const actions = getMeta(user?.role).map((m) => ({
    ...m,
    label: t(m.labelKey),
    description: t(m.descKey),
  }));

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{t('dashboard.quickActions.title')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.labelKey}
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

import { Users, Globe, BarChart2, ShieldCheck, ClipboardList } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';
import { UsersTab } from '../components/UsersTab';
import { PlatformsTab } from '../components/PlatformsTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { AuditTab } from '../components/AuditTab';

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'users', labelKey: 'admin.tabs.users', icon: Users, labelFallback: 'Utilizadores' },
  { id: 'platforms', labelKey: 'admin.tabs.platforms', icon: Globe, labelFallback: 'Plataformas' },
  { id: 'analytics', labelKey: 'admin.tabs.analytics', icon: BarChart2, labelFallback: 'Analítica' },
  { id: 'audit', labelKey: 'admin.tabs.audit', icon: ClipboardList, labelFallback: 'Auditoria' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isValidTab(t: string | null): t is TabId {
  return t === 'users' || t === 'platforms' || t === 'analytics' || t === 'audit';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const rawTab = searchParams.get('tab');
  const active: TabId = isValidTab(rawTab) ? rawTab : 'users';

  const current = TABS.find((t) => t.id === active)!;
  const Icon = current.icon;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-blue-600 text-white shadow-sm shadow-blue-600/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t('admin.title')}</h1>
            <span className="text-muted-foreground opacity-50">/</span>
            <span className="flex items-center gap-1.5 text-xl font-bold text-foreground opacity-90">
              <Icon className="h-5 w-5" />
              {t(current.labelKey, current.labelFallback)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-px mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const TabIcon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={`/admin?tab=${tab.id}`}
              className={cn(
                "group relative flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0",
                isActive
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <TabIcon className="h-4 w-4" />
              <span>{t(tab.labelKey, tab.labelFallback)}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      {active === 'users' && <UsersTab />}
      {active === 'platforms' && <PlatformsTab />}
      {active === 'analytics' && <AnalyticsTab />}
      {active === 'audit' && <AuditTab />}
    </div>
  );
}

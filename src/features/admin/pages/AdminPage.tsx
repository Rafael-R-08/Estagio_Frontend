import { Users, Globe, BarChart2, ShieldCheck, BookOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UsersTab } from '../components/UsersTab';
import { PlatformsTab } from '../components/PlatformsTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { SoftinsaLearningTab } from '../components/SoftinsaLearningTab';

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'users', labelKey: 'admin.tabs.users', icon: Users, labelFallback: 'Utilizadores' },
  { id: 'platforms', labelKey: 'admin.tabs.platforms', icon: Globe, labelFallback: 'Plataformas' },
  { id: 'softinsa', labelKey: 'admin.tabs.softinsa', icon: BookOpen, labelFallback: 'Softinsa Everyday Learning' },
  { id: 'analytics', labelKey: 'admin.tabs.analytics', icon: BarChart2, labelFallback: 'Analítica' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isValidTab(t: string | null): t is TabId {
  return t === 'users' || t === 'platforms' || t === 'softinsa' || t === 'analytics';
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
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-foreground text-background shadow-sm">
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

      {/* Tab content */}
      {active === 'users' && <UsersTab />}
      {active === 'platforms' && <PlatformsTab />}
      {active === 'softinsa' && <SoftinsaLearningTab />}
      {active === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

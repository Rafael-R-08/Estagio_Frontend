import { Users, Globe, BarChart2, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UsersTab } from '../components/UsersTab';
import { PlatformsTab } from '../components/PlatformsTab';
import { AnalyticsTab } from '../components/AnalyticsTab';

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'users', labelKey: 'admin.tabs.users', icon: Users },
  { id: 'platforms', labelKey: 'admin.tabs.platforms', icon: Globe },
  { id: 'analytics', labelKey: 'admin.tabs.analytics', icon: BarChart2 },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isValidTab(t: string | null): t is TabId {
  return t === 'users' || t === 'platforms' || t === 'analytics';
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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-softinsa-blue text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
            <span className="text-muted-foreground">/</span>
            <span className="flex items-center gap-1.5 text-lg font-semibold text-softinsa-blue">
              <Icon className="h-4 w-4" />
              {t(current.labelKey)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      {/* Tab content */}
      {active === 'users' && <UsersTab />}
      {active === 'platforms' && <PlatformsTab />}
      {active === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

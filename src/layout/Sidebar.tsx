import { Link, useLocation } from 'react-router-dom';
import logoIcon from '../assets/logo2.icon.png';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Award,
  Sparkles,
  User,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Globe,
  BarChart2,
  ClipboardList,
  Library,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth';
import { cn } from '../lib/utils';

// ─── Nav items ────────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.search', href: '/search', icon: Search },
  { labelKey: 'nav.ai', href: '/ai', icon: Sparkles },
  { labelKey: 'nav.certificates', href: '/certificates', icon: Award },
  { labelKey: 'nav.myLearning', href: '/my-learning', icon: BookOpen },
  { labelKey: 'nav.collections', href: '/collections', icon: Library },
] as const;

const ACCOUNT_NAV = [
  { labelKey: 'nav.profile', href: '/profile', icon: User },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
] as const;

const ADMIN_NAV = [
  { labelKey: 'nav.users', href: '/admin?tab=users', icon: Users },
  { labelKey: 'nav.platforms', href: '/admin?tab=platforms', icon: Globe },
  { labelKey: 'nav.analytics', href: '/admin?tab=analytics', icon: BarChart2 },
  { labelKey: 'nav.audit', href: '/admin?tab=audit', icon: ClipboardList },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const currentAdminTab = new URLSearchParams(search).get('tab') ?? 'users';

  return (
    <aside
      className={cn(
        'flex flex-col bg-background/40 backdrop-blur-2xl border-r border-border/60 text-foreground transition-all duration-300 ease-in-out',
        'h-screen sticky top-0 shrink-0 z-30',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo Area */}
      <div className={cn('flex h-16 items-center border-b border-border/60', collapsed ? 'justify-center px-0' : 'gap-2.5 px-4')}>
        <img src={logoIcon} alt="Softinsa Learning Hub" className="h-8 w-8 shrink-0 object-contain" />
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-foreground/90 truncate">
            Softinsa Learning Hub
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Main Menu */}
        <div className="px-3 mb-1">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              {t('nav.mainMenu')}
            </p>
          )}
          <ul className="space-y-1">
            {MAIN_NAV.map(({ labelKey, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    to={href}
                    id={`tour-${labelKey.split('.').pop()?.toLowerCase()}`}
                    title={collapsed ? t(labelKey) : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{t(labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Backoffice Admin — só para ADMIN */}
        {user?.role === 'ADMIN' && (
          <div className="px-3 mt-4">
            <div
              className={cn(
                'mb-2 flex items-center gap-2',
                collapsed ? 'justify-center px-0' : 'px-2',
              )}
            >
              {!collapsed && (
                <>
                  <Shield className="h-3 w-3 text-muted-foreground/60" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {t('nav.adminBackoffice')}
                  </p>
                </>
              )}
              {collapsed && (
                <div className="h-px w-8 bg-border/40" />
              )}
            </div>
            <ul className="space-y-1">
              {ADMIN_NAV.map(({ labelKey, href, icon: Icon }) => {
                const tabParam = href.split('tab=')[1];
                const isThisActive = pathname.startsWith('/admin') && currentAdminTab === tabParam;
                return (
                  <li key={href}>
                    <Link
                      to={href}
                      title={collapsed ? t(labelKey) : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors',
                        isThisActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{t(labelKey)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* SL Manager — My Team */}
        {user?.role === 'SERVICE_LINE_MANAGER' && (
          <div className="px-3 mt-4">
            <div
              className={cn(
                'mb-2 flex items-center gap-2',
                collapsed ? 'justify-center px-0' : 'px-2',
              )}
            >
              {!collapsed && (
                <>
                  <Users className="h-3 w-3 text-muted-foreground/60" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {t('nav.myTeam')}
                  </p>
                </>
              )}
              {collapsed && (
                <div className="h-px w-8 bg-border/40" />
              )}
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/sl-manager"
                  title={collapsed ? t('nav.myTeam') : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors',
                    pathname.startsWith('/sl-manager')
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{t('nav.myTeam', 'My Team')}</span>}
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Account */}
        <div className="px-3 mt-4">
          {!collapsed && (
            <p id="tour-account-section" className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {t('nav.account')}
            </p>
          )}
          <ul className="space-y-1">
            {ACCOUNT_NAV.map(({ labelKey, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    to={href}
                    id={`tour-${labelKey.split('.').pop()?.toLowerCase()}`}
                    title={collapsed ? t(labelKey) : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{t(labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Toggle collapse */}
      <button
        onClick={onToggle}
        className="mx-2 mb-2 flex items-center justify-center rounded-full py-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* User + Logout */}
      <div className="border-t border-border/60 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl px-2 py-1.5',
            collapsed && 'justify-center',
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{user?.name}</p>
              <p className="truncate text-[10px] font-bold tracking-[0.05em] text-muted-foreground uppercase opacity-80">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title={t('nav.logout')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="mt-1 flex w-full items-center justify-center rounded-2xl py-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

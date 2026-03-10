import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth';
import { cn } from '../lib/utils';
import logo from '../assets/Logo1.png';

// ─── Nav items ────────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.search', href: '/search', icon: Search },
  { labelKey: 'nav.ai', href: '/ai', icon: Sparkles },
  { labelKey: 'nav.certificates', href: '/certificates', icon: Award },
  { labelKey: 'nav.myLearning', href: '/my-learning', icon: BookOpen },
] as const;

const ACCOUNT_NAV = [
  { labelKey: 'nav.profile', href: '/profile', icon: User },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
] as const;

const ADMIN_NAV = [
  { labelKey: 'nav.users', href: '/admin?tab=users', icon: Users },
  { labelKey: 'nav.platforms', href: '/admin?tab=platforms', icon: Globe },
  { labelKey: 'nav.analytics', href: '/admin?tab=analytics', icon: BarChart2 },
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
        'flex flex-col bg-softinsa-blue text-white transition-all duration-300 ease-in-out',
        'h-screen sticky top-0 shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <img src={logo} alt="SL" className="h-full w-auto object-contain" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold leading-tight">
            Learning Hub
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Main Menu */}
        <div className="px-3 mb-1">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
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
                    title={collapsed ? t(labelKey) : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
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
                  <Shield className="h-3 w-3 text-white/50" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {t('nav.adminBackoffice')}
                  </p>
                </>
              )}
              {collapsed && (
                <div className="h-px w-8 bg-white/20" />
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
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isThisActive
                          ? 'bg-white/15 text-white ring-1 ring-inset ring-white/20'
                          : 'text-white/60 hover:bg-white/10 hover:text-white',
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

        {/* Account */}
        <div className="px-3 mt-4">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
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
                    title={collapsed ? t(labelKey) : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
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
        className="mx-2 mb-2 flex items-center justify-center rounded-lg py-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-2 py-1.5',
            collapsed && 'justify-center',
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-white/50 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title={t('nav.logout')}
              className="text-white/50 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

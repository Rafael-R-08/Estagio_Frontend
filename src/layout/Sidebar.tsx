import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Award,
  Sparkles,
  Grid2X2,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { cn } from '../lib/utils';
import logo from '../assets/Logo1.png';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pesquisa', href: '/search', icon: Search },
  { label: 'Painel de Progresso', href: '/my-learning', icon: BookOpen },
  { label: 'Certificados', href: '/certificates', icon: Award },
  { label: 'Assistente IA', href: '/ai', icon: Sparkles },
  { label: 'Plataformas', href: '/platforms', icon: Grid2X2 },
  { label: 'Perfil', href: '/profile', icon: User },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

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
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  to={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}

          {/* Admin só para role ADMIN */}
          {user?.role === 'ADMIN' && (
            <li>
              <Link
                to="/admin"
                title={collapsed ? 'Admin' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2',
                )}
              >
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">Admin</span>}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Toggle collapse */}
      <button
        onClick={onToggle}
        className="mx-2 mb-2 flex items-center justify-center rounded-lg py-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
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
              title="Terminar sessão"
              className="text-white/50 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            title="Terminar sessão"
            className="mt-1 flex w-full items-center justify-center rounded-lg py-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

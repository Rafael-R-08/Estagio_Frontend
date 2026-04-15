import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Award,
  Sparkles,
  Library,
  User,
  Settings,
  Shield,
  Users,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

const MAIN_NAV = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.search', href: '/search', icon: Search },
  { labelKey: 'nav.ai', href: '/ai', icon: Sparkles },
  { labelKey: 'nav.certificates', href: '/certificates', icon: Award },
  { labelKey: 'nav.myLearning', href: '/my-learning', icon: BookOpen },
  { labelKey: 'nav.collections', href: '/collections', icon: Library },
] as const;

function DockIcon({
  item,
  isActive,
  mouseX,
}: {
  item: typeof MAIN_NAV[number];
  isActive: boolean;
  mouseX: any;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={item.href} id={`tour-${item.labelKey.split('.').pop()?.toLowerCase()}`}>
          <motion.div
            ref={ref}
            style={{ width, height: width }}
            className={cn(
              "flex items-center justify-center rounded-2xl relative",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                : "bg-muted/40 text-muted-foreground hover:bg-muted/80 backdrop-blur-md border border-border/50"
            )}
          >
            <Icon className="w-1/2 h-1/2" />
            
            {/* Active Dot indicator below */}
            {isActive && (
              <motion.div 
                layoutId="active-dot"
                className="absolute -bottom-2 w-1.5 h-1.5 bg-blue-600 rounded-full"
              />
            )}
          </motion.div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={12}>
        <span className="font-semibold">{t(item.labelKey)}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function FloatingDock() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const mouseX = useMotionValue(Infinity);
  
  // Profile menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:block">
        
        {/* Dock Container */}
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="flex h-[72px] items-end gap-3 rounded-3xl bg-background/30 border border-border/50 px-4 pb-3 pt-4 backdrop-blur-xl shadow-2xl"
        >
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <DockIcon
                key={item.href}
                item={item}
                isActive={isActive}
                mouseX={mouseX}
              />
            );
          })}

          <div className="w-px h-10 bg-border/80 align-bottom self-center mx-1 rounded-full relative bottom-[-6px]" />

          {/* Profile Menu Trigger */}
          <div className="flex items-end h-full relative" ref={menuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="tour-profile"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={cn(
                    "flex items-center justify-center rounded-2xl bg-muted/40 text-foreground hover:bg-muted/80 backdrop-blur-md border border-border/50 transition-all duration-200 h-12 w-12",
                    menuOpen && "ring-2 ring-blue-500 bg-muted/80"
                  )}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 font-bold overflow-hidden relative group">
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12}>
                <span className="font-semibold">{t('nav.account', 'Conta')}</span>
              </TooltipContent>
            </Tooltip>

            {/* Popover Menu */}
            {menuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-16 right-0 mb-4 w-56 rounded-2xl bg-background/80 backdrop-blur-2xl border border-border/60 shadow-2xl p-2 origin-bottom-right"
              >
                <div className="px-3 py-2 mb-2 border-b border-border/50">
                  <p className="font-bold text-sm text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold opacity-80">{user?.role}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <Link 
                    to="/profile" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>{t('nav.profile', 'Perfil')}</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('nav.settings', 'Configurações')}</span>
                  </Link>

                  {(user?.role === 'ADMIN' || user?.role === 'SERVICE_LINE_MANAGER') && (
                     <div className="h-px bg-border/50 my-1" />
                  )}

                  {user?.role === 'ADMIN' && (
                    <Link 
                      to="/admin?tab=users" 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">{t('nav.adminBackoffice', 'Admin Backoffice')}</span>
                    </Link>
                  )}

                   {user?.role === 'SERVICE_LINE_MANAGER' && (
                    <Link 
                      to="/sl-manager" 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{t('nav.myTeam', 'A Minha Equipa')}</span>
                    </Link>
                  )}

                  <div className="h-px bg-border/50 my-1" />

                  <button 
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">{t('nav.logout', 'Sair')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}

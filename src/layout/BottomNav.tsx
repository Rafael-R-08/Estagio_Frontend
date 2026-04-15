import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

const navItems = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: Home,
  },
  {
    name: 'Search',
    to: '/search',
    icon: Search,
  },
  {
    name: 'MyLearning',
    to: '/my-learning',
    icon: BookOpen,
  },
  {
    name: 'Profile',
    to: '/profile',
    icon: User,
  },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40 flex h-16 items-center justify-around rounded-3xl border border-border/50 bg-background/40 px-2 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.5)' }}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center space-y-1 w-full h-full text-muted-foreground transition-colors hover:text-primary',
              isActive && 'text-primary font-medium',
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
            <span className="text-[10px] leading-none">{t(item.name)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

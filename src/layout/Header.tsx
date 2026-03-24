import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const AI_TIPS: string[] = t('header.tips', { returnObjects: true }) as string[];
  const tipsCount = AI_TIPS.length;

  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % tipsCount);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(id);
  }, [tipsCount]);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/40 backdrop-blur-2xl px-6 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* IA status + dica rotativa */}
      <div className="hidden sm:flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{t('header.aiActive')}</span>
        </div>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span
          className="text-xs text-muted-foreground truncate max-w-xs transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {AI_TIPS[tipIndex]}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notificações */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {/* Badge exemplo */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </button>
      </div>
    </header>
  );
}

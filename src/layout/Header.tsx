import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Sparkles, Check, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../features/auth/hooks/useAuth';
import { notificationsApi } from '../services/api';
import type { AppNotification } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 10 }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.items ?? [];

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
        <div ref={notifRef} className="relative">
          <button
            id="tour-notifications"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <p className="text-sm font-bold text-foreground">Notificações</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground/50">
                    Sem notificações
                  </p>
                ) : (
                  notifications.map((n: AppNotification) => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); }}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors',
                        !n.isRead && 'bg-primary/5',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                        {n.isRead && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/40 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          id="tour-profile-header"
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </button>
      </div>
    </header>
  );
}

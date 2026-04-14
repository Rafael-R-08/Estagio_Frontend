import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, BookOpen, Award, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { slManagerApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { SlManagerActivityItem } from '@/types';

const ACTION_ICON = {
  completed: CheckCircle2,
  enrolled: BookOpen,
  certificate: Award,
} as const;

const ACTION_COLOR = {
  completed: 'text-emerald-500 bg-emerald-500/10',
  enrolled: 'text-blue-500 bg-blue-500/10',
  certificate: 'text-amber-500 bg-amber-500/10',
} as const;

function ActivityRow({ item, i18nLang }: { item: SlManagerActivityItem; i18nLang: string }) {
  const { t } = useTranslation();
  const Icon = ACTION_ICON[item.action] ?? BookOpen;
  const colorCls = ACTION_COLOR[item.action] ?? ACTION_COLOR.enrolled;

  const locale = i18nLang === 'pt' ? ptBR : undefined;
  const timeAgo = formatDistanceToNow(new Date(item.date), { addSuffix: true, locale });

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', colorCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{item.userName}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {t(`slManager.activity.action.${item.action}`)}{' '}
          <span className="font-semibold text-foreground">{item.courseTitle}</span>
        </p>
      </div>
      <time className="shrink-0 text-[10px] text-muted-foreground/60 mt-0.5">{timeAgo}</time>
    </div>
  );
}

export default function TeamActivityFeed({ limit = 30, pageSize = 8 }: { limit?: number; pageSize?: number }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['sl-manager', 'activity', limit],
    queryFn: () => slManagerApi.getActivity(limit).then((r) => r.data),
    staleTime: 60_000,
  });

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black text-foreground tracking-tight">{t('slManager.activity.title')}</p>
          <p className="text-[11px] text-muted-foreground">{t('slManager.activity.subtitle', { count: items.length })}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="animate-pulse h-14 rounded-2xl bg-muted/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('slManager.activity.empty')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((item, idx) => (
              <ActivityRow key={`${item.userId}-${item.date}-${idx}`} item={item} i18nLang={i18n.language} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t('common.back')}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('common.next')}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

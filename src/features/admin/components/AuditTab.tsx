import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { AuditLog } from '@/services/api';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_LOGS: AuditLog[] = [
  { id: '1', actorId: 'a1', actorName: 'Ana Ferreira', action: 'ROLE_UPDATED', targetId: 'u2', targetName: 'Bruno Costa', details: 'USER → ADMIN', createdAt: '2026-04-08T10:22:00Z' },
  { id: '2', actorId: 'a1', actorName: 'Ana Ferreira', action: 'USER_DEACTIVATED', targetId: 'u3', targetName: 'Carla Mendes', details: undefined, createdAt: '2026-04-07T15:10:00Z' },
  { id: '4', actorId: 'a1', actorName: 'Ana Ferreira', action: 'ROLE_UPDATED', targetId: 'u4', targetName: 'David Sousa', details: 'USER → SERVICE_LINE_MANAGER', createdAt: '2026-04-05T11:30:00Z' },
  { id: '5', actorId: 'a1', actorName: 'Ana Ferreira', action: 'PLATFORM_UPDATED', targetId: 'p1', targetName: 'Udemy', details: 'isActive: true → false', createdAt: '2026-04-04T14:00:00Z' },
  { id: '6', actorId: 'a1', actorName: 'Ana Ferreira', action: 'USER_ACTIVATED', targetId: 'u3', targetName: 'Carla Mendes', details: undefined, createdAt: '2026-04-03T08:55:00Z' },
  { id: '8', actorId: 'a1', actorName: 'Ana Ferreira', action: 'ROLE_UPDATED', targetId: 'u5', targetName: 'Eva Lopes', details: 'ADMIN → USER', createdAt: '2026-04-01T13:10:00Z' },
];

const PAGE_SIZE = 20;

// ─── Action badge ─────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { color: string }> = {
  ROLE_UPDATED:        { color: 'bg-softinsa-blue/10 text-softinsa-blue dark:bg-softinsa-blue/20' },
  USER_DEACTIVATED:    { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  USER_ACTIVATED:      { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PLATFORM_CREATED:    { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PLATFORM_UPDATED:    { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PLATFORM_DELETED:    { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

function ActionBadge({ action }: { action: string }) {
  const { t } = useTranslation();
  const meta = ACTION_META[action];
  const label = t(`admin.audit.actions.${action}`, { defaultValue: action });
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', meta ? meta.color : 'bg-muted text-muted-foreground')}>
      {label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AuditSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${55 + Math.random() * 35}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AuditTab() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? pt : enUS;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => {
      try {
        const r = await adminApi.getAuditLogs({ limit: 200 });
        return r.data.items;
      } catch {
        return MOCK_LOGS;
      }
    },
  });

  const logs: AuditLog[] = data ?? MOCK_LOGS;

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.actorName ?? '').toLowerCase().includes(q) ||
      (l.targetName ?? '').toLowerCase().includes(q) ||
      (t(`admin.audit.actions.${l.action}`, { defaultValue: l.action ?? '' })).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t('admin.audit.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
          />
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          {t('admin.audit.refresh')}
        </button>
      </div>

      {/* Notice badge when using mock data */}
      {!isLoading && logs === MOCK_LOGS && (
        <div className="flex items-center gap-2 rounded-[1.5rem] border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <ClipboardList className="h-4 w-4 shrink-0" />
          {t('admin.audit.demoWarning')}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.audit.columns.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.audit.columns.action')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.audit.columns.actor')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.audit.columns.target')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.audit.columns.details')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AuditSkeleton />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t('admin.audit.noResults')}
                  </td>
                </tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(log.createdAt), "dd MMM yyyy, HH:mm", { locale: dateLocale })}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-softinsa-blue/10 text-softinsa-blue text-xs font-bold">
                          {(log.actorName ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{log.actorName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.targetName ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {log.details ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{log.details}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              {t(filtered.length !== 1 ? 'admin.audit.paginationPlural' : 'admin.audit.pagination', { from: ((safePage - 1) * PAGE_SIZE) + 1, to: Math.min(safePage * PAGE_SIZE, filtered.length), total: filtered.length })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        'h-7 min-w-[1.75rem] rounded-lg border px-1.5 text-xs font-medium transition-colors',
                        safePage === p
                          ? 'border-softinsa-blue bg-softinsa-blue text-white'
                          : 'border-border text-foreground hover:bg-muted',
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

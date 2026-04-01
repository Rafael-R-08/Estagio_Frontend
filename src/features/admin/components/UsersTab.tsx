import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, UserX, UserCheck, Search, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/services/api';
import type { AdminUser, Role } from '@/types';
import { cn } from '@/lib/utils';

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-xl">
      <div className="w-full max-w-sm rounded-[2rem] border border-border/60 bg-background/60 p-6 shadow-2xl backdrop-blur-2xl">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {t('admin.users.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-softinsa-blue hover:bg-softinsa-blue/90',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        role === 'ADMIN'
          ? 'bg-softinsa-blue/10 text-softinsa-blue dark:bg-softinsa-blue/20'
          : role === 'SERVICE_LINE_MANAGER'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
      )}
    >
      {role === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
      {role === 'SERVICE_LINE_MANAGER' && <Award className="h-3 w-3" />}
      {role}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        active
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-red-400')} />
      {active ? t('admin.users.active') : t('admin.users.inactive')}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Mock fallback (sem backend admin) ───────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Ana Ferreira', email: 'ana@softinsa.pt', role: 'ADMIN', isActive: true, createdAt: '2024-01-15T10:00:00Z', serviceLine: null, onboardingDone: true, managedLineId: null },
  { id: '2', name: 'Bruno Costa', email: 'bruno@softinsa.pt', role: 'USER', isActive: true, createdAt: '2024-02-20T09:00:00Z', serviceLine: null, onboardingDone: true, managedLineId: null },
  { id: '3', name: 'Carla Mendes', email: 'carla@softinsa.pt', role: 'USER', isActive: false, createdAt: '2024-03-05T08:30:00Z', serviceLine: null, onboardingDone: true, managedLineId: null },
  { id: '4', name: 'David Sousa', email: 'david@softinsa.pt', role: 'USER', isActive: true, createdAt: '2024-04-10T11:00:00Z', serviceLine: null, onboardingDone: true, managedLineId: null },
  { id: '5', name: 'Eva Lopes', email: 'eva@softinsa.pt', role: 'USER', isActive: true, createdAt: '2024-05-22T14:00:00Z', serviceLine: null, onboardingDone: true, managedLineId: null },
];

// ─── Sort helper ──────────────────────────────────────────────────────────────

type SortKey = 'name' | 'email' | 'role' | 'isActive';

function sortUsers(users: AdminUser[], key: SortKey, asc: boolean) {
  return [...users].sort((a, b) => {
    const va = String(a[key] ?? '');
    const vb = String(b[key] ?? '');
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function UsersTab() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [confirm, setConfirm] = useState<null | { type: 'promote' | 'demote' | 'promote_slm' | 'deactivate' | 'activate'; user: AdminUser }>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        const r = await adminApi.getUsers();
        return r.data;
      } catch {
        return MOCK_USERS;
      }
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      adminApi.updateUserRole(id, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Role atualizado.'); },
    onError: () => toast.error('Erro ao atualizar role.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      activate ? adminApi.activateUser(id) : adminApi.deactivateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Estado atualizado.'); },
    onError: () => toast.error('Erro ao atualizar estado.'),
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const filtered = sortUsers(
    users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    ),
    sortKey,
    sortAsc,
  );

  function execConfirm() {
    if (!confirm) return;
    const { type, user } = confirm;
    if (type === 'promote') roleMutation.mutate({ id: user.id, role: 'ADMIN' });
    if (type === 'promote_slm') roleMutation.mutate({ id: user.id, role: 'SERVICE_LINE_MANAGER' });
    if (type === 'demote') roleMutation.mutate({ id: user.id, role: 'USER' });
    if (type === 'deactivate') statusMutation.mutate({ id: user.id, activate: false });
    if (type === 'activate') statusMutation.mutate({ id: user.id, activate: true });
    setConfirm(null);
  }

  const confirmMeta = {
    promote: { title: t('admin.users.confirmPromote', { name: confirm?.user.name }), description: `${confirm?.user.name} terá acesso total ao backoffice.`, label: t('admin.users.promote'), danger: false },
    promote_slm: { title: `Tornar ${confirm?.user.name} Chefe de Linha?`, description: `${confirm?.user.name} terá acesso à gestão da sua equipa.`, label: 'Tornar Chefe', danger: false },
    demote: { title: t('admin.users.confirmDemote', { name: confirm?.user.name }), description: `${confirm?.user.name} passará a utilizador normal.`, label: t('admin.users.demote'), danger: true },
    deactivate: { title: t('admin.users.confirmDeactivate', { name: confirm?.user.name }), description: `${confirm?.user.name} não conseguirá iniciar sessão.`, label: t('admin.users.deactivate'), danger: true },
    activate: { title: t('admin.users.confirmActivate', { name: confirm?.user.name }), description: `${confirm?.user.name} voltará a ter acesso à plataforma.`, label: t('admin.users.activate'), danger: false },
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={t('admin.users.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {(
                  [
                    { key: 'name', labelKey: 'admin.users.columns.name' },
                    { key: 'email', labelKey: 'admin.users.columns.email' },
                    { key: 'role', labelKey: 'admin.users.columns.role' },
                    { key: 'isActive', labelKey: 'admin.users.columns.status' },
                  ] as { key: SortKey; labelKey: string }[]
                ).map(({ key, labelKey }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center gap-1">
                      {t(labelKey)}
                      <SortIcon k={key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('admin.users.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t('admin.users.noResults')}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-softinsa-blue/10 text-softinsa-blue text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.role === 'USER' && (
                          <>
                            <button
                              onClick={() => setConfirm({ type: 'promote', user })}
                              title={t('admin.users.promote')}
                              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-softinsa-blue" />
                              Admin
                            </button>
                            <button
                              onClick={() => setConfirm({ type: 'promote_slm', user })}
                              title="Tornar Chefe de Linha"
                              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <Award className="h-3.5 w-3.5 text-amber-500" />
                              Chefe
                            </button>
                          </>
                        )}
                        {user.role !== 'USER' && (
                          <button
                            onClick={() => setConfirm({ type: 'demote', user })}
                            title={t('admin.users.demote')}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <ShieldOff className="h-3.5 w-3.5 text-orange-500" />
                            Retirar Permissões
                          </button>
                        )}
                        {user.isActive ? (
                          <button
                            onClick={() => setConfirm({ type: 'deactivate', user })}
                            title={t('admin.users.deactivate')}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Bloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirm({ type: 'activate', user })}
                            title={t('admin.users.activate')}
                            className="flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-900/40 px-2.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Ativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} utilizador{filtered.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={confirm !== null}
        title={confirm ? confirmMeta[confirm.type].title : ''}
        description={confirm ? confirmMeta[confirm.type].description : ''}
        confirmLabel={confirm ? confirmMeta[confirm.type].label : ''}
        danger={confirm ? confirmMeta[confirm.type].danger : false}
        onConfirm={execConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Globe, Search, Check, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { platformsApi } from '@/services/api';
import type { LearningPlatform } from '@/types';
import { cn } from '@/lib/utils';

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_PLATFORMS: LearningPlatform[] = [
  { id: '1', name: 'Udemy', baseUrl: 'https://udemy.com', isActive: true, isSearchEnabled: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'LinkedIn Learning', baseUrl: 'https://linkedin.com/learning', isActive: true, isSearchEnabled: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Coursera', baseUrl: 'https://coursera.org', isActive: false, isSearchEnabled: false, createdAt: '2024-02-01T00:00:00Z' },
  { id: '4', name: 'Pluralsight', baseUrl: 'https://pluralsight.com', isActive: true, isSearchEnabled: false, createdAt: '2024-03-01T00:00:00Z' },
];

// ─── Platform form modal ──────────────────────────────────────────────────────

interface PlatformFormData {
  name: string;
  baseUrl: string;
  logoUrl: string;
  apiKey: string;
  isActive: boolean;
  isSearchEnabled: boolean;
}

const EMPTY_FORM: PlatformFormData = {
  name: '',
  baseUrl: '',
  logoUrl: '',
  apiKey: '',
  isActive: true,
  isSearchEnabled: false,
};

function PlatformModal({
  open,
  platform,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  platform: LearningPlatform | null;
  onClose: () => void;
  onSave: (data: PlatformFormData) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<PlatformFormData>(() =>
    platform
      ? { name: platform.name, baseUrl: platform.baseUrl ?? '', logoUrl: platform.logoUrl ?? '', apiKey: platform.apiKey ?? '', isActive: platform.isActive, isSearchEnabled: platform.isSearchEnabled }
      : EMPTY_FORM,
  );

  const [showApiKey, setShowApiKey] = useState(false);

  const isEditing = platform !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('O nome é obrigatório.'); return; }
    onSave(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">
            {isEditing ? t('admin.platforms.editTitle') : t('admin.platforms.newTitle')}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ex. Udemy"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL base</label>
            <input
              type="url"
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL do logo</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="Deixa em branco para não alterar"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Necessária para plataformas com pesquisa via API (ex. Udemy, Coursera).</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Plataforma ativa</p>
              <p className="text-xs text-muted-foreground">Visível para os utilizadores</p>
            </div>
            <ToggleSwitch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pesquisa ativada</p>
              <p className="text-xs text-muted-foreground">Permite pesquisar cursos nesta plataforma</p>
            </div>
            <ToggleSwitch checked={form.isSearchEnabled} onChange={(v) => setForm((f) => ({ ...f, isSearchEnabled: v }))} />
          </div>

          </div>{/* end scroll area */}

          <div className="shrink-0 flex gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t('admin.users.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-softinsa-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-softinsa-blue/90 disabled:opacity-60 transition-colors"
            >
              {saving ? t('admin.platforms.saving') : isEditing ? t('admin.platforms.save') : t('admin.platforms.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-softinsa-blue/50',
        checked ? 'bg-softinsa-blue' : 'bg-slate-200 dark:bg-slate-600',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ open, name, onConfirm, onCancel }: { open: boolean; name: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">{t('admin.platforms.confirmDelete', { name })}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('admin.platforms.confirmDeleteDesc')}
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            {t('admin.users.cancel')}
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
            {t('admin.platforms.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlatformsTab() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningPlatform | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearningPlatform | null>(null);

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: async () => {
      try {
        const r = await platformsApi.getAll();
        return r.data;
      } catch {
        return MOCK_PLATFORMS;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<LearningPlatform>) => platformsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma criada.'); setModalOpen(false); },
    onError: () => toast.error('Erro ao criar plataforma.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LearningPlatform> }) => platformsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma atualizada.'); setEditing(null); setModalOpen(false); },
    onError: () => toast.error('Erro ao atualizar plataforma.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma eliminada.'); setDeleteTarget(null); },
    onError: () => toast.error('Erro ao eliminar plataforma.'),
  });

  function handleSave(data: { name: string; baseUrl: string; logoUrl: string; apiKey: string; isActive: boolean; isSearchEnabled: boolean }) {
    const payload: Partial<LearningPlatform> = {
      name: data.name,
      baseUrl: data.baseUrl || undefined,
      logoUrl: data.logoUrl || undefined,
      apiKey: data.apiKey || undefined,
      isActive: data.isActive,
      isSearchEnabled: data.isSearchEnabled,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filtered = platforms.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t('admin.users.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-softinsa-blue px-4 py-2 text-sm font-medium text-white hover:bg-softinsa-blue/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('admin.platforms.add')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.url')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.apiKey')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.active')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.search')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t('admin.platforms.noResults')}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.logoUrl ? (
                          <img src={p.logoUrl} alt={p.name} className="h-7 w-7 rounded-lg object-contain border border-border bg-white" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-softinsa-blue/10 text-softinsa-blue">
                            <Globe className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.baseUrl ? (
                        <a href={p.baseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-softinsa-blue hover:underline transition-colors">
                          {p.baseUrl}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.apiKey ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <KeyRound className="h-3 w-3 shrink-0" />
                          {'•'.repeat(8)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3">
                      {p.isSearchEnabled
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-muted-foreground/40" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditing(p); setModalOpen(true); }}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t('admin.platforms.edit')}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('admin.platforms.delete')}
                        </button>
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
            {filtered.length} plataforma{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <PlatformModal
        open={modalOpen}
        platform={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        saving={isSaving}
      />

      {/* Delete confirm */}
      <DeleteConfirm
        open={deleteTarget !== null}
        name={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

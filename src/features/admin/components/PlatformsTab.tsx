import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Globe, Search, Check, X, KeyRound, Eye, EyeOff, Settings2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { platformsApi } from '@/services/api';
import type { CreateAdminPlatformPayload, UpdateAdminPlatformPayload } from '@/services/api';
import type { LearningPlatform } from '@/types';
import { cn } from '@/lib/utils';

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_PLATFORMS: LearningPlatform[] = [
  { id: '1', name: 'Udemy', type: 'udemy', apiEndpoint: 'https://www.udemy.com/api-2.0', apiKeyRequired: true, isActive: true, isSearchEnabled: true, totalCourses: 312 },
  { id: '2', name: 'LinkedIn Learning', type: 'linkedin', apiEndpoint: 'https://learn.microsoft.com/api', apiKeyRequired: false, isActive: true, isSearchEnabled: true, totalCourses: 128 },
  { id: '3', name: 'Coursera', type: 'coursera', apiEndpoint: 'https://api.coursera.org/api', apiKeyRequired: true, isActive: false, isSearchEnabled: false, totalCourses: 0 },
  { id: '4', name: 'Pluralsight', type: 'custom', apiEndpoint: undefined, apiKeyRequired: false, isActive: true, isSearchEnabled: false, totalCourses: 54 },
];

// ─── Platform form modal ──────────────────────────────────────────────────────

interface ConfigEntry {
  key: string;
  value: string;
}

interface PlatformFormData {
  name: string;
  type: string;
  apiEndpoint: string;
  apiKeyRequired: boolean;
  apiKey: string;
  isActive: boolean;
  isSearchEnabled: boolean;
  configEntries: ConfigEntry[];
}

const EMPTY_FORM: PlatformFormData = {
  name: '',
  type: '',
  apiEndpoint: '',
  apiKeyRequired: false,
  apiKey: '',
  isActive: true,
  isSearchEnabled: false,
  configEntries: [],
};

function configToEntries(config?: Record<string, unknown>): ConfigEntry[] {
  if (!config || typeof config !== 'object') return [];
  return Object.entries(config).map(([key, value]) => ({ key, value: String(value) }));
}

function entriesToConfig(entries: ConfigEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries.filter((e) => e.key.trim()).map((e) => [e.key.trim(), e.value]),
  );
}

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
      ? {
        name: platform.name,
        type: platform.type ?? '',
        apiEndpoint: platform.apiEndpoint ?? '',
        apiKeyRequired: platform.apiKeyRequired ?? false,
        apiKey: '',
        isActive: platform.isActive,
        isSearchEnabled: platform.isSearchEnabled,
        configEntries: configToEntries(platform.config),
      }
      : EMPTY_FORM,
  );

  const addEntry = () => setForm((f) => ({ ...f, configEntries: [...f.configEntries, { key: '', value: '' }] }));
  const removeEntry = (i: number) => setForm((f) => ({ ...f, configEntries: f.configEntries.filter((_, idx) => idx !== i) }));
  const updateEntry = (i: number, field: 'key' | 'value', val: string) =>
    setForm((f) => ({
      ...f,
      configEntries: f.configEntries.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)),
    }));

  const [showApiKey, setShowApiKey] = useState(false);

  const isEditing = platform !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('O nome é obrigatório.'); return; }
    if (!form.type.trim()) { toast.error('O tipo é obrigatório.'); return; }
    onSave(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-xl p-4">
      <div className="flex w-full max-w-md flex-col rounded-[2rem] border border-border/60 bg-background/60 shadow-2xl backdrop-blur-2xl max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-6 py-4">
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo *</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="ex. udemy | coursera | linkedin | custom"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API Endpoint</label>
              <input
                type="url"
                value={form.apiEndpoint}
                onChange={(e) => setForm((f) => ({ ...f, apiEndpoint: e.target.value }))}
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
                <p className="text-sm font-medium text-foreground">Requer API Key</p>
                <p className="text-xs text-muted-foreground">A plataforma exige autenticação via API key</p>
              </div>
              <ToggleSwitch checked={form.apiKeyRequired} onChange={(v) => setForm((f) => ({ ...f, apiKeyRequired: v }))} />
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

            {/* Config entries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" />
                  Config (credenciais)
                </label>
                <button
                  type="button"
                  onClick={addEntry}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar campo
                </button>
              </div>
              {form.configEntries.length === 0 ? (
                <p className="text-[11px] text-muted-foreground px-1">
                  Nenhum campo configurado. Usa para credenciais OAuth (ex. <code className="font-mono">clientId</code>, <code className="font-mono">clientSecret</code>).
                </p>
              ) : (
                <div className="space-y-2">
                  {form.configEntries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="chave"
                        value={entry.key}
                        onChange={(e) => updateEntry(i, 'key', e.target.value)}
                        className="w-2/5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
                      />
                      <input
                        type="text"
                        placeholder="valor"
                        value={entry.value}
                        onChange={(e) => updateEntry(i, 'value', e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
                      />
                      <button
                        type="button"
                        onClick={() => removeEntry(i)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-xl">
      <div className="w-full max-w-sm rounded-[2rem] border border-border/60 bg-background/60 p-6 shadow-2xl backdrop-blur-2xl">
        <h3 className="text-lg font-bold text-foreground">{t('admin.platforms.confirmDelete', { name })}</h3>
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
  const navigate = useNavigate();
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
    mutationFn: (data: CreateAdminPlatformPayload) => platformsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma criada.'); setModalOpen(false); },
    onError: () => toast.error('Erro ao criar plataforma.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminPlatformPayload }) => platformsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma atualizada.'); setEditing(null); setModalOpen(false); },
    onError: () => toast.error('Erro ao atualizar plataforma.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success('Plataforma eliminada.'); setDeleteTarget(null); },
    onError: () => toast.error('Erro ao eliminar plataforma.'),
  });

  function handleSave(data: PlatformFormData) {
    const configEntries = entriesToConfig(data.configEntries);
    const configJson = Object.keys(configEntries).length > 0 ? JSON.stringify(configEntries) : undefined;
    if (editing) {
      const payload: UpdateAdminPlatformPayload = {
        name: data.name,
        type: data.type || undefined,
        apiEndpoint: data.apiEndpoint || undefined,
        apiKeyRequired: data.apiKeyRequired,
        apiKey: data.apiKey || undefined,
        isActive: data.isActive,
        isSearchEnabled: data.isSearchEnabled,
        config: configJson,
      };
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      const payload: CreateAdminPlatformPayload = {
        name: data.name,
        type: data.type,
        apiEndpoint: data.apiEndpoint || undefined,
        apiKeyRequired: data.apiKeyRequired,
        apiKey: data.apiKey || undefined,
        enabled: data.isActive,
        searchEnabled: data.isSearchEnabled,
        config: configJson,
      };
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t('admin.users.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('?tab=softinsa')}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-foreground hover:text-background transition-colors shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            Softinsa Learning
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-background hover:opacity-90 transition-all shadow-md shadow-foreground/5 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {t('admin.platforms.add')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Endpoint</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cursos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.active')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.search')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t('admin.platforms.noResults')}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-softinsa-blue/10 text-softinsa-blue">
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.type ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">{p.type}</span>
                      ) : <span className="text-xs text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[180px]">
                      {p.apiEndpoint ? (
                        <span className="truncate block" title={p.apiEndpoint}>{p.apiEndpoint}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                      {p.totalCourses ?? '—'}
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

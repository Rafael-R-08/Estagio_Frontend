import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Globe, Search, Check, X, KeyRound, Eye, EyeOff, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { platformsApi } from '@/services/api';
import type { CreateAdminPlatformPayload, UpdateAdminPlatformPayload } from '@/services/api';
import type { LearningPlatform } from '@/types';
import { cn } from '@/lib/utils';

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_PLATFORMS: LearningPlatform[] = [
  { id: '1', name: 'Udemy', type: 'udemy', apiEndpoint: 'https://www.udemy.com/api-2.0', apiKeyRequired: true, isActive: true, isSearchEnabled: true, totalCourses: 312 },
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
    if (!form.name.trim()) { toast.error(t('admin.platforms.validationName')); return; }
    if (!form.type.trim()) { toast.error(t('admin.platforms.validationType')); return; }
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.platforms.fields.name')} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('admin.platforms.fields.namePlaceholder')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.platforms.fields.type')} *</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder={t('admin.platforms.fields.typePlaceholder')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.platforms.fields.apiEndpoint')}</label>
              <input
                type="url"
                value={form.apiEndpoint}
                onChange={(e) => setForm((f) => ({ ...f, apiEndpoint: e.target.value }))}
                placeholder={t('admin.platforms.fields.urlPlaceholder')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <KeyRound className="h-3 w-3" />
                {t('admin.platforms.fields.apiKey')}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder={isEditing ? t('admin.platforms.fields.apiKeyChangeHint') : t('admin.platforms.fields.apiKeyPlaceholder')}
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
              <p className="text-[11px] text-muted-foreground">{t('admin.platforms.fields.apiKeyNote')}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('admin.platforms.fields.requiresApiKey')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.platforms.fields.requiresApiKeyDesc')}</p>
              </div>
              <ToggleSwitch checked={form.apiKeyRequired} onChange={(v) => setForm((f) => ({ ...f, apiKeyRequired: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('admin.platforms.fields.active')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.platforms.fields.activeDesc')}</p>
              </div>
              <ToggleSwitch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('admin.platforms.fields.search')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.platforms.fields.searchDesc')}</p>
              </div>
              <ToggleSwitch checked={form.isSearchEnabled} onChange={(v) => setForm((f) => ({ ...f, isSearchEnabled: v }))} />
            </div>

            {/* Config entries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" />
                  {t('admin.platforms.fields.config')}
                </label>
                <button
                  type="button"
                  onClick={addEntry}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {t('admin.platforms.fields.configAdd')}
                </button>
              </div>
              {form.configEntries.length === 0 ? (
                <p className="text-[11px] text-muted-foreground px-1">
                  {t('admin.platforms.fields.configEmpty')}
                </p>
              ) : (
                <div className="space-y-2">
                  {form.configEntries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={t('admin.platforms.fields.configKeyPlaceholder')}
                        value={entry.key}
                        onChange={(e) => updateEntry(i, 'key', e.target.value)}
                        className="w-2/5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40"
                      />
                      <input
                        type="text"
                        placeholder={t('admin.platforms.fields.configValuePlaceholder')}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PlatformsTab() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningPlatform | null>(null);

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success(t('admin.platforms.toastCreated')); setModalOpen(false); },
    onError: () => toast.error(t('admin.platforms.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminPlatformPayload }) => platformsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'platforms'] }); toast.success(t('admin.platforms.toastUpdated')); setEditing(null); setModalOpen(false); },
    onError: () => toast.error(t('admin.platforms.toastUpdateError')),
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

  const filtered = platforms
    .filter((p) => p.isActive)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

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
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.type')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.apiEndpoint')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.platforms.columns.courses')}</th>
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
            {t(filtered.length !== 1 ? 'admin.platforms.countPlural' : 'admin.platforms.countSingle', { count: filtered.length })}
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
    </div>
  );
}

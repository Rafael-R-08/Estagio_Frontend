import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Bell,
  Shield,
  Monitor,
  Save,
  Download,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../../services/api';
import type { UserSettings, UpdateUserSettingsDto } from '../../../types';
import { cn } from '../../../lib/utils';
import { applyTheme, type Theme } from '../../../utils/theme';
import i18n from '../../../i18n';
import { usePWAInstall } from '../../../hooks/usePWAInstall';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  preferredPlatforms: [],
  contentTypes: [],
  preferredDuration: null,
  courseLanguage: null,
  freeContentOnly: false,
  aiResponseDetail: null,
  aiResponseLanguage: null,
  aiExplainReasoning: false,
  aiRecommendationMode: null,
  notifyWeeklyRecs: true,
  notifyCertExpiry: true,
  notifyProgress: true,
  notifyByEmail: true,
  notifyInApp: true,
  adminCanSeeRecs: true,
  aiCanUseHistory: true,
  renewalPeriodMonths: 6,
};

// ─── Appearance stored in localStorage ────────────────────────────────────────

type Density = 'comfortable' | 'compact';
type UiLang = 'pt' | 'en';

function loadAppearance() {
  const rawTheme = (localStorage.getItem('lh_theme') as Theme) ?? 'system';
  // Normalizar valores antigos: 'light' deve mapear para 'system'
  const theme = rawTheme === 'light' ? 'system' : rawTheme;
  return {
    theme: theme,
    density: (localStorage.getItem('app_density') as Density) ?? 'comfortable',
    uiLang: (localStorage.getItem('lh_lang') as UiLang) ?? 'pt',
  };
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'ai', labelKey: 'settings.sections.ai', icon: Sparkles, customLabel: false },
  { id: 'notifications', labelKey: 'settings.sections.notifications', icon: Bell, customLabel: false },
  { id: 'privacy', labelKey: 'settings.sections.privacy', icon: Shield, customLabel: false },
  { id: 'appearance', labelKey: 'settings.sections.appearance', icon: Monitor, customLabel: false },
  { id: 'app', labelKey: 'Aplicação', icon: Smartphone, customLabel: true },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

// ─── UI helpers ───────────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

function SelectField({ value, options, onChange }: {
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full sm:w-auto min-w-[120px] sm:min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40 cursor-pointer"
    >
      <option value="">Não definido</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RadioGroup({ value, options, onChange }: {
  value: string | null;
  options: { value: string; label: string; description?: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            'flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors',
            value === o.value
              ? 'border-softinsa-blue bg-softinsa-blue/5 dark:bg-softinsa-blue/10'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500',
          )}
        >
          <input
            type="radio"
            name={o.value}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-0.5 accent-softinsa-blue shrink-0"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{o.label}</span>
            {o.description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{o.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-softinsa-blue cursor-pointer"
      />
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
    </label>
  );
}

function SectionPanel({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-softinsa-blue/10 text-softinsa-blue">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

function SectionItem({ children }: { children: React.ReactNode }) {
  return <div className="px-5">{children}</div>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>('ai');
  const { isInstallable, promptInstall } = usePWAInstall();

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const r = await settingsApi.get();
        return r.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const settings: UserSettings = serverSettings ?? DEFAULT_SETTINGS;
  const [draft, setDraft] = useState<UserSettings | null>(null);
  const current = draft ?? settings;

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setDraft((prev) => ({ ...(prev ?? settings), [key]: value }));

  const { t } = useTranslation();

  const [appearance, setAppearance] = useState(loadAppearance);
  const setApp = <K extends keyof ReturnType<typeof loadAppearance>>(key: K, value: string) => {
    if (key === 'theme') {
      applyTheme(value as Theme);
    } else if (key === 'uiLang') {
      localStorage.setItem('lh_lang', value);
      i18n.changeLanguage(value);
      set('uiLanguage', value);
    } else {
      localStorage.setItem(`app_${key}`, value);
    }
    setAppearance((prev) => ({ ...prev, [key]: value }));
  };

  // Sincronizar idioma do backend quando as definições carregam
  useEffect(() => {
    if (settings?.uiLanguage && settings.uiLanguage !== i18n.language) {
      localStorage.setItem('lh_lang', settings.uiLanguage);
      i18n.changeLanguage(settings.uiLanguage);
    }
  }, [settings?.uiLanguage]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpdateUserSettingsDto) => settingsApi.update(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setDraft(null);
      toast.success('Definições guardadas.');
    },
    onError: () => toast.error('Erro ao guardar as definições.'),
  });

  const isDirty = draft !== null;

  function handleSave() {
    if (!isDirty) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, userId: _uid, ...dto } = current as UserSettings & { id?: string; userId?: string };
    saveMutation.mutate(dto);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-softinsa-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('settings.subtitle')}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
              isDirty
                ? 'bg-softinsa-blue text-white hover:bg-softinsa-blue/90 shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed',
            )}
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar nav */}
          <aside className="w-full md:w-52 shrink-0">
            <nav className="flex md:block md:sticky md:top-6 overflow-x-auto pb-2 md:pb-0 gap-2 md:gap-0 md:space-y-1 snap-x scrollbar-hide">
              {SECTIONS.map(({ id, labelKey, icon: Icon, customLabel }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex-shrink-0 snap-start flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-left transition-colors whitespace-nowrap md:w-full',
                    activeSection === id
                      ? 'bg-softinsa-blue text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {customLabel ? labelKey : t(labelKey)}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            {/* ── IA ── */}
            {activeSection === 'ai' && (
              <SectionPanel title={t('settings.ai.title')} icon={Sparkles}>
                <SectionItem>
                  <SettingRow label={t('settings.ai.responseDetail')} description={t('settings.ai.responseDetailDesc')}>
                    <SelectField
                      value={current.aiResponseDetail}
                      options={[
                        { value: 'concise', label: t('settings.ai.concise') },
                        { value: 'detailed', label: t('settings.ai.detailed') },
                      ]}
                      onChange={(v) => set('aiResponseDetail', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label={t('settings.ai.responseLanguage')}>
                    <SelectField
                      value={current.aiResponseLanguage}
                      options={[
                        { value: 'pt', label: t('settings.ai.portuguese') },
                        { value: 'en', label: t('settings.ai.english') },
                      ]}
                      onChange={(v) => set('aiResponseLanguage', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.ai.explainReasoning')}
                    description={t('settings.ai.explainReasoningDesc')}
                  >
                    <Toggle checked={current.aiExplainReasoning} onChange={(v) => set('aiExplainReasoning', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <div className="py-4">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-3">{t('settings.ai.recommendationMode')}</p>
                    <RadioGroup
                      value={current.aiRecommendationMode}
                      options={[
                        { value: 'conservative', label: t('settings.ai.conservative'), description: t('settings.ai.conservativeDesc') },
                        { value: 'exploratory', label: t('settings.ai.exploratory'), description: t('settings.ai.exploratoryDesc') },
                      ]}
                      onChange={(v) => set('aiRecommendationMode', v)}
                    />
                  </div>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Notificações ── */}
            {activeSection === 'notifications' && (
              <SectionPanel title={t('settings.notifications.title')} icon={Bell}>
                <SubLabel>{t('settings.notifications.alerts')}</SubLabel>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.weeklyRecs')}
                    description={t('settings.notifications.weeklyRecsDesc')}
                  >
                    <Toggle checked={current.notifyWeeklyRecs} onChange={(v) => set('notifyWeeklyRecs', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.certExpiry')}
                    description={t('settings.notifications.certExpiryDesc')}
                  >
                    <Toggle checked={current.notifyCertExpiry} onChange={(v) => set('notifyCertExpiry', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.progress')}
                    description={t('settings.notifications.progressDesc')}
                  >
                    <Toggle checked={current.notifyProgress} onChange={(v) => set('notifyProgress', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label="Antecedência de alertas de expiração">
                    <SelectField
                      value={current.renewalPeriodMonths?.toString()}
                      options={[
                        { value: '1', label: '1 mês' },
                        { value: '3', label: '3 meses' },
                        { value: '6', label: '6 meses' },
                        { value: '12', label: '12 meses' },
                      ]}
                      onChange={(v) => set('renewalPeriodMonths', v ? Number(v) : 6)}
                    />
                  </SettingRow>
                </SectionItem>
                <SubLabel>{t('settings.notifications.channel')}</SubLabel>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.channel')}
                    description={t('settings.notifications.channelDesc')}
                  >
                    <div className="flex flex-col gap-2">
                      <Checkbox
                        checked={current.notifyByEmail}
                        onChange={(v) => set('notifyByEmail', v)}
                        label={t('settings.notifications.email')}
                      />
                      <Checkbox
                        checked={current.notifyInApp}
                        onChange={(v) => set('notifyInApp', v)}
                        label={t('settings.notifications.inApp')}
                      />
                    </div>
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Privacidade ── */}
            {activeSection === 'privacy' && (
              <SectionPanel title={t('settings.privacy.title')} icon={Shield}>
                <SectionItem>
                  <SettingRow
                    label={t('settings.privacy.adminCanSeeRecs')}
                    description={t('settings.privacy.adminCanSeeRecsDesc')}
                  >
                    <Toggle checked={current.adminCanSeeRecs} onChange={(v) => set('adminCanSeeRecs', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.privacy.aiCanUseHistory')}
                    description={t('settings.privacy.aiCanUseHistoryDesc')}
                  >
                    <Toggle checked={current.aiCanUseHistory} onChange={(v) => set('aiCanUseHistory', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.privacy.downloadData')}
                    description={t('settings.privacy.downloadDataDesc')}
                  >
                    <button
                      type="button"
                      onClick={() => toast.info(t('common.featureInDev'))}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('common.export')}
                    </button>
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Aparência ── */}
            {activeSection === 'appearance' && (
              <SectionPanel title={t('settings.appearance.title')} icon={Monitor}>
                <SectionItem>
                  <SettingRow label={t('settings.appearance.theme')} description={t('settings.appearance.themeDesc')}>
                    <SelectField
                      value={appearance.theme}
                      options={[
                        { value: 'dark', label: t('settings.appearance.dark') },
                        { value: 'system', label: t('settings.appearance.system') },
                      ]}
                      onChange={(v) => setApp('theme', v ?? 'system')}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label={t('settings.appearance.language')}>
                    <SelectField
                      value={appearance.uiLang}
                      options={[
                        { value: 'pt', label: t('lang.pt') },
                        { value: 'en', label: t('lang.en') },
                      ]}
                      onChange={(v) => setApp('uiLang', v ?? 'pt')}
                    />
                  </SettingRow>
                </SectionItem>
                <div className="px-5 pb-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t('settings.appearance.note')}
                  </p>
                </div>
              </SectionPanel>
            )}

            {/* ── App ── */}
            {activeSection === 'app' && (
              <SectionPanel title="Aplicação" icon={Smartphone}>
                <SectionItem>
                  <SettingRow 
                    label="Instalar Aplicação" 
                    description={isInstallable 
                      ? "Instala a LearningHub no teu dispositivo para um acesso mais rápido e uma experiência nativa."
                      : "A aplicação já está instalada ou o teu browser não suporta esta funcionalidade."}
                  >
                    <button
                      type="button"
                      onClick={() => promptInstall()}
                      disabled={!isInstallable}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        isInstallable 
                          ? "border-softinsa-blue/20 bg-softinsa-blue/10 text-softinsa-blue hover:bg-softinsa-blue/20 dark:border-softinsa-blue/30 dark:bg-softinsa-blue/20 dark:text-blue-400 dark:hover:bg-softinsa-blue/30"
                          : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Instalar
                    </button>
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
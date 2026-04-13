import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Bell,
  Shield,
  Monitor,
  Save,
  Smartphone,
  Download,
  Share,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '@/services/api';
import type { UserSettings, UpdateUserSettingsDto } from '@/types';
import { cn } from '@/lib/utils';
import { applyTheme, type Theme } from '@/utils/theme';
import i18n from '@/i18n';
import { usePWAInstall } from '@/hooks/usePWAInstall';


// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  notifyWeeklyRecs: true,
  notifyCertExpiry: true,
  notifyProgress: true,
  notifyByEmail: true,
  notifyInApp: true,
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

// ─── AI prefs stored in localStorage (not persisted to backend) ───────────────

interface LocalAiPrefs {
  aiResponseDetail: string | null;
  aiResponseLanguage: string | null;
  aiExplainReasoning: boolean;
  aiRecommendationMode: string | null;
}

const AI_PREFS_KEY = 'lh_ai_prefs';

function loadAiPrefs(): LocalAiPrefs {
  try {
    const raw = localStorage.getItem(AI_PREFS_KEY);
    return raw
      ? (JSON.parse(raw) as LocalAiPrefs)
      : { aiResponseDetail: null, aiResponseLanguage: null, aiExplainReasoning: false, aiRecommendationMode: null };
  } catch {
    return { aiResponseDetail: null, aiResponseLanguage: null, aiExplainReasoning: false, aiRecommendationMode: null };
  }
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'ai', labelKey: 'settings.sections.ai', icon: Sparkles, customLabel: false },
  { id: 'notifications', labelKey: 'settings.sections.notifications', icon: Bell, customLabel: false },
  { id: 'privacy', labelKey: 'settings.sections.privacy', icon: Shield, customLabel: false },
  { id: 'appearance', labelKey: 'settings.sections.appearance', icon: Monitor, customLabel: false },
  { id: 'app', labelKey: 'settings.sections.app', icon: Smartphone, customLabel: false },
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
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10',
        checked ? 'bg-foreground' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-xl ring-0 transition duration-200',
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
  const { t } = useTranslation();
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full sm:w-auto min-w-[120px] sm:min-w-[160px] rounded-full border border-border/60 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-foreground/10 cursor-pointer"
    >
      <option value="">{t('settings2.notDefinedOption')}</option>
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
            'flex items-start gap-4 rounded-3xl border-2 px-6 py-4 cursor-pointer transition-all active:scale-[0.98]',
            value === o.value
              ? 'border-foreground bg-foreground/5 dark:bg-foreground/10'
              : 'border-border/60 hover:border-border',
          )}
        >
          <input
            type="radio"
            name={o.value}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-1 accent-foreground shrink-0 h-4 w-4"
          />
          <div>
            <span className="text-sm font-bold text-foreground">{o.label}</span>
            {o.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{o.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}


function SectionPanel({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="rounded-[2.5rem] border border-border/60 bg-card/40 shadow-2xl backdrop-blur-2xl divide-y divide-border/20 overflow-hidden">
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
    <p className="px-6 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>('ai');
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const isIOS = typeof navigator !== 'undefined' &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

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
  const [aiPrefs, setAiPrefs] = useState<LocalAiPrefs>(loadAiPrefs);

  const setAiPref = <K extends keyof LocalAiPrefs>(key: K, value: LocalAiPrefs[K]) => {
    setAiPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(AI_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };
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
      toast.success(t('settings2.toastSaved'));
    },
    onError: () => toast.error(t('settings2.toastError')),
  });

  const isDirty = draft !== null;

  function handleSave() {
    if (!isDirty) return;
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Page header */}
        <div className="mb-12 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t('settings.title')}</h1>
            <p className="mt-1 text-base text-muted-foreground">
              {t('settings.subtitle')}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className={cn(
              'flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all active:scale-95',
              isDirty
                ? 'bg-blue-600 text-white shadow-2xl hover:bg-blue-700 shadow-blue-600/20'
                : 'bg-muted/40 border border-border/60 text-muted-foreground/40 cursor-not-allowed',
            )}
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar nav */}
          <aside className="w-full md:w-60 shrink-0">
            <nav className="flex md:block md:sticky md:top-12 overflow-x-auto pb-4 md:pb-0 gap-2 md:gap-1.5 md:space-y-1.5 snap-x scrollbar-hide">
              {SECTIONS.map(({ id, labelKey, icon: Icon, customLabel }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex-shrink-0 snap-start flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold text-left transition-all whitespace-nowrap md:w-full',
                    activeSection === id
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
                      value={aiPrefs.aiResponseDetail}
                      options={[
                        { value: 'concise', label: t('settings.ai.concise') },
                        { value: 'detailed', label: t('settings.ai.detailed') },
                      ]}
                      onChange={(v) => setAiPref('aiResponseDetail', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label={t('settings.ai.responseLanguage')}>
                    <SelectField
                      value={aiPrefs.aiResponseLanguage}
                      options={[
                        { value: 'pt', label: t('settings.ai.portuguese') },
                        { value: 'en', label: t('settings.ai.english') },
                      ]}
                      onChange={(v) => setAiPref('aiResponseLanguage', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.ai.explainReasoning')}
                    description={t('settings.ai.explainReasoningDesc')}
                  >
                    <Toggle checked={aiPrefs.aiExplainReasoning} onChange={(v) => setAiPref('aiExplainReasoning', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <div className="py-4">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-3">{t('settings.ai.recommendationMode')}</p>
                    <RadioGroup
                      value={aiPrefs.aiRecommendationMode}
                      options={[
                        { value: 'conservative', label: t('settings.ai.conservative'), description: t('settings.ai.conservativeDesc') },
                        { value: 'exploratory', label: t('settings.ai.exploratory'), description: t('settings.ai.exploratoryDesc') },
                      ]}
                      onChange={(v) => setAiPref('aiRecommendationMode', v)}
                    />
                  </div>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Notificações ── */}
            {activeSection === 'notifications' && (
              <SectionPanel title={t('settings.notifications.title')} icon={Bell}>
                <SubLabel>{t('settings.notifications.emailPrefsLabel')}</SubLabel>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.email')}
                    description={t('settings.notifications.emailDesc')}
                  >
                    <Toggle checked={current.notifyByEmail} onChange={(v) => set('notifyByEmail', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label={t('settings.notifications.inApp')}
                    description={t('settings.notifications.inAppDesc')}
                  >
                    <Toggle checked={current.notifyInApp} onChange={(v) => set('notifyInApp', v)} />
                  </SettingRow>
                </SectionItem>

                <SubLabel>{t('settings.notifications.contentAlertsLabel')}</SubLabel>
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
              </SectionPanel>
            )}

            {/* ── Privacidade ── */}
            {activeSection === 'privacy' && (
              <SectionPanel title={t('settings.privacy.title')} icon={Shield}>
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
              <SectionPanel title={t('settings.sections.app')} icon={Smartphone}>
                <SectionItem>
                  {isInstalled ? (
                    <SettingRow
                      label={t('settings2.installed')}
                      description={t('settings2.installedDesc')}
                    >
                      <span className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {t('settings2.installedBadge')}
                      </span>
                    </SettingRow>
                  ) : isIOS ? (
                    <div className="py-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">{t('settings2.iosTitle')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('settings2.iosDesc')}</p>
                      <ol className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                          <span>{t('settings2.iosStep1a')} <Share className="inline h-4 w-4 text-primary mx-0.5" /> <strong>{t('settings2.iosStep1b')}</strong> {t('settings2.iosStep1c')}</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                          <span>{t('settings2.iosStep2a')} <strong>"{t('settings2.iosStep2b')}"</strong></span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                          <span>{t('settings2.iosStep3a')} <strong>{t('settings2.iosStep3b')}</strong></span>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <SettingRow
                      label={t('settings2.install')}
                      description={isInstallable ? t('settings2.installDesc') : t('settings2.installDescNotAvail')}
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
                        {t('settings2.installButton')}
                      </button>
                    </SettingRow>
                  )}
                </SectionItem>
              </SectionPanel>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
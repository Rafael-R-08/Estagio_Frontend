import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Bell,
  Shield,
  Monitor,
  Save,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../../services/api';
import type { UserSettings, UpdateUserSettingsDto } from '../../../types';
import { cn } from '../../../lib/utils';

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
};

// ─── Appearance stored in localStorage ────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';
type Density = 'comfortable' | 'compact';
type UiLang = 'pt' | 'en';

function loadAppearance() {
  return {
    theme: (localStorage.getItem('app_theme') as Theme) ?? 'system',
    density: (localStorage.getItem('app_density') as Density) ?? 'comfortable',
    uiLang: (localStorage.getItem('app_ui_lang') as UiLang) ?? 'pt',
  };
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'ai', label: 'Assistente IA', icon: Sparkles },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'privacy', label: 'Privacidade', icon: Shield },
  { id: 'appearance', label: 'Aparência', icon: Monitor },
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
      className="min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-softinsa-blue/40 cursor-pointer"
    >
      <option value="">Não definido</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
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

  const [appearance, setAppearance] = useState(loadAppearance);
  const setApp = <K extends keyof ReturnType<typeof loadAppearance>>(key: K, value: string) => {
    localStorage.setItem(`app_${key}`, value);
    setAppearance((prev) => ({ ...prev, [key]: value }));
  };

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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Definições</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Preferências da plataforma e comportamento da IA
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
            {saveMutation.isPending ? 'A guardar…' : 'Guardar alterações'}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <aside className="w-52 shrink-0">
            <nav className="sticky top-6 space-y-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-left transition-colors',
                    activeSection === id
                      ? 'bg-softinsa-blue text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            {/* ── IA ── */}
            {activeSection === 'ai' && (
              <SectionPanel title="Preferências da IA" icon={Sparkles}>
                <SectionItem>
                  <SettingRow label="Nível de detalhe das respostas" description="Controla o quão extensa é cada resposta da IA">
                    <SelectField
                      value={current.aiResponseDetail}
                      options={[
                        { value: 'concise', label: 'Conciso' },
                        { value: 'detailed', label: 'Detalhado' },
                      ]}
                      onChange={(v) => set('aiResponseDetail', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label="Idioma das respostas da IA">
                    <SelectField
                      value={current.aiResponseLanguage}
                      options={[
                        { value: 'pt', label: 'Português' },
                        { value: 'en', label: 'Inglês' },
                      ]}
                      onChange={(v) => set('aiResponseLanguage', v)}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="Explicar raciocínio"
                    description="A IA justifica o porquê de cada recomendação"
                  >
                    <Toggle checked={current.aiExplainReasoning} onChange={(v) => set('aiExplainReasoning', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="Modo de recomendações"
                    description="Define se a IA sugere dentro da tua área atual ou explora novas áreas"
                  >
                    <SelectField
                      value={current.aiRecommendationMode}
                      options={[
                        { value: 'conservative', label: 'Conservador' },
                        { value: 'exploratory', label: 'Exploratório' },
                      ]}
                      onChange={(v) => set('aiRecommendationMode', v)}
                    />
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Notificações ── */}
            {activeSection === 'notifications' && (
              <SectionPanel title="Notificações" icon={Bell}>
                <SubLabel>Alertas</SubLabel>
                <SectionItem>
                  <SettingRow
                    label="Recomendações semanais"
                    description="Sugestões de cursos enviadas todas as semanas"
                  >
                    <Toggle checked={current.notifyWeeklyRecs} onChange={(v) => set('notifyWeeklyRecs', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="Certificações a expirar"
                    description="Aviso 30 dias antes de uma certificação expirar"
                  >
                    <Toggle checked={current.notifyCertExpiry} onChange={(v) => set('notifyCertExpiry', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="Progresso de cursos"
                    description="Lembrete quando tens um curso a meio há mais de 7 dias"
                  >
                    <Toggle checked={current.notifyProgress} onChange={(v) => set('notifyProgress', v)} />
                  </SettingRow>
                </SectionItem>
                <SubLabel>Canal</SubLabel>
                <SectionItem>
                  <SettingRow label="Notificações por email">
                    <Toggle checked={current.notifyByEmail} onChange={(v) => set('notifyByEmail', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label="Notificações in-app">
                    <Toggle checked={current.notifyInApp} onChange={(v) => set('notifyInApp', v)} />
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Privacidade ── */}
            {activeSection === 'privacy' && (
              <SectionPanel title="Privacidade" icon={Shield}>
                <SectionItem>
                  <SettingRow
                    label="Admin pode ver as minhas recomendações"
                    description="O administrador pode ver os cursos recomendados pela IA para ti"
                  >
                    <Toggle checked={current.adminCanSeeRecs} onChange={(v) => set('adminCanSeeRecs', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="IA pode usar o meu historial"
                    description="Permite personalização com base nos cursos que já concluíste"
                  >
                    <Toggle checked={current.aiCanUseHistory} onChange={(v) => set('aiCanUseHistory', v)} />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow
                    label="Download dos meus dados"
                    description="Exporta todos os teus dados pessoais (RGPD)"
                  >
                    <button
                      type="button"
                      onClick={() => toast.info('Funcionalidade em desenvolvimento.')}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar
                    </button>
                  </SettingRow>
                </SectionItem>
              </SectionPanel>
            )}

            {/* ── Aparência ── */}
            {activeSection === 'appearance' && (
              <SectionPanel title="Aparência" icon={Monitor}>
                <SectionItem>
                  <SettingRow label="Tema" description="Esquema de cores da interface">
                    <SelectField
                      value={appearance.theme}
                      options={[
                        { value: 'light', label: 'Claro' },
                        { value: 'dark', label: 'Escuro' },
                        { value: 'system', label: 'Sistema' },
                      ]}
                      onChange={(v) => setApp('theme', v ?? 'system')}
                    />
                  </SettingRow>
                </SectionItem>
                <SectionItem>
                  <SettingRow label="Idioma da interface">
                    <SelectField
                      value={appearance.uiLang}
                      options={[
                        { value: 'pt', label: 'Português' },
                        { value: 'en', label: 'English' },
                      ]}
                      onChange={(v) => setApp('uiLang', v ?? 'pt')}
                    />
                  </SettingRow>
                </SectionItem>
                <div className="px-5 pb-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    As preferências de aparência são guardadas localmente neste dispositivo e não requerem guardar.
                  </p>
                </div>
              </SectionPanel>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
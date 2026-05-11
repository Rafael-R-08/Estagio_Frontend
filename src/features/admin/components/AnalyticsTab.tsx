import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Award, Calendar, Bot, Database, Target, FileCheck } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { AdminAnalytics } from '@/types';
import { SERVICE_LINE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ANALYTICS: AdminAnalytics = {
  overview: {
    totalUsers: 61,
    activeUsers: 55,
    inactiveUsers: 6,
    onboardingRate: 87,
    newUsersThisMonth: 9,
    usersByRole: { USER: 55, ADMIN: 2, SERVICE_LINE_MANAGER: 4 },
    usersByServiceLine: { HYBRID_CLOUD: 15, DATA: 12, BUSINESS_APPLICATIONS: 10, APPLICATION_OPERATIONS: 14, SOURCING_TALENT_MANAGEMENT: 8 },
    usersByExperienceLevel: { junior: 18, intermedio: 22, senior: 14, especialista: 5, lider: 2 },
  },
  trainingStats: {
    total: 248,
    byStatus: { ongoing: 45, completed: 108, priority: 28, later: 52, accessed: 12, cancelled: 3 },
    completionRate: 44,
  },
  certificateStats: {
    total: 93,
    byStatus: { COMPLETED: 87, PROCESSING: 3, FAILED: 3 },
    issuedThisMonth: 11,
    expiringIn30Days: 2,
    expiringIn31to60Days: 3,
  },
  aiUsageStats: {
    totalConversations: 184,
    conversationsLast30Days: 47,
    totalMessages: 1240,
    avgMessagesPerConversation: 6.7,
  },
  platformStats: {
    total: 4,
    active: 3,
    inactive: 1,
    totalIndexedCourses: 540,
  },
  recentUsers: [
    { id: '1', name: 'Eva Lopes', email: 'eva@softinsa.pt', role: 'USER', createdAt: '2026-03-28T10:00:00Z', serviceLine: 'DATA' },
    { id: '2', name: 'David Sousa', email: 'david@softinsa.pt', role: 'USER', createdAt: '2026-03-25T09:00:00Z', serviceLine: null },
    { id: '3', name: 'Carla Mendes', email: 'carla@softinsa.pt', role: 'SERVICE_LINE_MANAGER', createdAt: '2026-03-20T08:00:00Z', serviceLine: 'HYBRID_CLOUD' },
  ],
  completedByMonth: [
    { month: '2025-10', count: 12 },
    { month: '2025-11', count: 18 },
    { month: '2025-12', count: 9 },
    { month: '2026-01', count: 24 },
    { month: '2026-02', count: 31 },
    { month: '2026-03', count: 15 },
  ],
  platformUsage: [
    { name: 'Udemy', count: 45 },
  ],
  userGrowth: [
    { month: '2025-10', count: 20 },
    { month: '2025-11', count: 27 },
    { month: '2025-12', count: 31 },
    { month: '2026-01', count: 40 },
    { month: '2026-02', count: 52 },
    { month: '2026-03', count: 61 },
  ],
  topSkills: [
    { skill: 'TypeScript', count: 38 },
    { skill: 'React', count: 34 },
    { skill: 'AWS', count: 28 },
    { skill: 'Docker', count: 22 },
    { skill: 'Python', count: 19 },
    { skill: 'SQL', count: 15 },
  ],
  expiringCertificates: [
    { userId: '1', userName: 'Bruno Costa', courseName: 'AWS Solutions Architect', expirationDate: '2026-03-25T00:00:00Z', daysLeft: 15 },
    { userId: '2', userName: 'Ana Ferreira', courseName: 'Azure Fundamentals', expirationDate: '2026-04-10T00:00:00Z', daysLeft: 31 },
    { userId: '3', userName: 'Eva Lopes', courseName: 'Kubernetes CKA', expirationDate: '2026-04-30T00:00:00Z', daysLeft: 51 },
    { userId: '4', userName: 'David Sousa', courseName: 'Google Cloud Professional', expirationDate: '2026-05-15T00:00:00Z', daysLeft: 66 },
  ],
};

// ─── Chart colors ─────────────────────────────────────────────────────────────

const CHART_COLORS = ['#0057B7', '#45A5FF', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444'];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md px-5 py-4 shadow-sm">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-border/60 bg-background/40 backdrop-blur-md p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
}

// ─── Expiry urgency badge ─────────────────────────────────────────────────────

function UrgencyBadge({ days }: { days: number }) {
  if (days <= 14) return <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">{days}d</span>;
  if (days <= 30) return <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">{days}d</span>;
  return <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-muted-foreground">{days}d</span>;
}

// ─── Format month label ───────────────────────────────────────────────────────

function fmtMonth(m: string, locale: Locale) {
  try {
    return format(parseISO(`${m}-01`), 'MMM yy', { locale });
  } catch {
    return m;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? pt : enUS;
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      try {
        const r = await adminApi.getAnalytics();
        return r.data;
      } catch {
        return MOCK_ANALYTICS;
      }
    },
  });

  const analytics: AdminAnalytics = {
    overview: data?.overview ?? MOCK_ANALYTICS.overview,
    trainingStats: data?.trainingStats ?? MOCK_ANALYTICS.trainingStats,
    certificateStats: data?.certificateStats ?? MOCK_ANALYTICS.certificateStats,
    aiUsageStats: data?.aiUsageStats ?? MOCK_ANALYTICS.aiUsageStats,
    platformStats: data?.platformStats ?? MOCK_ANALYTICS.platformStats,
    recentUsers: data?.recentUsers ?? MOCK_ANALYTICS.recentUsers,
    completedByMonth: data?.completedByMonth ?? MOCK_ANALYTICS.completedByMonth,
    platformUsage: data?.platformUsage ?? MOCK_ANALYTICS.platformUsage,
    userGrowth: data?.userGrowth ?? MOCK_ANALYTICS.userGrowth,
    topSkills: data?.topSkills ?? MOCK_ANALYTICS.topSkills,
    expiringCertificates: data?.expiringCertificates ?? MOCK_ANALYTICS.expiringCertificates,
  };

  const totalUsers = analytics.overview?.totalUsers ?? analytics.userGrowth.at(-1)?.count ?? 0;
  const activeUsers = analytics.overview?.activeUsers ?? totalUsers;
  const completionRate = analytics.trainingStats?.completionRate ?? null;
  const expiringIn30 = analytics.certificateStats?.expiringIn30Days ?? analytics.expiringCertificates.length;

  return (
    <div className="space-y-8">
      {/* ── Secção: Utilizadores ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <Users className="h-3.5 w-3.5" /> {t('admin.analytics.sections.users')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Users} label={t('admin.analytics.stats.activeUsers')} value={isLoading ? '—' : activeUsers} color="bg-softinsa-blue/10 text-softinsa-blue" />
          <StatCard icon={Award} label={t('admin.analytics.stats.totalUsers')} value={isLoading ? '—' : totalUsers} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
          <StatCard
            icon={TrendingUp}
            label={t('admin.analytics.stats.newThisMonth')}
            value={isLoading ? '—' : (analytics.overview?.newUsersThisMonth ?? '—')}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Target}
            label={t('admin.analytics.stats.onboardingRate')}
            value={isLoading ? '—' : analytics.overview?.onboardingRate !== undefined ? `${analytics.overview.onboardingRate}%` : '—'}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Distribution charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title={t('admin.analytics.stats.usersByServiceLine')}>
            {isLoading ? <ChartSkeleton /> : (() => {
              const entries = Object.entries(analytics.overview?.usersByServiceLine ?? {});
              if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">{t('admin.analytics.stats.noData')}</p>;
              const SL_SHORT: Record<string, string> = {
                HYBRID_CLOUD: 'Hybrid Cloud',
                DATA: 'Data',
                BUSINESS_APPLICATIONS: 'Bus. Apps',
                APPLICATION_OPERATIONS: 'App Ops',
                SOURCING_TALENT_MANAGEMENT: 'Sourcing',
              };
              const chartData = entries.map(([k, v]) => ({ name: SL_SHORT[k] ?? k, value: v as number }));
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>

          <ChartCard title={t('admin.analytics.stats.usersByLevel')}>
            {isLoading ? <ChartSkeleton /> : (() => {
              const EXP_LABELS: Record<string, string> = {
                junior: t('admin.analytics.levels.junior'),
                intermedio: t('admin.analytics.levels.intermedio'),
                senior: t('admin.analytics.levels.senior'),
                especialista: t('admin.analytics.levels.especialista'),
                lider: t('admin.analytics.levels.lider'),
              };
              const entries = Object.entries(analytics.overview?.usersByExperienceLevel ?? {});
              if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">{t('admin.analytics.stats.noData')}</p>;
              const chartData = entries.map(([k, v]) => ({ name: EXP_LABELS[k] ?? k, value: v as number }));
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                    <Bar dataKey="value" name={t('admin.analytics.stats.usersBar')} fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>
        </div>
      </section>

      {/* ── Secção: Formação ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <Target className="h-3.5 w-3.5" /> {t('admin.analytics.sections.training')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Target}
            label={t('admin.analytics.stats.completionRate')}
            value={isLoading ? '—' : completionRate !== null ? `${completionRate}%` : '—'}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={TrendingUp}
            label={t('admin.analytics.stats.totalTrainings')}
            value={isLoading ? '—' : (analytics.trainingStats?.total ?? '—')}
            color="bg-softinsa-blue/10 text-softinsa-blue"
          />
          <StatCard
            icon={FileCheck}
            label={t('admin.analytics.stats.ongoing')}
            value={isLoading ? '—' : (analytics.trainingStats?.byStatus?.ongoing ?? '—')}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
        </div>
      </section>

      {/* ── Secção: Certificados ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <Award className="h-3.5 w-3.5" /> {t('admin.analytics.sections.certificates')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={FileCheck}
            label={t('admin.analytics.stats.totalCerts')}
            value={isLoading ? '—' : (analytics.certificateStats?.total ?? '—')}
            color="bg-softinsa-blue/10 text-softinsa-blue"
          />
          <StatCard
            icon={FileCheck}
            label={t('admin.analytics.stats.issuedThisMonth')}
            value={isLoading ? '—' : (analytics.certificateStats?.issuedThisMonth ?? '—')}
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={Calendar}
            label={t('admin.analytics.stats.expiring30d')}
            value={isLoading ? '—' : expiringIn30}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={Calendar}
            label={t('admin.analytics.stats.expiring6090d')}
            value={isLoading ? '—' : (analytics.certificateStats?.expiringIn31to60Days ?? '—')}
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          />
        </div>
      </section>

      {/* ── Secção: IA & Plataformas ──────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <Bot className="h-3.5 w-3.5" /> {t('admin.analytics.sections.aiPlatforms')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Bot}
            label={t('admin.analytics.stats.aiConversations30d')}
            value={isLoading ? '—' : (analytics.aiUsageStats?.conversationsLast30Days ?? '—')}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          />
          <StatCard
            icon={Bot}
            label={t('admin.analytics.stats.aiTotalMessages')}
            value={isLoading ? '—' : (analytics.aiUsageStats?.totalMessages ?? '—')}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          />
          <StatCard
            icon={Database}
            label={t('admin.analytics.stats.indexedCourses')}
            value={isLoading ? '—' : (analytics.platformStats?.totalIndexedCourses ?? '—')}
            color="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          />
          <StatCard
            icon={Database}
            label={t('admin.analytics.stats.activePlatforms')}
            value={isLoading ? '—' : (analytics.platformStats?.active ?? '—')}
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
        </div>
      </section>

      {/* ── Secção: Gráficos ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <TrendingUp className="h-3.5 w-3.5" /> {t('admin.analytics.sections.charts')}
        </h2>

        {/* Charts row 1 */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Bar: Cursos concluídos por mês */}
          <ChartCard title={t('admin.analytics.stats.completedByMonth')}>
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.completedByMonth.map((d) => ({ ...d, month: fmtMonth(d.month, dateLocale) }))} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" name={t('admin.analytics.stats.completedBar')} fill="#0057B7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Pie: Plataformas mais usadas */}
          <ChartCard title={t('admin.analytics.stats.mostUsedPlatforms')}>
            {isLoading ? <ChartSkeleton /> : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.platformUsage}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {analytics.platformUsage.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Line: Crescimento de utilizadores */}
          <ChartCard title={t('admin.analytics.charts.userGrowth')}>
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.userGrowth.map((d) => ({ ...d, month: fmtMonth(d.month, dateLocale) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t('admin.analytics.stats.usersBar')}
                    stroke="#0057B7"
                    strokeWidth={2.5}
                    dot={{ fill: '#0057B7', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Horizontal bar: Skills mais procuradas */}
          <ChartCard title={t('admin.analytics.charts.topSkills')}>
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  layout="vertical"
                  data={[...analytics.topSkills].sort((a, b) => b.count - a.count).slice(0, 6)}
                  barSize={16}
                  margin={{ left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" name={t('admin.analytics.stats.searchesBar')} fill="#45A5FF" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      {/* ── Secção: Alertas & Utilizadores Recentes ──────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
          <Calendar className="h-3.5 w-3.5" /> {t('admin.analytics.sections.alertsRecent')}
        </h2>

        {/* Expiring certificates table */}
        <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">{t('admin.analytics.certTable.title')}</h3>
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {t(analytics.expiringCertificates.length !== 1 ? 'admin.analytics.certTable.countPlural' : 'admin.analytics.certTable.countSingle', { count: analytics.expiringCertificates.length })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.certTable.columns.user')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.certTable.columns.course')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.certTable.columns.expiresIn')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.certTable.columns.urgency')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                ) : analytics.expiringCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      {t('admin.analytics.certTable.noResults')}
                    </td>
                  </tr>
                ) : (
                  [...analytics.expiringCertificates]
                    .sort((a, b) => a.daysLeft - b.daysLeft)
                    .map((cert, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{cert.userName || t('admin.users.noName', 'Sem Nome')}</td>
                        <td className="px-4 py-3 text-muted-foreground">{cert.courseName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(parseISO(cert.expirationDate), 'dd MMM yyyy', { locale: dateLocale })}
                        </td>
                        <td className="px-4 py-3">
                          <UrgencyBadge days={cert.daysLeft} />
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent users table */}
        {(analytics.recentUsers?.length ?? 0) > 0 && (
          <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">{t('admin.analytics.recentUsersTable.title')}</h3>
              <span className="rounded-full bg-softinsa-blue/10 px-2.5 py-0.5 text-xs font-semibold text-softinsa-blue">
                {t('admin.analytics.recentUsersTable.last', { n: analytics.recentUsers?.length })}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.recentUsersTable.columns.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.recentUsersTable.columns.email')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.recentUsersTable.columns.role')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.recentUsersTable.columns.serviceLine')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.analytics.recentUsersTable.columns.registered')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentUsers?.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-softinsa-blue/10 text-softinsa-blue text-xs font-bold">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-foreground">{u.name || t('admin.users.noName', 'Sem Nome')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.serviceLine ? (SERVICE_LINE_LABELS[u.serviceLine] ?? u.serviceLine) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(parseISO(u.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

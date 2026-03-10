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
import { TrendingUp, Users, Award, Calendar } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { AdminAnalytics } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ANALYTICS: AdminAnalytics = {
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
    { name: 'LinkedIn Learning', count: 30 },
    { name: 'Coursera', count: 15 },
    { name: 'Pluralsight', count: 10 },
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
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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

function fmtMonth(m: string) {
  try {
    return format(parseISO(`${m}-01`), 'MMM yy', { locale: pt });
  } catch {
    return m;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalyticsTab() {
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
    completedByMonth:     data?.completedByMonth     ?? MOCK_ANALYTICS.completedByMonth,
    platformUsage:        data?.platformUsage        ?? MOCK_ANALYTICS.platformUsage,
    userGrowth:           data?.userGrowth           ?? MOCK_ANALYTICS.userGrowth,
    topSkills:            data?.topSkills            ?? MOCK_ANALYTICS.topSkills,
    expiringCertificates: data?.expiringCertificates ?? MOCK_ANALYTICS.expiringCertificates,
  };

  const totalCompleted = analytics.completedByMonth.reduce((s, d) => s + d.count, 0);
  const totalUsers = analytics.userGrowth.at(-1)?.count ?? 0;
  const totalCerts = analytics.expiringCertificates.length;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Award} label="Cursos concluídos" value={isLoading ? '—' : totalCompleted} color="bg-softinsa-blue/10 text-softinsa-blue" />
        <StatCard icon={Users} label="Utilizadores ativos" value={isLoading ? '—' : totalUsers} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <StatCard icon={Calendar} label="Certs. a expirar" value={isLoading ? '—' : totalCerts} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatCard icon={TrendingUp} label="Skill mais pesquisada" value={isLoading ? '—' : (analytics.topSkills[0]?.skill ?? '—')} color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bar: Cursos concluídos por mês */}
        <ChartCard title="Cursos concluídos por mês">
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.completedByMonth.map((d) => ({ ...d, month: fmtMonth(d.month) }))} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                />
                <Bar dataKey="count" name="Concluídos" fill="#0057B7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Pie: Plataformas mais usadas */}
        <ChartCard title="Plataformas mais usadas">
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
        <ChartCard title="Crescimento de utilizadores">
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.userGrowth.map((d) => ({ ...d, month: fmtMonth(d.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Utilizadores"
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
        <ChartCard title="Skills mais procuradas">
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
                <Bar dataKey="count" name="Pesquisas" fill="#45A5FF" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Expiring certificates table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Certificados a expirar em breve</h3>
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {analytics.expiringCertificates.length} certificado{analytics.expiringCertificates.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilizador</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expira em</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Urgência</th>
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
                    Nenhum certificado a expirar brevemente.
                  </td>
                </tr>
              ) : (
                [...analytics.expiringCertificates]
                  .sort((a, b) => a.daysLeft - b.daysLeft)
                  .map((cert, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{cert.userName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cert.courseName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(parseISO(cert.expirationDate), 'dd MMM yyyy', { locale: pt })}
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
    </div>
  );
}

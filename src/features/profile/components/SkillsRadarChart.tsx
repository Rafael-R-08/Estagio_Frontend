import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { UserSkill } from '@/types';

const LEVEL_VALUE: Record<UserSkill['level'], number> = {
  iniciante: 33,
  intermedio: 66,
  experiente: 100,
};

const MAX_SKILLS = 9;

export function SkillsRadarChart({ skills }: { skills: UserSkill[] }) {
  const { t } = useTranslation();

  if (skills.length < 3) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground/60 italic">
        {t('profile.skillsChart.needMore')}
      </p>
    );
  }

  const displayed = [...skills]
    .sort((a, b) => LEVEL_VALUE[b.level] - LEVEL_VALUE[a.level])
    .slice(0, MAX_SKILLS)
    .map((s) => ({
      skill: s.skillName,
      value: LEVEL_VALUE[s.level],
      fullMark: 100,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={displayed}>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.35} />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
          />
          <Radar
            name={t('profile.skillsChart.proficiency', 'Proficiência')}
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.22}
            strokeWidth={2}
            dot={{ r: 3, fill: 'hsl(var(--primary))' } as object}
          />
          <Tooltip
            formatter={(val: any) => {
              const numVal = Number(val) || 0;
              const label =
                numVal <= 33
                  ? t('profile.skillsSection.levelBeginner', 'Iniciante')
                  : numVal <= 66
                  ? t('profile.skillsSection.levelIntermediate', 'Intermédio')
                  : t('profile.skillsSection.levelExperienced', 'Experiente');
              return [label, t('profile.skillsChart.level', 'Nível')];
            }}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

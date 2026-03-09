import { Sparkles, Award, BookOpen, Brain, Clock, X } from 'lucide-react';
import type { User } from '@/types';

// ─── Shortcut presets ─────────────────────────────────────────────────────────

const SHORTCUTS = [
  {
    icon: Sparkles,
    label: 'Cursos recomendados',
    query: 'Recomenda cursos para o meu perfil e stack tecnológica atual',
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: Award,
    label: 'Certificações em falta',
    query: 'Quais certificações importantes devo obter para a minha área?',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: BookOpen,
    label: 'Plataformas de aprendizagem',
    query: 'Que plataformas de aprendizagem me recomendas para o meu nível?',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Brain,
    label: 'Plano de carreira',
    query: 'Cria um plano de aprendizagem estruturado para os próximos 3 meses',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (query: string) => void;
  user?: User;
  recentQueries: string[];
  onClearRecent: () => void;
}

// ─── SuggestionsPanel ─────────────────────────────────────────────────────────

export function SuggestionsPanel({ onSelect, user, recentQueries, onClearRecent }: Props) {
  const skills = user?.techStack ?? [];

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-5">
      {/* Shortcuts */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atalhos rápidos
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => onSelect(s.query)}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition hover:border-primary/30 hover:bg-muted/40 active:scale-[0.98]"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${s.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground">{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            As tuas skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => onSelect(`Recomenda cursos avançados de ${skill}`)}
                className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
              >
                {skill}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recentes
            </h3>
            <button
              onClick={onClearRecent}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 transition hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          </div>
          <ul className="space-y-1">
            {recentQueries.map((q, i) => (
              <li key={i}>
                <button
                  onClick={() => onSelect(q)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                >
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{q}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length === 0 && recentQueries.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/50">
          Completa o teu perfil para ver sugestões personalizadas.
        </p>
      )}
    </div>
  );
}

import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Level badge config ───────────────────────────────────────────────────────

export type LevelFilter = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: { value: LevelFilter; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Iniciante',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'intermediate', label: 'Intermédio',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'advanced',     label: 'Avançado',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
}

export interface Filters {
  platforms: string[];   // platform names
  levels: LevelFilter[];
}

interface FilterSidebarProps {
  platforms: Platform[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

// ─── Checkbox helper ──────────────────────────────────────────────────────────

function FilterCheckbox({
  label,
  checked,
  onChange,
  badge,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted/50">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
            checked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background',
          )}
          onClick={() => onChange(!checked)}
        >
          {checked && (
            <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {badge}
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FilterSidebar({
  platforms,
  filters,
  onChange,
}: FilterSidebarProps) {
  const activeCount = filters.platforms.length + filters.levels.length;
  const hasActiveFilters = activeCount > 0;

  const togglePlatform = (name: string) => {
    const next = filters.platforms.includes(name)
      ? filters.platforms.filter((p) => p !== name)
      : [...filters.platforms, name];
    onChange({ ...filters, platforms: next });
  };

  const toggleLevel = (level: LevelFilter) => {
    const next = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    onChange({ ...filters, levels: next });
  };

  const reset = () => onChange({ platforms: [], levels: [] });

  return (
    <div className="w-56 shrink-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Platforms */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Plataformas
        </p>
        {platforms.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">Nenhuma disponível</p>
        ) : (
          platforms.map((p) => (
            <FilterCheckbox
              key={p.id}
              label={p.name}
              checked={filters.platforms.includes(p.name)}
              onChange={() => togglePlatform(p.name)}
            />
          ))
        )}
      </div>

      {/* Difficulty level */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nível
        </p>
        {LEVELS.map((l) => (
          <FilterCheckbox
            key={l.value}
            label={l.label}
            checked={filters.levels.includes(l.value)}
            onChange={() => toggleLevel(l.value)}
            badge={
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', l.color)}>
                {l.label[0]}
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
}

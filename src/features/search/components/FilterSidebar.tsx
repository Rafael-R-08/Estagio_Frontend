import { SlidersHorizontal, RotateCcw, Star } from 'lucide-react';
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
  isFree?: boolean;
  minRating?: number;
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
  const safePlatforms = Array.isArray(platforms) ? platforms : [];
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

  const reset = () => onChange({ platforms: [], levels: [], isFree: undefined, minRating: undefined });

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
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Plataformas
        </p>
        {safePlatforms.length === 0 ? (
          <p className="px-2 text-[11px] font-medium text-muted-foreground">Nenhuma disponível</p>
        ) : (
          safePlatforms.map((p) => (
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
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Nível
        </p>
        {LEVELS.map((l) => (
          <FilterCheckbox
            key={l.value}
            label={l.label}
            checked={filters.levels.includes(l.value)}
            onChange={() => toggleLevel(l.value)}
            badge={
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', l.color)}>
                {l.label[0]}
              </span>
            }
          />
        ))}
      </div>

      {/* Price */}
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Preço
        </p>
        {[
          { label: 'Todos os Preços', value: undefined },
          { label: 'Grátis', value: true },
          { label: 'Pago', value: false },
        ].map((opt, i) => (
          <label key={i} className="flex flex-row items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-muted/50 cursor-pointer text-[13px] font-medium text-foreground">
            <input 
              type="radio" 
              className="h-4 w-4 border-muted text-foreground focus:ring-foreground/20 accent-foreground"
              name="price-filter"
              checked={filters.isFree === opt.value}
              onChange={() => onChange({ ...filters, isFree: opt.value })}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Minimum Rating */}
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Avaliação Mínima
        </p>
        <div className="flex gap-2 px-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange({ ...filters, minRating: filters.minRating === star ? undefined : star })}
              className={cn(
                "transition hover:scale-110",
                (filters.minRating || 0) >= star ? "text-amber-500" : "text-border hover:text-amber-500/50"
              )}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
        </div>
        <p className="px-2 pt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground opacity-70">
          {filters.minRating ? `${filters.minRating} ou mais estrelas` : 'Qualquer avaliação'}
        </p>
      </div>
    </div>
  );
}

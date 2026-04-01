import { SlidersHorizontal, RotateCcw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Level badge config ───────────────────────────────────────────────────────

export type LevelFilter = 'beginner' | 'intermediate' | 'advanced';

const LEVELS: { value: LevelFilter; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Iniciante',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'intermediate', label: 'Intermédio',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'advanced',     label: 'Avançado',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

const LANGUAGES = [
  { value: undefined, label: 'Todos' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
}

export interface Filters {
  platforms: string[];   // platform names
  level?: LevelFilter;
  isFree?: boolean;
  minInternalRating?: number;
  minRelevance?: number;
  language?: 'pt' | 'en';
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
  const activeCount = 
    filters.platforms.length + 
    (filters.level ? 1 : 0) + 
    (filters.isFree !== undefined ? 1 : 0) + 
    (filters.minInternalRating ? 1 : 0) + 
    (filters.minRelevance ? 1 : 0) + 
    (filters.language ? 1 : 0);
  const hasActiveFilters = activeCount > 0;

  const togglePlatform = (name: string) => {
    const next = filters.platforms.includes(name)
      ? filters.platforms.filter((p) => p !== name)
      : [...filters.platforms, name];
    onChange({ ...filters, platforms: next });
  };

  const setLevel = (level: LevelFilter | undefined) => {
    onChange({ ...filters, level: filters.level === level ? undefined : level });
  };

  const reset = () => onChange({ 
    platforms: [], 
    level: undefined, 
    isFree: undefined, 
    minInternalRating: undefined,
    minRelevance: undefined,
    language: undefined
  });

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
        <div className="flex flex-col gap-1">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition text-xs font-bold",
                filters.level === l.value 
                  ? "bg-foreground text-background" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span>{l.label}</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider',
                filters.level === l.value ? 'bg-background/20 text-background' : l.color
              )}>
                {l.value[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Idioma
        </p>
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.label}
              onClick={() => onChange({ ...filters, language: lang.value as any })}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                filters.language === lang.value 
                  ? "bg-foreground text-background shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
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

      {/* Classificação Colegas (Internal Rating) */}
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Classificação Colegas
        </p>
        <div className="flex gap-2 px-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange({ ...filters, minInternalRating: filters.minInternalRating === star ? undefined : star })}
              className={cn(
                "transition hover:scale-110",
                (filters.minInternalRating || 0) >= star ? "text-amber-500" : "text-border hover:text-amber-500/50"
              )}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
        </div>
        <p className="px-2 pt-3 text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground opacity-60">
          {filters.minInternalRating ? `${filters.minInternalRating} ou mais estrelas` : 'Qualquer classificação'}
        </p>
      </div>

      {/* Relevância Softinsa (Internal Relevance) */}
      <div className="rounded-[1.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-4 space-y-1">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">
          Relevância Softinsa
        </p>
        <div className="flex gap-2 px-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange({ ...filters, minRelevance: filters.minRelevance === star ? undefined : star })}
              className={cn(
                "transition hover:scale-110",
                (filters.minRelevance || 0) >= star ? "text-blue-500" : "text-border hover:text-blue-500/50"
              )}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
        </div>
        <p className="px-2 pt-3 text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground opacity-60">
          {filters.minRelevance ? `${filters.minRelevance} ou mais relevância` : 'Qualquer relevância'}
        </p>
      </div>
    </div>
  );
}

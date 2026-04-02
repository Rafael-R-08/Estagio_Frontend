import { SlidersHorizontal, RotateCcw, Star, ChevronDown, Check, Globe, DollarSign, BarChart3, Layers } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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


// ─── Main component ───────────────────────────────────────────────────────────

// ─── Dropdown Component ──────────────────────────────────────────────────────

function FilterDropdown({
  label,
  icon: Icon,
  active,
  children,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300',
          active
            ? 'border-primary bg-primary/5 text-primary shadow-sm'
            : 'border-border/60 bg-background/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground',
          isOpen && 'border-foreground/20 bg-background/60 shadow-md translate-y-[-1px]'
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground/60')} />
        {label}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] max-h-[300px] overflow-y-auto rounded-2xl border border-border/60 bg-background/90 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">
          {children}
        </div>
      )}
    </div>
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
    <div className="flex flex-wrap items-center gap-3 w-full py-2">
      {/* Platform Dropdown */}
      <FilterDropdown 
        label="Plataformas" 
        icon={Layers} 
        active={filters.platforms.length > 0}
      >
        <div className="space-y-1 p-1">
          {safePlatforms.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-muted-foreground">Nenhuma plataforma encontrada</p>
          ) : (
            safePlatforms.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition italic",
                  filters.platforms.includes(p.name) ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                )}
              >
                {p.name}
                {filters.platforms.includes(p.name) && <Check className="h-3.5 w-3.5" />}
              </button>
            ))
          )}
        </div>
      </FilterDropdown>

      {/* Level Dropdown */}
      <FilterDropdown 
        label="Nível" 
        icon={BarChart3} 
        active={!!filters.level}
      >
        <div className="space-y-1 p-1">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition",
                filters.level === l.value ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
            >
              {l.label}
              {filters.level === l.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Language Dropdown */}
      <FilterDropdown 
        label="Idioma" 
        icon={Globe} 
        active={!!filters.language}
      >
        <div className="space-y-1 p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.label}
              onClick={() => onChange({ ...filters, language: lang.value as any })}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition",
                filters.language === lang.value ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
            >
              {lang.label}
              {filters.language === lang.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Price Dropdown */}
      <FilterDropdown 
        label="Preço" 
        icon={DollarSign} 
        active={filters.isFree !== undefined}
      >
        <div className="space-y-1 p-1">
          {[
            { label: 'Todos os Preços', value: undefined },
            { label: 'Grátis', value: true },
            { label: 'Pago', value: false },
          ].map((opt, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...filters, isFree: opt.value })}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition",
                filters.isFree === opt.value ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
            >
              {opt.label}
              {filters.isFree === opt.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Ratings Dropdown */}
      <FilterDropdown 
        label="Classificação" 
        icon={Star} 
        active={!!filters.minInternalRating}
      >
        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Mínimo de estrelas</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onChange({ ...filters, minInternalRating: filters.minInternalRating === star ? undefined : star })}
                className={cn(
                  "transition-all duration-300 hover:scale-125",
                  (filters.minInternalRating || 0) >= star ? "text-amber-500" : "text-border hover:text-amber-500/50"
                )}
              >
                <Star className={cn("h-6 w-6", (filters.minInternalRating || 0) >= star && "fill-current")} />
              </button>
            ))}
          </div>
        </div>
      </FilterDropdown>

      {/* Relevance Dropdown */}
      <FilterDropdown 
        label="Relevância" 
        icon={SlidersHorizontal} 
        active={!!filters.minRelevance}
      >
        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Mínimo de relevância</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onChange({ ...filters, minRelevance: filters.minRelevance === star ? undefined : star })}
                className={cn(
                  "transition-all duration-300 hover:scale-125",
                  (filters.minRelevance || 0) >= star ? "text-blue-500" : "text-border hover:text-blue-500/50"
                )}
              >
                <Star className={cn("h-6 w-6", (filters.minRelevance || 0) >= star && "fill-current")} />
              </button>
            ))}
          </div>
        </div>
      </FilterDropdown>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={reset}
          className="ml-auto flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          Limpar ({activeCount})
        </button>
      )}
    </div>
  );
}

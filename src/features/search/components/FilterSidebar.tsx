import { SlidersHorizontal, RotateCcw, Star, ChevronDown, Check, Globe, DollarSign, BarChart3, Layers, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────────────────────────────

export type LevelFilter = 'beginner' | 'intermediate' | 'advanced';

const LEVEL_VALUES: LevelFilter[] = ['beginner', 'intermediate', 'advanced'];
const LANGUAGE_OPTIONS = [
  { value: undefined as 'pt' | 'en' | undefined, tKey: 'filter.languages.all' },
  { value: 'pt' as const, tKey: 'filter.languages.pt' },
  { value: 'en' as const, tKey: 'filter.languages.en' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
}

export interface Filters {
  platforms: string[];
  level?: LevelFilter;
  isFree?: boolean;
  /** Avaliação interna (dada pelos utilizadores na nossa plataforma ao concluir um curso) */
  minInternalRating?: number;
  /** Avaliação externa (rating da plataforma de origem, ex: Udemy 4.5★) */
  minExternalRating?: number;
  /** Relevância atribuída pelos utilizadores ao concluir um curso */
  minRelevance?: number;
  language?: 'pt' | 'en';
}

const EMPTY_FILTERS: Filters = {
  platforms: [],
  level: undefined,
  isFree: undefined,
  minInternalRating: undefined,
  minExternalRating: undefined,
  minRelevance: undefined,
  language: undefined,
};

interface FilterSidebarProps {
  platforms: Platform[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtersEqual(a: Filters, b: Filters): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function countFilters(f: Filters): number {
  return (
    f.platforms.length +
    (f.level ? 1 : 0) +
    (f.isFree !== undefined ? 1 : 0) +
    (f.minInternalRating ? 1 : 0) +
    (f.minExternalRating ? 1 : 0) +
    (f.minRelevance ? 1 : 0) +
    (f.language ? 1 : 0)
  );
}

// ─── Dropdown Component ───────────────────────────────────────────────────────

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

// ─── Star rating subcomponent ─────────────────────────────────────────────────

function StarPicker({
  value,
  color,
  onChange,
}: {
  value?: number;
  color: 'amber' | 'orange' | 'blue';
  onChange: (v: number | undefined) => void;
}) {
  const filled =
    color === 'amber'
      ? 'text-amber-500'
      : color === 'orange'
        ? 'text-orange-500'
        : 'text-blue-500';
  const hover =
    color === 'amber'
      ? 'hover:text-amber-500/50'
      : color === 'orange'
        ? 'hover:text-orange-500/50'
        : 'hover:text-blue-500/50';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(value === star ? undefined : star)}
          className={cn(
            'transition-all duration-300 hover:scale-125',
            (value || 0) >= star ? filled : `text-border ${hover}`,
          )}
        >
          <Star className={cn('h-6 w-6', (value || 0) >= star && 'fill-current')} />
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FilterSidebar({ platforms, filters, onChange }: FilterSidebarProps) {
  const { t } = useTranslation();
  const safePlatforms = Array.isArray(platforms) ? platforms : [];

  // Draft accumulates unpublished changes; only sent to parent on "Aplicar"
  const [draft, setDraft] = useState<Filters>(filters);

  // Sync draft when parent resets filters externally (e.g. "Limpar" from outside)
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const isPending = !filtersEqual(draft, filters);
  const appliedCount = countFilters(filters);
  const draftCount = countFilters(draft);

  const update = (partial: Partial<Filters>) => setDraft((d) => ({ ...d, ...partial }));

  const togglePlatform = (name: string) =>
    setDraft((d) => ({
      ...d,
      platforms: d.platforms.includes(name)
        ? d.platforms.filter((p) => p !== name)
        : [...d.platforms, name],
    }));

  const handleApply = () => onChange(draft);

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    onChange(EMPTY_FILTERS);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap w-full py-1">

      {/* Plataformas */}
      <FilterDropdown label={t('filter.platforms')} icon={Layers} active={draft.platforms.length > 0}>
        <div className="space-y-1 p-1">
          {safePlatforms.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-muted-foreground">{t('filter.noPlatforms')}</p>
          ) : (
            safePlatforms.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.name)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition italic',
                  draft.platforms.includes(p.name) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
                )}
              >
                {p.name}
                {draft.platforms.includes(p.name) && <Check className="h-3.5 w-3.5" />}
              </button>
            ))
          )}
        </div>
      </FilterDropdown>

      {/* Nível */}
      <FilterDropdown label={t('filter.level')} icon={BarChart3} active={!!draft.level}>
        <div className="space-y-1 p-1">
          {LEVEL_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => update({ level: draft.level === v ? undefined : v })}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition',
                draft.level === v ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
              )}
            >
              {t(`filter.levels.${v}`)}
              {draft.level === v && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Idioma */}
      <FilterDropdown label={t('filter.language')} icon={Globe} active={!!draft.language}>
        <div className="space-y-1 p-1">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.tKey}
              onClick={() => update({ language: lang.value })}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition',
                draft.language === lang.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
              )}
            >
              {t(lang.tKey)}
              {draft.language === lang.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Preço */}
      <FilterDropdown label={t('filter.price')} icon={DollarSign} active={draft.isFree !== undefined}>
        <div className="space-y-1 p-1">
          {([
            { label: t('filter.allPrices'), value: undefined },
            { label: t('filter.free'), value: true },
            { label: t('filter.paid'), value: false },
          ] as { label: string; value: boolean | undefined }[]).map((opt, i) => (
            <button
              key={i}
              onClick={() => update({ isFree: opt.value })}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium transition',
                draft.isFree === opt.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground',
              )}
            >
              {opt.label}
              {draft.isFree === opt.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </FilterDropdown>

      {/* Avaliação (externa — rating da plataforma de origem) */}
      <FilterDropdown label={t('filter.rating')} icon={Star} active={!!draft.minExternalRating}>
        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t('filter.platformRating')}
          </p>
          <StarPicker
            value={draft.minExternalRating}
            color="amber"
            onChange={(v) => update({ minExternalRating: v })}
          />
          <p className="text-[10px] text-muted-foreground/50">
            {t('filter.platformRatingDesc')}
          </p>
        </div>
      </FilterDropdown>

      {/* Avaliação Interna (dada pelos utilizadores da nossa plataforma) */}
      <FilterDropdown label={t('filter.internalRating')} icon={Star} active={!!draft.minInternalRating}>
        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t('filter.internalRatingMin')}
          </p>
          <StarPicker
            value={draft.minInternalRating}
            color="orange"
            onChange={(v) => update({ minInternalRating: v })}
          />
          <p className="text-[10px] text-muted-foreground/50">
            {t('filter.internalRatingDesc')}
          </p>
        </div>
      </FilterDropdown>

      {/* Relevância (atribuída pelos utilizadores) */}
      <FilterDropdown label={t('filter.relevance')} icon={SlidersHorizontal} active={!!draft.minRelevance}>
        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t('filter.relevanceMin')}
          </p>
          <StarPicker
            value={draft.minRelevance}
            color="blue"
            onChange={(v) => update({ minRelevance: v })}
          />
          <p className="text-[10px] text-muted-foreground/50">
            {t('filter.relevanceDesc')}
          </p>
        </div>
      </FilterDropdown>

      {/* Aplicar Filtros — só aparece quando há alterações por publicar */}
      {isPending && (
        <button
          onClick={handleApply}
          className="shrink-0 flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {t(draftCount > 0 ? 'filter.applyWithCount' : 'filter.apply', { count: draftCount })}
        </button>
      )}

      {/* Limpar filtros */}
      {(appliedCount > 0 || isPending) && (
        <button
          onClick={reset}
          className={cn(
            'shrink-0 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-destructive hover:text-white',
            isPending
              ? 'border-border/60 bg-background/40 text-muted-foreground'
              : 'border-destructive/20 bg-destructive/5 text-destructive',
          )}
        >
          <RotateCcw className="h-3 w-3" />
          {t(appliedCount > 0 ? 'filter.clearWithCount' : 'filter.clear', { count: appliedCount })}
        </button>
      )}
    </div>
  );
}

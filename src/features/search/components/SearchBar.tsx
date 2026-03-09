import { Search, X, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = 'Pesquisa cursos, temas, tecnologias…',
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when parent resets value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalValue(v);
    onChange(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (v.trim().length >= 2) onSearch(v.trim());
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && localValue.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSearch(localValue.trim());
    }
    if (e.key === 'Escape') {
      setLocalValue('');
      onChange('');
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-2xl border border-border bg-card shadow-sm',
        'transition-all focus-within:border-primary/60 focus-within:shadow-md focus-within:shadow-primary/10',
        className,
      )}
    >
      {/* Left icon */}
      <div className="pointer-events-none pl-4 pr-2 text-muted-foreground transition-colors group-focus-within:text-primary">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground/70',
          'outline-none',
        )}
      />

      {/* Clear button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted-foreground/20"
          aria-label="Limpar pesquisa"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Search button */}
      <button
        onClick={() => localValue.trim() && onSearch(localValue.trim())}
        className={cn(
          'mr-2 rounded-xl px-4 py-2 text-sm font-medium transition',
          localValue.trim()
            ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95'
            : 'cursor-default bg-muted text-muted-foreground',
        )}
        disabled={!localValue.trim()}
      >
        Pesquisar
      </button>
    </div>
  );
}

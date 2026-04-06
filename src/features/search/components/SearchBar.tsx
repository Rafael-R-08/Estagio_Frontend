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
        'group relative flex items-center rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl shadow-sm',
        'transition-all focus-within:border-foreground focus-within:shadow-xl focus-within:shadow-foreground/5 focus-within:-translate-y-0.5',
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
          'flex-1 bg-transparent py-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50',
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
          'mr-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all',
          localValue.trim()
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20'
            : 'cursor-default bg-muted text-muted-foreground',
        )}
        disabled={!localValue.trim()}
      >
        Pesquisar
      </button>
    </div>
  );
}

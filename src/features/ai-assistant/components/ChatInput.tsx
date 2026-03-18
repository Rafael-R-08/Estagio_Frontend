import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach?: (file: File) => void;
  loading: boolean;
}

const MAX_ROWS_PX = 120; // ~5 linhas

export function ChatInput({ value, onChange, onSend, onAttach, loading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Auto-resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && onAttach) onAttach(f);
    e.target.value = '';
  }

  const canSend = !loading && value.trim().length > 0;

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm ring-0 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
      {/* Attach button — disabled until backend supports file uploads */}
      <button
        type="button"
        disabled
        title="Anexar ficheiro (brevemente disponível)"
        className={cn(
          'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/30 transition',
          'cursor-not-allowed',
        )}
      >
        <Paperclip className="h-4 w-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder="Pergunta algo ao assistente IA… (Enter para enviar)"
        className={cn(
          'flex-1 resize-none bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground/60',
          'focus:outline-none disabled:opacity-50',
          'max-h-[120px] overflow-y-auto',
        )}
        style={{ lineHeight: '1.5' }}
      />

      {/* Send button */}
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        title="Enviar (Enter)"
        className={cn(
          'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
          canSend
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'bg-muted text-muted-foreground/40',
          'disabled:pointer-events-none',
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

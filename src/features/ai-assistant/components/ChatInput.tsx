import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, AtSign, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MentionableCourse } from '@/types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onAttach?: (file: File) => void;
  loading: boolean;
  mentionableCourses?: MentionableCourse[];
  mentionedIds?: string[];
  onMentionedIdsChange?: (ids: string[]) => void;
}

const MAX_ROWS_PX = 120; // ~5 linhas

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  onAttach,
  loading,
  mentionableCourses = [],
  mentionedIds = [],
  onMentionedIdsChange,
}: Props) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Auto-resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  // ── @mention detection ────────────────────────────────────────────────────
  const filteredCourses = mentionQuery !== null
    ? mentionableCourses.filter((c) =>
        c.title.toLowerCase().includes(mentionQuery.toLowerCase()),
      ).slice(0, 6)
    : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    onChange(text);

    // Detect if cursor is inside a @query
    const pos = e.target.selectionStart ?? text.length;
    const before = text.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1) {
      const afterAt = before.slice(atIdx + 1);
      // Only show dropdown if no space after @
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        setMentionStart(atIdx);
        setActiveIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  }

  function insertMention(course: MentionableCourse) {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
    const inserted = `@${course.title} `;
    onChange(before + inserted + after);
    setMentionQuery(null);

    if (onMentionedIdsChange && !mentionedIds.includes(course.id)) {
      onMentionedIdsChange([...mentionedIds, course.id]);
    }

    // Re-focus textarea after selection
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filteredCourses.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredCourses.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredCourses[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }

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
    <div className="relative">
      {/* @mention dropdown */}
      {mentionQuery !== null && filteredCourses.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-52 overflow-y-auto rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/40">
            <AtSign className="inline h-3 w-3 mr-1" />
            {t('aiChat.mentionCourse')}
          </div>
          {filteredCourses.map((course, idx) => (
            <button
              key={course.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent textarea blur
                insertMention(course);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                idx === activeIndex ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/40 text-muted-foreground',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{course.title}</p>
                {course.platform?.name && (
                  <p className="text-[10px] text-muted-foreground/60">{course.platform.name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mentioned courses badges — moved above for better visual stability */}
      {mentionedIds.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {mentionedIds.map((id) => {
            const course = mentionableCourses.find((c) => c.id === id);
            if (!course) return null;
            return (
              <span
                key={id}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary ring-1 ring-primary/20"
              >
                <AtSign className="h-2.5 w-2.5" />
                {course.title}
                <button
                  type="button"
                  onClick={() => onMentionedIdsChange?.(mentionedIds.filter((x) => x !== id))}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm ring-0 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        {/* Attach button — disabled until backend supports file uploads */}
        <button
          type="button"
          disabled
          title={t('aiChat.attachFileTitle')}
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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder={t('aiChat.inputPlaceholder')}
          className={cn(
            'flex-1 resize-none bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground/60',
            'focus:outline-none disabled:opacity-50',
            'max-h-[120px] overflow-y-auto',
          )}
          style={{ lineHeight: '1.5' }}
        />

        {/* Stop button (during streaming) or Send button */}
        {loading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            title={t('aiChat.stopTitle')}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 transition hover:opacity-90 active:scale-90"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            title={t('aiChat.sendTitle')}
            className={cn(
              'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
              canSend
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-90'
                : 'bg-muted text-muted-foreground/40',
              'disabled:pointer-events-none',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}


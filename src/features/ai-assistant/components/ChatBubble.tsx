import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, FileText, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { AiMessage, RagSource } from '@/types';

// ─── Loading dots ─────────────────────────────────────────────────────────────

export function LoadingBubble() {
  return (
    <div className="flex items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3.5 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Source chips ─────────────────────────────────────────────────────────────

function SourceChips({ sources }: { sources: RagSource[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 2);

  return (
    <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        Context Sources ({sources.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((src) => (
          <div
            key={src.id}
            title={src.content}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/60"
          >
            <FileText className="h-3 w-3 shrink-0 opacity-50" />
            <span className="max-w-[180px] truncate text-[11px] font-medium">{src.content.slice(0, 60)}…</span>
            <span className="ml-1 shrink-0 font-black text-primary/70">
              {Math.round(src.similarity * 100)}%
            </span>
          </div>
        ))}
        {sources.length > 2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary transition hover:bg-primary/5"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> {t('common.less') || 'Less'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> +{sources.length - 2} {t('common.more') || 'More'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 800;

export function ChatBubble({ message }: { message: AiMessage }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const displayContent = message.content || '';
  const isUser = message.role === 'user';
  const isLong = displayContent.length > COLLAPSE_THRESHOLD;
  const truncatedContent =
    isLong && !expanded ? displayContent.slice(0, COLLAPSE_THRESHOLD) + '…' : displayContent;

  const timestampStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <div className="flex justify-end pr-2 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-[2.2rem] rounded-br-[0.5rem] bg-foreground px-6 py-4 text-sm font-medium leading-relaxed text-background shadow-xl break-words">
            {truncatedContent}
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-background/60 transition hover:text-background"
              >
                {expanded ? t('common.less') : t('common.more')}
              </button>
            )}
          </div>
          <p className="mt-2 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 px-2">
            {timestampStr}
          </p>
        </div>
      </div>
    );
  }

  // ── Assistant bubble ─────────────────────────────────────────────────────
  return (
    <div className="flex items-end gap-3 pl-2 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.2rem] bg-blue-600 text-white shadow-lg shadow-blue-600/20 group">
        <Bot className={cn("h-5 w-5 transition-transform duration-500", message.isStreaming && "scale-110 animate-pulse")} />
      </div>
      <div className="max-w-[88%] sm:max-w-[80%]">
        <div className={cn(
          "relative rounded-[2.5rem] rounded-bl-[0.5rem] border border-border/60 bg-card/60 px-7 py-6 shadow-2xl backdrop-blur-xl transition-all duration-300",
          message.isStreaming && "ring-2 ring-primary/5"
        )}>
          {/* Pulsing indicator for active streaming */}
          {message.isStreaming && !displayContent && (
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3 w-3 animate-pulse text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
                {t('ai.generating') || 'Reflecting...'}
              </span>
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1.5 transition-all duration-500">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 text-[13.5px] font-medium text-slate-700 dark:text-slate-300">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-extrabold text-foreground underline-offset-4 decoration-primary/20">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc pl-5 space-y-1.5 last:mb-0 marker:text-primary/60 font-medium text-slate-700 dark:text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol
                    style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}
                    className="mb-4 space-y-1.5 last:mb-0 font-medium text-slate-700 dark:text-slate-300"
                  >
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li style={{ display: 'list-item' }} className="pl-1 text-[13px]">{children}</li>,
                code: ({ children }) => (
                  <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono font-black text-primary border border-border/40">
                    {children}
                  </code>
                ),
              }}
            >
              {truncatedContent}
            </ReactMarkdown>

            {/* Blinking cursor effect at end of stream content */}
            {message.isStreaming && displayContent && (
              <span className="inline-block h-3.5 w-1.5 animate-pulse bg-primary/40 ml-1 rounded-full align-middle" />
            )}
          </div>

          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition hover:text-foreground"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" />{t('common.less')}</>
              ) : (
                <><ChevronDown className="h-3 w-3" />{t('common.more')}</>
              )}
            </button>
          )}

          {message.sources && message.sources.length > 0 && (
            <SourceChips sources={message.sources} />
          )}
        </div>
        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 px-2 flex items-center gap-2">
          {timestampStr}
          {message.isStreaming && <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />}
        </p>
      </div>
    </div>
  );
}

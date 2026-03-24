import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { AiMessage, RagSource } from '@/types';

// ─── Loading dots ─────────────────────────────────────────────────────────────

export function LoadingBubble() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3.5 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Source chips ─────────────────────────────────────────────────────────────

function SourceChips({ sources }: { sources: RagSource[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 2);

  return (
    <div className="mt-2.5 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Fontes ({sources.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((src) => (
          <div
            key={src.id}
            title={src.content}
            className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span className="max-w-[180px] truncate">{src.content.slice(0, 60)}…</span>
            <span className="ml-1 shrink-0 font-medium text-blue-600 dark:text-blue-400">
              {Math.round(src.similarity * 100)}%
            </span>
          </div>
        ))}
        {sources.length > 2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-blue-600 dark:text-blue-400 transition hover:opacity-80"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> +{sources.length - 2} mais
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 480;

export function ChatBubble({ message }: { message: AiMessage }) {
  const [expanded, setExpanded] = useState(false);

  const isUser = message.role === 'user';
  const isLong = message.content.length > COLLAPSE_THRESHOLD;
  const displayContent =
    isLong && !expanded ? message.content.slice(0, COLLAPSE_THRESHOLD) + '…' : message.content;

  if (isUser) {
    return (
      <div className="flex justify-end pr-2">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-[2rem] rounded-br-[0.5rem] bg-foreground px-6 py-4 text-sm font-medium leading-relaxed text-background shadow-2xl break-words">
            {displayContent}
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-2 inline-flex items-center gap-0.5 text-xs font-black text-background/60 transition hover:text-background"
              >
                {expanded ? (
                  <><ChevronUp className="h-3 w-3" />Menos</>
                ) : (
                  <><ChevronDown className="h-3 w-3" />Ver mais</>
                )}
              </button>
            )}
          </div>
          <p className="mt-2 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {new Date(message.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  // ── Assistant bubble ─────────────────────────────────────────────────────
  return (
    <div className="flex items-end gap-3 pl-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-foreground text-background shadow-xl">
        <Bot className="h-5 w-5" />
      </div>
      <div className="max-w-[85%] sm:max-w-[80%]">
        <div className="rounded-[2.5rem] rounded-bl-[0.5rem] border border-border/60 bg-background/60 px-6 py-5 shadow-2xl backdrop-blur-2xl">
          <div className="text-sm leading-relaxed text-foreground break-words overflow-hidden">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap">{children}</p>,
                strong: ({ children }) => <strong className="font-black text-foreground">{children}</strong>,
                ul: ({ children }) => <ul className="mb-4 list-disc pl-5 last:mb-0 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 last:mb-0 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                a: ({ href, children }) => (
                  <a href={href} className="text-foreground font-black underline underline-offset-4 hover:opacity-70 transition-opacity break-all" target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-background/40 px-2 py-0.5 rounded-md text-xs text-foreground font-mono font-bold">
                    {children}
                  </code>
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition hover:text-foreground"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" />Ver menos</>
              ) : (
                <><ChevronDown className="h-3 w-3" />Ver mais</>
              )}
            </button>
          )}
          {message.sources && message.sources.length > 0 && (
            <SourceChips sources={message.sources} />
          )}
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
          {new Date(message.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

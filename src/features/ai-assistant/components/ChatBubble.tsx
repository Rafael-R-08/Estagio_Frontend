import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, FileText } from 'lucide-react';
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
            <span className="ml-1 shrink-0 font-medium text-primary/70">
              {Math.round(src.similarity * 100)}%
            </span>
          </div>
        ))}
        {sources.length > 2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-primary/70 transition hover:text-primary"
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
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
            {displayContent}
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-primary-foreground/70 transition hover:text-primary-foreground"
              >
                {expanded ? (
                  <><ChevronUp className="h-3 w-3" />Menos</>
                ) : (
                  <><ChevronDown className="h-3 w-3" />Ver mais</>
                )}
              </button>
            )}
          </div>
          <p className="mt-1 text-right text-[10px] text-muted-foreground/50">
            {new Date(message.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  // ── Assistant bubble ─────────────────────────────────────────────────────
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {displayContent}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-0.5 text-xs font-medium text-primary/70 transition hover:text-primary"
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
        <p className="mt-1 text-[10px] text-muted-foreground/50">
          {new Date(message.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

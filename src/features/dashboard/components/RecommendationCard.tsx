import { Sparkles, RefreshCw, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RagResponse } from '@/types';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function RecommendationSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/4" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

// ─── Source chips ─────────────────────────────────────────────────────────────

function SourceChip({ content }: { content: string }) {
  const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;
  return (
    <span
      className="inline-block max-w-full rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
      title={content}
    >
      {preview}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RecommendationCardProps {
  data?: RagResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function RecommendationCard({
  data,
  isLoading,
  isError,
  onRetry,
}: RecommendationCardProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recomendações IA</h2>
            <p className="text-xs text-muted-foreground">Personalizado com base no teu perfil</p>
          </div>
        </div>
        {!isLoading && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <RecommendationSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Não foi possível carregar recomendações</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verifica se o Ollama está a correr localmente.
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma recomendação disponível.</p>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* AI answer — preserve whitespace / line breaks */}
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {data.answer}
          </p>

          {/* Sources toggle */}
          {data.sources && data.sources.length > 0 && (
            <div>
              <button
                onClick={() => setShowSources((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline"
              >
                {showSources ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {showSources ? 'Ocultar' : 'Ver'} {data.sources.length} fonte
                {data.sources.length !== 1 ? 's' : ''}
              </button>

              {showSources && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.sources.map((s) => (
                    <SourceChip key={s.id} content={s.content} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer link */}
          <a
            href="/ai"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline"
          >
            Abrir Assistente IA completo
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

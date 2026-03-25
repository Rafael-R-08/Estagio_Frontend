import { Sparkles, RefreshCw, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Target, TrendingUp, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
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

// ─── AI Parser ────────────────────────────────────────────────────────────────

interface ParsedSection {
  title: string;
  content: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

function parseBlocks(text?: any) {
  const result = { intro: '', sections: [] as ParsedSection[], outro: '' };
  if (!text) return result;

  const categories = [
    {
      id: 'interests',
      keywords: ['interest', 'interesse', 'exploração', 'explore', 'curiosidade'],
      defaultTitle: 'Interesses e Exploração',
      icon: Lightbulb,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-100 dark:border-amber-500/20'
    },
    {
      id: 'improvement',
      keywords: ['improve', 'melhorar', 'aprofundar', 'deepen', 'expert', 'avançado', 'current', 'atuais'],
      defaultTitle: 'Melhorar Skills Atuais',
      icon: TrendingUp,
      iconColor: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-500/10',
      borderColor: 'border-green-100 dark:border-green-500/20'
    },
    {
      id: 'missing_skills',
      keywords: ['missing', 'falta', 'gap', 'perfil', 'profile', 'service line', 'necessário'],
      defaultTitle: 'Skills em Falta (Perfil/SL)',
      icon: Target,
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-100 dark:border-blue-500/20'
    }
  ];

  // Case A: Structured object from backend
  if (typeof text === 'object' && !Array.isArray(text)) {
    categories.forEach(cat => {
      // Map potential field names: interests, improvement, missing_skills
      const content = text[cat.id] || text[cat.id.replace('_', '')] || text[cat.defaultTitle.toLowerCase()];
      if (content && typeof content === 'string') {
        result.sections.push({
          title: cat.defaultTitle,
          content: content,
          icon: cat.icon,
          iconColor: cat.iconColor,
          bgColor: cat.bgColor,
          borderColor: cat.borderColor
        });
      }
    });

    if (text.intro) result.intro = text.intro;
    if (text.outro) result.outro = text.outro;

    // If we have sections, we are done
    if (result.sections.length > 0) return result;
    
    // Otherwise fallback if it's just a generic object
    if (text.answer || text.recommendations) {
       return parseBlocks(text.recommendations || text.answer);
    }
  }

  // Case B: Raw Markdown string
  if (typeof text !== 'string') return result;

  let intro = '';
  let outro = '';
  const sections: ParsedSection[] = [];

  let mainContent = text;
  // Extract footer early
  const footerRegex = /\n(---|___|_Histórico|\*Histórico|Histórico considerado)/i;
  const footerMatch = mainContent.match(footerRegex);
  if (footerMatch !== null && footerMatch.index !== undefined) {
    outro = mainContent.substring(footerMatch.index).trim();
    mainContent = mainContent.substring(0, footerMatch.index);
  }

  const lines = mainContent.split('\n');
  let currentSection: ParsedSection | null = null;
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is a category header
    const isListItem = /^[-*+]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed);
    const noFormatting = trimmed.replace(/^[#\s]+|\*\*|__$/g, '').trim();
    const endsWithSentencePunctuation = /[.;!?]$/.test(noFormatting);
    
    const isHeaderFormat = 
      !isListItem && 
      trimmed.length < 80 && 
      !endsWithSentencePunctuation && 
      (
        /^#+\s/.test(trimmed) || 
        /^\*\*.*?\*\*[:]*$/.test(trimmed) || 
        trimmed.split(' ').length <= 6
      );

    if (trimmed && isHeaderFormat && !trimmed.toLowerCase().startsWith('reason:')) {
      const matchedCategory = categories.find(c => 
        c.keywords.some(k => trimmed.toLowerCase().includes(k))
      );

      if (matchedCategory) {
        // Save the previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').replace(/^(\d+)\)\s+/gm, '$1. ').trim();
          sections.push(currentSection);
        } else if (currentContent.length > 0) {
          intro += currentContent.join('\n') + '\n\n';
        }

        currentSection = {
          title: matchedCategory.defaultTitle,
          content: '',
          icon: matchedCategory.icon,
          iconColor: matchedCategory.iconColor,
          bgColor: matchedCategory.bgColor,
          borderColor: matchedCategory.borderColor
        };
        currentContent = [];
        continue;
      }
    }

    if (trimmed) {
      currentContent.push(line);
    } else if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
      currentContent.push(''); // Preserve paragraph breaks
    }
  }

  // Push the final section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').replace(/^(\d+)\)\s+/gm, '$1. ').trim();
    sections.push(currentSection);
  } else if (currentContent.length > 0) {
    intro += currentContent.join('\n').trim();
  }

  // Merge sections with the same title
  const mergedSections = sections.reduce((acc: ParsedSection[], curr) => {
    const existing = acc.find(s => s.title === curr.title);
    if (existing) {
      existing.content = (existing.content + '\n\n' + curr.content).trim();
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  // In case the parser failed to find any headers, fallback to dump everything in intro
  if (mergedSections.length === 0 && !intro) {
    intro = mainContent;
  }

  return { intro: intro.trim(), sections: mergedSections, outro: outro.trim() };
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
  const [activeIndex, setActiveIndex] = useState(0);
  const parsedResponse = parseBlocks(data?.recommendations || data?.answer);

  return (
    <div className="rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-xl overflow-hidden shadow-lg shadow-foreground/5 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-8 py-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Recomendações IA</h2>
            <p className="text-lg font-bold text-foreground">Personalizado para o teu perfil</p>
          </div>
        </div>
        {!isLoading && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:bg-foreground hover:text-background"
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
              Ocorreu um erro ao contactar o serviço de recomendações.
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
        <div className="p-5 space-y-6">
          {/* Intro text if any */}
          {parsedResponse.intro && (
            <div className="text-sm leading-relaxed text-foreground px-3">
              <ReactMarkdown>{parsedResponse.intro}</ReactMarkdown>
            </div>
          )}

          {/* Section Tabs */}
          {parsedResponse.sections.length > 0 ? (
            <div className="flex flex-col gap-4">
              {/* Tabs switcher */}
              {parsedResponse.sections.length > 1 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {parsedResponse.sections.map((section, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                        activeIndex === idx
                          ? cn(section.bgColor, section.iconColor, "border shadow-sm", section.borderColor)
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/80 border border-transparent"
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Active Tab Card */}
              {(() => {
                const section = parsedResponse.sections[activeIndex] || parsedResponse.sections[0];
                if (!section) return null;
                
                return (
                  <div 
                    key={activeIndex}
                    className={cn(
                      "rounded-[2rem] border p-7 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-2", 
                      section.borderColor, 
                      section.bgColor
                    )}
                  >
                    <div className="flex items-center gap-3.5 mb-5">
                      <div className={cn("p-2.5 rounded-2xl bg-background/50 backdrop-blur-sm shadow-sm", section.iconColor)}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <h3 className={cn("text-lg font-black tracking-tight", section.iconColor)}>
                        {section.title}
                      </h3>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                          ul: ({ children }) => <ul className="mb-3 list-disc pl-5 last:mb-0 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 last:mb-0 space-y-1">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          a: ({ href, children }) => (
                            <a href={href} className="text-primary font-bold hover:underline" target="_blank" rel="noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-foreground px-3">
              <ReactMarkdown>{data.recommendations || data.answer || ''}</ReactMarkdown>
            </div>
          )}

          {/* Outro / Footer AI text */}
          {parsedResponse.outro && (
            <div className="text-[11px] italic leading-relaxed text-muted-foreground/60 pt-2 px-3 border-t border-border/40">
              <ReactMarkdown>{parsedResponse.outro.replace(/^---/, '').trim()}</ReactMarkdown>
            </div>
          )}

          {/* Sources and Footer links */}
          <div className="flex flex-col gap-4 pt-2">
            {data.sources && data.sources.length > 0 && (
              <div className="px-3">
                <button
                  onClick={() => setShowSources((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary transition hover:underline"
                >
                  {showSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showSources ? 'Ocultar' : 'Ver'} {data.sources?.length ?? 0} fonte{data.sources?.length !== 1 ? 's' : ''}
                </button>

                {showSources && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.sources?.map((s) => (
                      <SourceChip key={s.id} content={s.content} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="px-3 pb-2">
              <a
                href="/ai"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:underline"
              >
                Abrir Assistente IA completo
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Target, TrendingUp, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RagResponse } from '@/types';

// ─── Componentes Partilhados ──────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function RecommendationSkeleton() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex gap-2">
         <Skeleton className="h-8 w-24 rounded-full" />
         <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="space-y-2 pt-4">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
}

function SourceChip({ content, similarity }: { content: string, similarity?: number }) {
  const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground/70"
      title={content}
    >
      <span className="max-w-[150px] truncate">{preview}</span>
      {similarity !== undefined && (
        <span className="font-black text-primary border-l border-border/40 pl-1.5 ml-0.5">
          {Math.round(similarity * 100)}%
        </span>
      )}
    </span>
  );
}

interface ParsedSection {
  id: string;
  title: string;
  shortTitle: string;
  content: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
}

interface UnifiedRecommendationCardProps {
  data?: RagResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

// ─── Main Component: UnifiedRecommendationCard ────────────────────────────────

export function UnifiedRecommendationCard({
  data,
  isLoading,
  isError,
  onRetry,
}: UnifiedRecommendationCardProps) {
  const { t } = useTranslation();
  const [showSources, setShowSources] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (!data) return [];
    
    // Ordered categories to be shown exactly as the user requested
    const categories = [
      {
        id: 'improvement',
        title: t('dashboard.recs.career.title', 'Performance & Carreira'),
        shortTitle: t('dashboard.recs.career.short', 'Performance'),
        icon: TrendingUp,
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/10',
        borderColor: 'border-emerald-100/60 dark:border-emerald-500/20'
      },
      {
        id: 'interests',
        title: t('dashboard.recs.interests.title', 'Novos Horizontes'),
        shortTitle: t('dashboard.recs.interests.short', 'Horizontes'),
        icon: Lightbulb,
        iconColor: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-50/50 dark:bg-amber-500/10',
        borderColor: 'border-amber-100/60 dark:border-amber-500/20'
      },
      {
        id: 'missing_skills',
        title: t('dashboard.recs.skills.title', 'Gaps de Perfil / Skills'),
        shortTitle: t('dashboard.recs.skills.short', 'Skills & Gaps'),
        icon: Target,
        iconColor: 'text-blue-500 dark:text-blue-400',
        bgColor: 'bg-blue-50/50 dark:bg-blue-500/10',
        borderColor: 'border-blue-100/60 dark:border-blue-500/20'
      }
    ];

    const result: ParsedSection[] = [];
    
    categories.forEach(cat => {
      const content = data[cat.id as keyof RagResponse];
      if (typeof content === 'string' && content.trim()) {
        result.push({
          ...cat,
          content: content.trim()
        });
      }
    });

    return result;
  }, [data, t]);

  const currentTab = activeTab || (sections.length > 0 ? sections[0].id : null);
  const activeSection = sections.find(s => s.id === currentTab) || sections[0];
  const hasContent = sections.length > 0;

  // ─── Conditional Rendering ───

  if (isLoading) return <div className="rounded-[2.5rem] border border-border/60 bg-muted/10 h-80"><RecommendationSkeleton /></div>;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-destructive/20 bg-destructive/5 py-16 px-8 text-center backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{t('dashboard.recs.error.title', 'Falha nas recomendações')}</p>
          <p className="text-xs text-muted-foreground opacity-70">{t('dashboard.recs.error.subtitle', 'Ocorreu um erro ao contactar o motor RAG.')}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="rounded-full bg-foreground px-6 py-2.5 text-xs font-black text-background transition hover:opacity-90 active:scale-95">
            {t('common.retry', 'TENTAR NOVAMENTE')}
          </button>
        )}
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-border/60 bg-muted/10 py-16 px-8 text-center backdrop-blur-sm grayscale opacity-60">
        <Sparkles className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[240px]">
          {t('dashboard.recs.empty', 'Ainda não foram geradas recomendações para o teu perfil atual.')}
        </p>
      </div>
    );
  }

  // ─── Main View ───
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/40 shadow-xl shadow-foreground/5 transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/10">
      {/* Decorative gradient overlay */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all duration-700 group-hover:bg-primary/10" />
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border/40 px-6 sm:px-8 py-6 relative z-10 bg-background/20">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform duration-500 group-hover:scale-110">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              {t('dashboard.recs.label', 'Insights Inclusivos')}
            </h2>
            <p className="text-base sm:text-xl font-black tracking-tight text-foreground">
              {t('dashboard.recs.unifiedTitle', 'Recomendações Personalizadas')}
            </p>
          </div>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-90" title="Atualizar recomendações">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Body (Tabs + Content) ── */}
      <div className="flex flex-col relative z-10 transition-all duration-500">
        
        {/* Swipable Tabs (Horizontal scroll on mobile, flex row on desktop) */}
        {sections.length > 1 && (
          <div className="flex gap-2 p-4 px-6 sm:px-8 overflow-x-auto scrollbar-hide border-b border-border/20 bg-muted/10">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300",
                  currentTab === s.id 
                    ? cn("shadow-md border border-current/20", s.bgColor, s.iconColor)
                    : "bg-background border border-border/60 text-muted-foreground hover:bg-muted/80"
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="inline sm:hidden">{s.shortTitle}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Area - Fluid Height Without Scroll */}
        <div className="px-6 sm:px-8 py-6 min-h-[16rem]">
           {activeSection && (
             <div 
               key={activeSection.id} 
               className={cn("rounded-[2rem] border-2 p-6 sm:p-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2", activeSection.borderColor, activeSection.bgColor)}
              >
               <div className="mb-6 flex items-center gap-3">
                  <div className={cn("rounded-2xl bg-background/80 p-2.5 shadow-sm", activeSection.iconColor)}>
                    <activeSection.icon className="h-5 w-5" />
                  </div>
                  <h3 className={cn("text-lg sm:text-xl font-black tracking-tight", activeSection.iconColor)}>
                    {activeSection.title}
                  </h3>
               </div>

               <div className="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1.5 transition-all duration-300">
                 <ReactMarkdown
                   components={{
                     p: ({ children }) => <p className="mb-4 text-[14px] font-medium text-slate-700 dark:text-slate-300 last:mb-0 leading-[1.6]">{children}</p>,
                     strong: ({ children }) => <strong className="font-extrabold text-foreground">{children}</strong>,
                     li: ({ children }) => <li className="text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-[1.6]">{children}</li>,
                     a: ({ href, children }) => (
                       <a href={href} className="font-black text-primary hover:underline underline-offset-4 decoration-2" target="_blank" rel="noreferrer">
                         {children}
                       </a>
                     ),
                   }}
                 >
                   {activeSection.content}
                 </ReactMarkdown>
               </div>
             </div>
           )}
        </div>

        {/* ── Footer / Sources ── */}
        <div className="mt-2 flex flex-col gap-5 px-6 sm:px-8 pb-8">
           {data?.sources && data.sources.length > 0 && (
             <div className="space-y-4">
                <button
                  onClick={() => setShowSources(v => !v)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 transition hover:text-primary"
                >
                  {showSources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showSources ? t('common.hideSources', 'Ocultar Fontes RAG') : `${t('common.view', 'Ver')} ${data.sources.length} ${t('common.dataSources', 'Fontes de Dados')}`}
                </button>

                {showSources && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {data.sources.map(s => <SourceChip key={s.id} content={s.content} similarity={s.similarity} />)}
                  </div>
                )}
             </div>
           )}

           <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-border/40 pt-6 gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Context-Aware RAG Engine
              </div>
              <a
                href="/ai"
                className="group/btn inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto w-full"
              >
                {t('dashboard.recs.openAi', 'Abrir Assistente')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}

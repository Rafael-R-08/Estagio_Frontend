import { Sparkles, Award, BookOpen, Brain, Clock, X, MessageSquare, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, AiConversation } from '@/types';

// ─── Shortcut presets ─────────────────────────────────────────────────────────

const SHORTCUTS = [
  {
    icon: Sparkles,
    label: 'Cursos recomendados',
    query: 'Recomenda cursos para o meu perfil e stack tecnológica atual',
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: Award,
    label: 'Certificações em falta',
    query: 'Quais certificações importantes devo obter para a minha área?',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: BookOpen,
    label: 'Plataformas de aprendizagem',
    query: 'Que plataformas de aprendizagem me recomendas para o meu nível?',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Brain,
    label: 'Plano de carreira',
    query: 'Cria um plano de aprendizagem estruturado para os próximos 3 meses',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (query: string) => void;
  user?: User;
  recentQueries: string[];
  onClearRecent: () => void;
  conversations: AiConversation[];
  onSelectConversation: (conv: AiConversation) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  currentConversationId?: string;
}

// ─── SuggestionsPanel ─────────────────────────────────────────────────────────

export function SuggestionsPanel({ 
  onSelect, 
  user, 
  recentQueries, 
  onClearRecent,
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  currentConversationId
}: Props) {
  const skills = user?.techStack ?? [];

  return (
    <div className="flex flex-col gap-8 overflow-y-auto p-6">
      {/* Shortcuts */}
      <section>
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Sugestões IA
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.query}
                onClick={() => onSelect(s.query)}
                className="group flex items-center gap-4 rounded-[1.5rem] border border-border/60 bg-background/40 p-3 text-left transition-all hover:bg-background/80 hover:shadow-xl active:scale-[0.98]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-110`}>
                  <Icon className={`h-5 w-5`} />
                </div>
                <span className="text-xs font-black tracking-tight text-foreground leading-tight">{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section>
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Focar nas tuas Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => onSelect(`Recomenda cursos avançados de ${skill}`)}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
              >
                {skill}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* New Chat */}
      <section>
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          Nova Conversa
        </button>
      </section>

      {/* History */}
      {conversations.length > 0 && (
        <section>
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Histórico de Conversas
          </h3>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border border-transparent p-1 transition-all",
                  currentConversationId === conv.id ? "bg-background/80 border-border/60 shadow-sm" : "hover:bg-background/40"
                )}
              >
                <button
                  onClick={() => onSelectConversation(conv)}
                  className="flex flex-1 items-center gap-3 px-3 py-2 text-left transition-all"
                >
                  <MessageSquare className={cn("h-4 w-4 shrink-0 opacity-40", currentConversationId === conv.id && "text-primary opacity-100")} />
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[11px] font-bold line-clamp-1",
                      currentConversationId === conv.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {conv.title || 'Sem título'}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-tighter">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/30 opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  title="Eliminar conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Recentes
            </h3>
            <button
              onClick={onClearRecent}
              className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 transition hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          </div>
          <ul className="space-y-2">
            {recentQueries.map((q, i) => (
              <li key={i}>
                <button
                  onClick={() => onSelect(q)}
                  className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-xs font-bold text-muted-foreground transition hover:bg-background/80 hover:text-foreground border border-transparent hover:border-border/60"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{q}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length === 0 && recentQueries.length === 0 && (
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 py-10">
          Personaliza o teu perfil para obter sugestões IA.
        </p>
      )}
    </div>
  );
}

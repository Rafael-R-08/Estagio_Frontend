import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, PanelRight, PanelRightClose, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { recommendationsApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { AiMessage } from '@/types';

import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { SuggestionsPanel } from '../components/SuggestionsPanel';

// ─── localStorage helpers ─────────────────────────────────────────────────────

const RECENT_KEY_PREFIX = 'ai-assistant:recent-queries:';
const MAX_RECENT = 8;

function loadRecent(userId?: string): string[] {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY_PREFIX + userId) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(userId: string, q: string, current: string[]): string[] {
  const next = [q, ...current.filter((x) => x !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY_PREFIX + userId, JSON.stringify(next));
  return next;
}

// ─── Message factory ──────────────────────────────────────────────────────────

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── AiAssistantPage ─────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initializedRef = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (user?.id) {
      setRecentQueries(loadRecent(user.id));
    }
  }, [user?.id]);

  // ── Initial recommendations ──────────────────────────────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    let cancelled = false;

    // Show welcome message
    const fallbackTimer = setTimeout(() => {
      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        setMessages([
          {
            id: makeId(),
            role: 'assistant',
            content: `Olá${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋 ${t('ai.welcomeMessage')}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }, 3000);

    // Call dynamic welcome endpoint
    recommendationsApi.getWelcome().then((res) => {
      clearTimeout(fallbackTimer);
      if (cancelled || initializedRef.current) return;
      initializedRef.current = true;

      const contentStr = res.data.welcome || res.data.answer || t('ai.welcomeMessage');
      
      const assistantMessage: AiMessage = {
        id: makeId(),
        role: 'assistant',
        content: contentStr,
        timestamp: new Date().toISOString(),
        sources: res.data.sources,
      };

      setMessages([assistantMessage]);
    }).catch(() => {
      // fallback handles this
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll during streaming ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Stream handler ────────────────────────────────────────────────────────
  const sendQuery = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // Cancel previous if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;

      const msgUserId = makeId();
      const assistantMsgId = makeId();

      // Build history (limit to last 10 messages for token efficiency)
      const history = messages
        .filter((m) => !m.isLoading && m.content)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        { id: msgUserId, role: 'user', content: text, timestamp: new Date().toISOString() },
        { 
          id: assistantMsgId, 
          role: 'assistant', 
          content: '', 
          timestamp: new Date().toISOString(), 
          isStreaming: true 
        },
      ]);

      if (user?.id) {
        setRecentQueries((prev) => saveRecent(user.id, text, prev));
      }

      setIsTyping(true);

      try {
        const token = localStorage.getItem('auth-token');
        const apiBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
        
        const response = await fetch(`${apiBase}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
          },
          body: JSON.stringify({ 
            query: text, 
            history,
            language: i18n.language // Pass current UI language (pt-PT or en)
          }),
          signal: ctrl.signal,
        });

        if (!response.ok) throw new Error('Falha na ligação ao assistente');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Não foi possível ler o stream');

        const decoder = new TextDecoder();
        let accumulatedText = '';
        let sources: any[] = [];

        // Robust SSE Loop
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                accumulatedText += data.text;
                // Batch updates to avoid too many re-renders
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }
              if (data.sources) {
                sources = data.sources;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, sources }
                      : m
                  )
                );
              }
            } catch (e) {
              // Partial JSON chunks can be ignored until completion
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setMessages((prev) => 
            prev.map((m) => 
              m.id === assistantMsgId 
                ? { ...m, content: (m.content || '') + '\n\n**[Geração interrompida]**', isStreaming: false } 
                : m
            )
          );
          return;
        }
        toast.error(t('ai.errorSend'));
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
        setMessages((prev) => 
          prev.map((m) => m.id === assistantMsgId ? { ...m, isStreaming: false } : m)
        );
      }
    },
    [messages, user?.id, t, i18n.language, isTyping],
  );

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    sendQuery(text);
  }, [inputValue, sendQuery]);

  const handleSelectSuggestion = useCallback(
    (query: string) => {
      setSidebarOpen(false);
      sendQuery(query);
    },
    [sendQuery],
  );

  function handleClearRecent() {
    if (!user?.id) return;
    localStorage.removeItem(RECENT_KEY_PREFIX + user.id);
    setRecentQueries([]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card/40 px-6 py-5 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-foreground text-background shadow-xl">
              <Bot className="h-6 w-6" />
            </div>
            {isTyping && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground shadow-sm">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-foreground uppercase opacity-70">{t('ai.title')}</h1>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              {isTyping ? <span className="animate-pulse">A escrever...</span> : 'AI Assistant · RAG Engine'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? t('ai.closePanel') : t('ai.openPanel')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-90"
        >
          {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Chat column ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 pt-5 pb-32 md:pb-6 scroll-smooth scrollbar-hide">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-muted/20">
                  <Bot className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground opacity-40 uppercase tracking-widest">{t('ai.preparingAssistant')}</p>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{t('ai.loadingModel')}</p>
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-4" />
          </div>

          {/* Input bar */}
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur-md">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              loading={isTyping}
            />
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
              {t('ai.disclaimer')}
            </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          className={cn(
            'w-80 shrink-0 flex-col border-l border-border bg-card/20 transition-all duration-300 backdrop-blur-xl',
            sidebarOpen ? 'flex' : 'hidden md:flex opacity-0 pointer-events-none w-0',
          )}
        >
          <SuggestionsPanel
            onSelect={handleSelectSuggestion}
            user={user ?? undefined}
            recentQueries={recentQueries}
            onClearRecent={handleClearRecent}
          />
        </div>

        {/* ── Mobile overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm border-l border-border bg-card shadow-2xl">
              <SuggestionsPanel
                onSelect={(q) => {
                  handleSelectSuggestion(q);
                  setSidebarOpen(false);
                }}
                user={user ?? undefined}
                recentQueries={recentQueries}
                onClearRecent={handleClearRecent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

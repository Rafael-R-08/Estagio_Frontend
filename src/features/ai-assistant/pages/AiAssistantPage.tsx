import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, PanelRight, PanelRightClose } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { recommendationsApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { AiMessage } from '@/types';

import { ChatBubble, LoadingBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { SuggestionsPanel } from '../components/SuggestionsPanel';

// ─── localStorage helpers ─────────────────────────────────────────────────────

const RECENT_KEY = 'ai-assistant:recent-queries';
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(q: string, current: string[]): string[] {
  const next = [q, ...current.filter((x) => x !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

// ─── Message factory ──────────────────────────────────────────────────────────

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── AiAssistantPage ─────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>(loadRecent);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initializedRef = useRef(false);

  // ── Initial recommendations (direct fetch to avoid type gymnastics) ──────
  useEffect(() => {
    if (initializedRef.current) return;
    let cancelled = false;

    // Show welcome message after 3s if API is slow
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
    }, 3500);

    recommendationsApi.getForMe().then((res) => {
      clearTimeout(fallbackTimer);
      if (cancelled || initializedRef.current) return;
      initializedRef.current = true;
      setMessages([
        {
          id: makeId(),
          role: 'assistant',
          content: res.data.answer ?? '',
          timestamp: new Date().toISOString(),
          sources: res.data.sources,
        },
      ]);
    }).catch(() => {
      // fallback timer handles this case
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send mutation ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (query: string) => recommendationsApi.postForMe(query),
  });

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || sendMutation.isPending) return;

    const userId = makeId();
    const loadingId = makeId();

    // Add user + loading messages immediately
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', content: text, timestamp: new Date().toISOString() },
      { id: loadingId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true },
    ]);
    setInputValue('');
    setRecentQueries((prev) => saveRecent(text, prev));

    sendMutation.mutate(text, {
      onSuccess: (res) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  id: loadingId,
                  role: 'assistant',
                  content: res.data.answer,
                  timestamp: new Date().toISOString(),
                  sources: res.data.sources,
                }
              : m,
          ),
        );
      },
      onError: () => {
        toast.error(t('ai.errorSend'));
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      },
    });
  }, [inputValue, sendMutation]);

  const handleSelectSuggestion = useCallback((query: string) => {
    setInputValue(query);
    // Focus textarea handled by setting value; user can press Enter
  }, []);

  function handleClearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecentQueries([]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{t('ai.title')}</h1>
            <p className="text-xs text-muted-foreground">Powered by Ollama · RAG</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? t('ai.closePanel') : t('ai.openPanel')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Chat column ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 pt-5 pb-28 md:pb-6">
            {messages.map((msg) =>
              msg.isLoading ? (
                <LoadingBubble key={msg.id} />
              ) : (
                <ChatBubble key={msg.id} message={msg} />
              ),
            )}

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">A preparar o assistente…</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ollama está a carregar o modelo.</p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background/95 px-6 py-3 backdrop-blur-sm">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              loading={sendMutation.isPending}
            />
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
              O assistente pode cometer erros. Verifica informações importantes.
            </p>
          </div>
        </div>

        {/* ── Right sidebar (desktop) ── */}
        <div
          className={cn(
            'hidden md:flex w-72 shrink-0 flex-col border-l border-border bg-background transition-all duration-200',
            sidebarOpen ? 'translate-x-0' : 'hidden',
          )}
        >
          <SuggestionsPanel
            onSelect={(q) => {
              handleSelectSuggestion(q);
              // Also send immediately
              const userId = makeId();
              const loadingId = makeId();
              setMessages((prev) => [
                ...prev,
                { id: userId, role: 'user', content: q, timestamp: new Date().toISOString() },
                { id: loadingId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true },
              ]);
              setRecentQueries((prev) => saveRecent(q, prev));
              sendMutation.mutate(q, {
                onSuccess: (res) => {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === loadingId
                        ? { id: loadingId, role: 'assistant', content: res.data.answer, timestamp: new Date().toISOString(), sources: res.data.sources }
                        : m,
                    ),
                  );
                },
                onError: () => {
                  toast.error('Erro ao contactar o assistente.');
                  setMessages((prev) => prev.filter((m) => m.id !== loadingId));
                },
              });
            }}
            user={user ?? undefined}
            recentQueries={recentQueries}
            onClearRecent={handleClearRecent}
          />
        </div>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-4/5 max-w-xs border-l border-border bg-background">
              <SuggestionsPanel
                onSelect={(q) => {
                  handleSelectSuggestion(q);
                  const userId = makeId();
                  const loadingId = makeId();
                  setMessages((prev) => [
                    ...prev,
                    { id: userId, role: 'user', content: q, timestamp: new Date().toISOString() },
                    { id: loadingId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true },
                  ]);
                  setRecentQueries((prev) => saveRecent(q, prev));
                  sendMutation.mutate(q, {
                    onSuccess: (res) => {
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === loadingId
                            ? { id: loadingId, role: 'assistant', content: res.data.answer, timestamp: new Date().toISOString(), sources: res.data.sources }
                            : m,
                        ),
                      );
                    },
                    onError: () => {
                      toast.error('Erro ao contactar o assistente.');
                      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
                    },
                  });
                  setSidebarOpen(false);
                }}
                user={user ?? undefined}
                recentQueries={recentQueries}
                onClearRecent={() => {
                  handleClearRecent();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

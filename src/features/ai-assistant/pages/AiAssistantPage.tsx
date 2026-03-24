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
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user?.id) {
      setRecentQueries(loadRecent(user.id));
    }
  }, [user?.id]);

  // ── Initial recommendations (direct fetch to avoid type gymnastics) ──────
  useEffect(() => {
    if (initializedRef.current) return;
    let cancelled = false;

    // Show welcome message after 3.5s if API is slow
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
    mutationFn: ({ query, history }: { query: string; history: { role: 'user' | 'assistant'; content: string }[] }) =>
      recommendationsApi.postForMe(query, history),
  });

  // ── Centralised send function (used in all 3 places) ──────────────────────
  const sendQuery = useCallback(
    (text: string) => {
      if (!text.trim() || sendMutation.isPending) return;

      const msgUserId = makeId();
      const loadingId = makeId();

      // Build history from current messages (exclude loading bubbles)
      const history = messages
        .filter((m) => !m.isLoading && m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        { id: msgUserId, role: 'user', content: text, timestamp: new Date().toISOString() },
        { id: loadingId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true },
      ]);

      if (user?.id) {
        setRecentQueries((prev) => saveRecent(user.id, text, prev));
      }

      sendMutation.mutate(
        { query: text, history },
        {
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
        },
      );
    },
    [messages, sendMutation, user?.id, t],
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/60 px-6 py-5 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-foreground text-background shadow-xl">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-foreground uppercase opacity-70">{t('ai.title')}</h1>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Ollama · RAG Engine</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? t('ai.closePanel') : t('ai.openPanel')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/40 border border-border/60 text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-90"
        >
          {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
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
                  <p className="text-sm font-semibold text-foreground">{t('ai.preparingAssistant')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('ai.loadingModel')}</p>
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
              {t('ai.disclaimer')}
            </p>
          </div>
        </div>

        {/* ── Right sidebar (desktop) — fixed toggle logic ── */}
        <div
          className={cn(
            'w-72 shrink-0 flex-col border-l border-border bg-background transition-all duration-200',
            sidebarOpen ? 'flex' : 'hidden',
          )}
        >
          <SuggestionsPanel
            onSelect={handleSelectSuggestion}
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

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, PanelRight, PanelRightClose, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { recommendationsApi, chatApi } from '@/services/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import type { AiMessage, AiConversation, MentionableCourse } from '@/types';

import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { SuggestionsPanel } from '../components/SuggestionsPanel';

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
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initializedRef = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [mentionableCourses, setMentionableCourses] = useState<MentionableCourse[]>([]);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  // ─── Fetch History ────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatApi.listConversations();
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      return [] as AiConversation[];
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      void fetchConversations();
      chatApi.getMentionableCourses()
        .then((res) => setMentionableCourses(Array.isArray(res.data) ? res.data : []))
        .catch(() => {/* non-critical */});
    }
  }, [user?.id, fetchConversations]);

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

    // Call dynamic welcome endpoint — GET /ai/recommendations/welcome → { welcome: string }
    recommendationsApi.getWelcome().then((res) => {
      clearTimeout(fallbackTimer);
      if (cancelled || initializedRef.current) return;
      initializedRef.current = true;

      const content = res.data?.welcome || t('ai.welcomeMessage');

      setMessages([{
        id: makeId(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      }]);
    }).catch(() => {
      // fallback timer handles this
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
    async (text: string, overrideMentionedIds?: string[]) => {
      if (!text.trim() || isTyping) return;

      const activeMentionedIds = overrideMentionedIds ?? mentionedIds;

      // Cancel previous if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;

      const msgUserId = makeId();
      const assistantMsgId = makeId();

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

      setIsTyping(true);
      setMentionedIds([]);

      try {
        const token = storage.getToken();
        const apiBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');

        const response = await fetch(`${apiBase}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
          },
          body: JSON.stringify({
            prompt: text,
            conversationId,
            mentionedTrainingIds: activeMentionedIds.length > 0 ? activeMentionedIds : undefined,
          }),
          signal: ctrl.signal,
        });

        if (!response.ok) throw new Error('Falha na ligação ao assistente');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Não foi possível ler o stream');

        const decoder = new TextDecoder();
        let accumulatedText = '';
        let sources: any[] = [];
        let sseBuffer = '';
        let nextConversationId = conversationId || undefined;

        const appendAssistantText = (textChunk: string, convId?: string) => {
          if (!textChunk) return;
          accumulatedText += textChunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulatedText, conversationId: convId || nextConversationId }
                : m,
            ),
          );
        };

        const applySources = (nextSources: unknown) => {
          if (!Array.isArray(nextSources)) return;
          sources = nextSources;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, sources } : m)),
          );
        };

        const handlePayload = (rawPayload: string) => {
          if (!rawPayload) return false;
          if (rawPayload === '[DONE]') return true;

          try {
            const data = JSON.parse(rawPayload);

            const chunkConversationId =
              typeof data?.conversationId === 'string' ? data.conversationId : undefined;
            if (chunkConversationId) {
              nextConversationId = chunkConversationId;
            }

            const textChunk =
              typeof data?.text === 'string'
                ? data.text
                : typeof data?.answer === 'string'
                  ? data.answer
                  : typeof data?.chunk === 'string'
                    ? data.chunk
                    : '';

            if (textChunk) {
              appendAssistantText(textChunk, chunkConversationId);
            }

            applySources(data?.sources);
          } catch {
            // Backend SSE currently streams plain text chunks.
            appendAssistantText(rawPayload);
          }

          return false;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const frames = sseBuffer.split('\n\n');
          sseBuffer = frames.pop() || '';

          let shouldStop = false;
          for (const frame of frames) {
            const payload = frame
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => {
                const dataPart = line.slice(5);
                return dataPart.startsWith(' ') ? dataPart.slice(1) : dataPart;
              })
              .join('\n');

            if (handlePayload(payload)) {
              shouldStop = true;
              break;
            }
          }

          if (shouldStop) break;
        }

        if (sseBuffer.trim()) {
          const tailPayload = sseBuffer
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => {
              const dataPart = line.slice(5);
              return dataPart.startsWith(' ') ? dataPart.slice(1) : dataPart;
            })
            .join('\n');

          handlePayload(tailPayload);
        }

        const refreshed = await fetchConversations();
        if (nextConversationId) {
          setConversationId(nextConversationId);
        } else if (refreshed[0]?.id) {
          setConversationId(refreshed[0].id);
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
    [user?.id, t, isTyping, conversationId, mentionedIds, fetchConversations],
  );

  const handleStartNewChat = useCallback(() => {
    setConversationId(null);
    setMentionedIds([]);
    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content: `Ok, vamos começar uma nova conversa! Como posso ajudar hoje?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      if (conversationId === id) {
        handleStartNewChat();
      }
      void fetchConversations();
      toast.success('Conversa eliminada');
    } catch (err) {
      toast.error('Erro ao eliminar conversa');
    }
  }, [conversationId, fetchConversations, handleStartNewChat]);

  const handleSelectConversation = useCallback(async (conv: AiConversation) => {
    setConversationId(conv.id);
    setSidebarOpen(false);
    setMentionedIds([]);

    // Optimistic loading placeholder
    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      },
    ]);

    try {
      const res = await chatApi.getConversationMessages(conv.id);
      const loaded = res.data.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt,
      }));
      setMessages(
        loaded.length > 0
          ? loaded
          : [
              {
                id: makeId(),
                role: 'assistant' as const,
                content: `**${conv.title || 'Conversa'}** — ainda sem mensagens. Como posso ajudar?`,
                timestamp: new Date().toISOString(),
              },
            ],
      );
    } catch {
      setMessages([
        {
          id: makeId(),
          role: 'assistant',
          content: `Conversa retomada: **${conv.title || 'Sem título'}**. Como posso ajudar?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    sendQuery(text, mentionedIds);
  }, [inputValue, mentionedIds, sendQuery]);

  const handleSelectSuggestion = useCallback(
    (query: string) => {
      setSidebarOpen(false);
      sendQuery(query);
    },
    [sendQuery],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card/40 px-6 py-5 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-blue-600 text-white shadow-xl shadow-blue-600/20">
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
              mentionableCourses={mentionableCourses}
              mentionedIds={mentionedIds}
              onMentionedIdsChange={setMentionedIds}
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
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewChat={handleStartNewChat}
            currentConversationId={conversationId ?? undefined}
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
                conversations={conversations}
                onSelectConversation={(c) => {
                  handleSelectConversation(c);
                  setSidebarOpen(false);
                }}
                onDeleteConversation={handleDeleteConversation}
                onNewChat={handleStartNewChat}
                currentConversationId={conversationId ?? undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

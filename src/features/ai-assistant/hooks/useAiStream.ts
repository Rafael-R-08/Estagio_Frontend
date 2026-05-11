import { useCallback, useRef, useState } from 'react';
import { storage } from '@/lib/storage';
import type { RagSource } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamOptions {
  prompt: string;
  conversationId?: string | null;
  mentionedTrainingIds?: string[];
}

export interface StreamCallbacks {
  /** Called once before the stream starts (to add the user + placeholder messages). */
  onStart: (userMsgId: string, assistantMsgId: string) => void;
  /** Called on each text chunk received from the server. */
  onChunk: (assistantMsgId: string, accumulatedText: string, conversationId?: string) => void;
  /** Called when sources arrive (may be called multiple times). */
  onSources: (assistantMsgId: string, sources: RagSource[]) => void;
  /** Called when the stream finishes successfully. */
  onDone: (assistantMsgId: string, finalConversationId?: string) => void;
  /** Called when generation is aborted by the user. */
  onAbort: (assistantMsgId: string, partialText: string) => void;
  /** Called on network / parsing errors. */
  onError: (assistantMsgId: string) => void;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const API_BASE = () =>
  (import.meta.env.VITE_API_URL as string | undefined || '/api').trim().replace(/\/+$/, '');

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAiStream
 *
 * Handles the full SSE streaming lifecycle for the AI chat endpoint.
 * The hook is intentionally "headless" — UI state management (messages array,
 * conversationId, etc.) remains in the calling component; this hook only drives
 * the stream and calls the provided callbacks.
 *
 * Endpoint: POST /ai/chat/stream
 * Protocol: Server-Sent Events (SSE) over a single HTTP response body.
 *
 * Each SSE frame is expected to be one of:
 *   data: {"text":"<chunk>","conversationId":"<id>"}   ← text delta
 *   data: {"sources":[…]}                              ← RAG sources
 *   data: [DONE]                                       ← stream end signal
 *
 * Plain-text chunks (no JSON wrapper) are also accepted for backwards
 * compatibility with earlier backend versions.
 */
export function useAiStream() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // ── Stop (abort) ──────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ── Stream ────────────────────────────────────────────────────────────────
  const stream = useCallback(
    async (options: StreamOptions, callbacks: StreamCallbacks) => {
      const { prompt, conversationId, mentionedTrainingIds } = options;

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;

      const userMsgId = makeId();
      const assistantMsgId = makeId();

      callbacks.onStart(userMsgId, assistantMsgId);
      setIsStreaming(true);

      let accumulatedText = '';
      let nextConversationId = conversationId ?? undefined;

      try {
        const token = storage.getToken();
        const apiBase = API_BASE();

        const response = await fetch(`${apiBase}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
          },
          body: JSON.stringify({
            prompt,
            conversationId: conversationId ?? undefined,
            mentionedTrainingIds:
              mentionedTrainingIds && mentionedTrainingIds.length > 0
                ? mentionedTrainingIds
                : undefined,
          }),
          signal: ctrl.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream not available');

        const decoder = new TextDecoder();
        let sseBuffer = '';

        // ── Frame handler ─────────────────────────────────────────────────
        const handlePayload = (rawPayload: string): boolean => {
          if (!rawPayload) return false;
          if (rawPayload === '[DONE]') return true;

          try {
            const data = JSON.parse(rawPayload) as Record<string, unknown>;

            const chunkConversationId =
              typeof data.conversationId === 'string' ? data.conversationId : undefined;
            if (chunkConversationId) {
              nextConversationId = chunkConversationId;
            }

            // Text delta — backends may use: text | answer | chunk
            const textChunk =
              typeof data.text === 'string'
                ? data.text
                : typeof data.answer === 'string'
                  ? data.answer
                  : typeof data.chunk === 'string'
                    ? data.chunk
                    : '';

            if (textChunk) {
              accumulatedText += textChunk;
              callbacks.onChunk(assistantMsgId, accumulatedText, chunkConversationId);
            }

            // RAG sources
            if (Array.isArray(data.sources)) {
              callbacks.onSources(assistantMsgId, data.sources as RagSource[]);
            }
          } catch {
            // Backend sent a plain-text chunk (no JSON wrapper)
            if (rawPayload.trim()) {
              accumulatedText += rawPayload;
              callbacks.onChunk(assistantMsgId, accumulatedText);
            }
          }

          return false;
        };

        // ── Read loop ─────────────────────────────────────────────────────
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });

          // Split on the double-newline SSE frame delimiter
          const frames = sseBuffer.split('\n\n');
          sseBuffer = frames.pop() ?? '';

          let shouldStop = false;
          for (const frame of frames) {
            const payload = frame
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => {
                const rest = line.slice(5); // strip "data:"
                return rest.startsWith(' ') ? rest.slice(1) : rest;
              })
              .join('\n');

            if (handlePayload(payload)) {
              shouldStop = true;
              break;
            }
          }

          if (shouldStop) break;
        }

        // Flush any remaining partial frame in the buffer
        if (sseBuffer.trim()) {
          const tailPayload = sseBuffer
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => {
              const rest = line.slice(5);
              return rest.startsWith(' ') ? rest.slice(1) : rest;
            })
            .join('\n');
          handlePayload(tailPayload);
        }

        callbacks.onDone(assistantMsgId, nextConversationId);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          callbacks.onAbort(assistantMsgId, accumulatedText);
          return;
        }
        callbacks.onError(assistantMsgId);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [],
  );

  return { stream, stop, isStreaming };
}

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FolderPlus, Plus, Check, Loader2, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { collectionsApi } from '@/services/api';
import { toast } from '@/lib/toast-store';
import { cn } from '@/lib/utils';
import type { Collection } from '@/types';

interface Props {
  course: {
    externalId: string;
    title: string;
    url: string;
    platformName?: string;
    platformId?: string;
  };
  onClose: () => void;
}

export function AddToCollectionModal({ course, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.getAll().then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (collectionId: string) =>
      collectionsApi.addCourse(collectionId, {
        externalId: course.externalId,
        title: course.title,
        url: course.url,
        platformName: course.platformName,
        platformId: course.platformId,
      }),
    onMutate: (collectionId) => setAddingTo(collectionId),
    onSuccess: async (_, collectionId) => {
      // Fetch the real count from getOne and update the list cache
      try {
        const { data: updated } = await collectionsApi.getOne(collectionId);
        const realCount = updated.courses?.length ?? updated.courseCount ?? 0;
        qc.setQueryData<import('@/types').Collection[]>(['collections'], (old) =>
          old?.map((col) =>
            col.id === collectionId
              ? { ...col, courseCount: realCount }
              : col
          )
        );
        // Store the detail so reopening the panel doesn't need to refetch
        qc.setQueryData(['collections', collectionId], updated);
      } catch {
        // Fallback: optimistic increment if getOne fails
        qc.setQueryData<import('@/types').Collection[]>(['collections'], (old) =>
          old?.map((col) =>
            col.id === collectionId
              ? { ...col, courseCount: (col.courseCount ?? 0) + 1 }
              : col
          )
        );
      }
      toast.success(t('collections.addSuccess'));
      onClose();
    },
    onError: (err: { response?: { status?: number } }) => {
      if (err?.response?.status === 409) {
        toast.error(t('collections.addDuplicate'));
      } else {
        toast.error(t('collections.addError'));
      }
    },
    onSettled: () => setAddingTo(null),
  });

  const createAndAddMutation = useMutation({
    mutationFn: async () => {
      const { data: newCollection } = await collectionsApi.create({ name: newName.trim() });
      await collectionsApi.addCourse(newCollection.id, {
        externalId: course.externalId,
        title: course.title,
        url: course.url,
        platformName: course.platformName,
        platformId: course.platformId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success(t('collections.addSuccess'));
      onClose();
    },
    onError: () => toast.error(t('collections.addError')),
  });

  const alreadyIn = (col: Collection) =>
    col.courses?.some((c) => c.externalId === course.externalId) ?? false;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[80vh] rounded-t-[2rem] sm:rounded-[2rem] border border-border/60 bg-card shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <FolderPlus className="h-4 w-4" />
            </div>
            <p className="font-black text-foreground tracking-tight text-sm">{t('collections.addToTitle')}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Course hint */}
        <div className="px-5 py-2.5 border-b border-border/40 shrink-0">
          <p className="text-xs text-muted-foreground line-clamp-1">
            <span className="font-bold text-foreground">{course.title}</span>
            {course.platformName && <span> · {course.platformName}</span>}
          </p>
        </div>

        {/* Collection list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 rounded-2xl bg-muted/30" />
            ))
          ) : collections.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t('collections.emptyForAdd')}</p>
            </div>
          ) : (
            collections.map((col) => {
              const already = alreadyIn(col);
              const loading = addingTo === col.id && addMutation.isPending;
              return (
                <button
                  key={col.id}
                  disabled={already || loading}
                  onClick={() => !already && addMutation.mutate(col.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    already
                      ? 'border-emerald-500/30 bg-emerald-500/5 opacity-70 cursor-default'
                      : 'border-border/40 bg-muted/10 hover:bg-muted/30 hover:border-foreground/20 active:scale-[0.99]',
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl',
                    already ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-600/10 text-blue-600'
                  )}>
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : already ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">{col.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {(col.courseCount ?? col.courses?.length ?? 0)} {t('collections.coursesCount')}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* New collection footer */}
        <div className="border-t border-border/40 p-4 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{t('collections.newAndAdd')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('collections.namePlaceholder')}
              className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim() && !createAndAddMutation.isPending) {
                  createAndAddMutation.mutate();
                }
              }}
            />
            <button
              onClick={() => { if (newName.trim()) createAndAddMutation.mutate(); }}
              disabled={!newName.trim() || createAndAddMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 disabled:opacity-40 active:scale-95"
            >
              {createAndAddMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('collections.createAndAdd')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

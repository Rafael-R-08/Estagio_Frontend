import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, X, BookMarked, ExternalLink, FolderOpen,
  Edit2, BookOpen, ChevronRight, Share2,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { trainingApi, collectionsApi } from '@/services/api';
import { toList } from '@/lib/api';
import { copyCollectionToClipboard } from '@/lib/collection-export';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Collection, CollectionCourse } from '@/types';

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

function CollectionFormModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial?: { name: string; description?: string };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-black text-foreground tracking-tight">
            {initial ? t('collections.editTitle') : t('collections.createTitle')}
          </p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t('collections.nameLabel')}</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('collections.namePlaceholder')}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{t('collections.descLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('collections.descPlaceholder')}
              rows={2}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-full border border-border/60 px-5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), description.trim()); }}
            disabled={!name.trim() || saving}
            className="rounded-full bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 disabled:opacity-50 active:scale-95"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Detail Panel ──────────────────────────────────────────────────

function CollectionDetailPanel({
  collectionId,
  onClose,
  onDeleteCourse,
  completedUrls = new Set(),
}: {
  collectionId: string;
  onClose: () => void;
  onDeleteCourse: (externalId: string) => void;
  completedUrls?: Set<string>;
}) {
  const { t } = useTranslation();
  const [orderedCourses, setOrderedCourses] = useState<CollectionCourse[]>([]);

  const { data: collection, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['collections', collectionId],
    queryFn: () => collectionsApi.getOne(collectionId).then((r) => r.data),
  });

  useEffect(() => {
    if (collection?.courses) {
      const saved = localStorage.getItem(`collection_order_${collectionId}`);
      if (saved) {
        const orderIds = JSON.parse(saved);
        const sorted = [...collection.courses].sort((a, b) => {
          const idxA = orderIds.indexOf(a.externalId);
          const idxB = orderIds.indexOf(b.externalId);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        setOrderedCourses(sorted);
      } else {
        setOrderedCourses(collection.courses);
      }
    }
  }, [collection?.courses, collectionId]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(orderedCourses);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setOrderedCourses(newItems);
    localStorage.setItem(`collection_order_${collectionId}`, JSON.stringify(newItems.map(c => c.externalId)));
  };

  const courses = orderedCourses;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] rounded-t-[2rem] sm:rounded-[2rem] border border-border/60 bg-card shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border/40 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-foreground tracking-tight truncate">{collection?.name}</p>
            {collection?.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{collection.description}</p>
            )}
          </div>
          {collection && (
            <button
              onClick={() => copyCollectionToClipboard(collection, t)}
              title={t('collections.sharePlanBtn')}
              className="flex h-8 items-center gap-1.5 rounded-full bg-blue-600/10 px-3 text-[10px] font-black uppercase tracking-wider text-blue-600 transition hover:bg-blue-600/20 active:scale-95"
            >
              <Share2 className="h-3 w-3" />
              <span className="hidden sm:inline">{t('collections.sharePlanBtnShort')}</span>
            </button>
          )}
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Course list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingDetail ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded-2xl bg-muted/30" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('collections.emptyCourses')}</p>
              <p className="text-xs text-muted-foreground/60">{t('collections.emptyCoursesHint')}</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="courses">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="space-y-3"
                  >
                    {courses.map((c, index) => {
                      const isCompleted = completedUrls.has(c.url);
                      return (
                        <Draggable key={c.externalId} draggableId={c.externalId} index={index}>
                          {(draggableProvided, snapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              className={cn(
                                "flex items-center gap-3 rounded-2xl border px-4 py-3 group transition-all",
                                snapshot.isDragging ? "shadow-2xl border-primary scale-[1.02] bg-card z-50" : "",
                                isCompleted 
                                  ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" 
                                  : "border-border/40 bg-muted/20 hover:bg-muted/30"
                              )}
                            >
                              <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                                isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                              )}>
                                <BookMarked className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-bold truncate",
                                  isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                                )}>{c.title}</p>
                                {c.platformName && (
                                  <p className="text-[10px] text-muted-foreground">{c.platformName}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteCourse(c.externalId); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <div className="border-t border-border/40 px-6 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            {t('collections.courseCount', { count: courses.length })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  progress = 0,
  onOpen,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  progress?: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const count = collection.courseCount ?? collection.courses?.length ?? 0;

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col gap-4 rounded-[2.5rem] border border-border/60 bg-background/40 backdrop-blur-md p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5 hover:border-foreground/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 group-hover:bg-blue-600/20 transition-colors">
          <FolderOpen className="h-6 w-6" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{collection.name}</p>
        {collection.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{collection.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          <span>{t('myLearning.title')}</span>
          <span className={cn(progress === 100 ? "text-emerald-500" : "")}>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div 
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              progress === 100 ? "bg-emerald-500" : "bg-blue-600"
            )}
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <p className="text-[11px] font-bold text-muted-foreground">
          {t('collections.courseCount', { count })}
        </p>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);

  const { data: completedTrainings = [] } = useQuery({
    queryKey: ['trainings', 'completed'],
    queryFn: () => trainingApi.getAll({ status: 'completed' }).then((r) => toList(r.data)),
  });

  const completedUrls = new Set(completedTrainings.map(t => t.url));

  const { data: rawCollections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.getAll().then((r) => r.data),
  });

  const collections = useMemo(() => {
    return rawCollections.map((col: any) => {
      // 1. Get detailed data from cache if available (from detail panel)
      const detailData = qc.getQueryData<Collection>(['collections', col.id]);
      
      // 2. Determine best courses array and count
      const colCourses = detailData?.courses ?? col.courses ?? [];
      const serverCount = col._count?.courses ?? col.courseCount ?? col.courses?.length ?? 0;
      const detailCount = detailData?.courseCount ?? detailData?.courses?.length ?? 0;
      
      // 3. Calculate progress
      const completedCount = colCourses.filter((c: any) => completedUrls.has(c.url)).length;
      const progress = colCourses.length > 0 ? (completedCount / colCourses.length) * 100 : 0;

      return { 
        ...col, 
        courseCount: Math.max(serverCount, detailCount),
        courses: colCourses,
        progress 
      };
    });
  }, [rawCollections, completedUrls, qc]);

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; description?: string }) => collectionsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success(t('collections.toastCreated'));
      setShowCreate(false);
    },
    onError: () => toast.error(t('collections.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name: string; description?: string } }) =>
      collectionsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success(t('collections.toastUpdated'));
      setEditingCollection(null);
    },
    onError: () => toast.error(t('collections.toastUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success(t('collections.toastDeleted'));
      setOpenCollectionId(null);
    },
    onError: () => toast.error(t('collections.toastDeleteError')),
  });

  const removeCourseMutation = useMutation({
    mutationFn: ({ collectionId, externalId }: { collectionId: string; externalId: string }) =>
      collectionsApi.removeCourse(collectionId, externalId),
    onSuccess: (_, { collectionId, externalId }) => {
      // Update individual details cache
      let updatedCourses: any[] | undefined = undefined;
      qc.setQueryData<any>(['collections', collectionId], (old: any) => {
        if (!old) return old;
        const newCourses = old.courses?.filter((c: any) => c.externalId !== externalId) ?? [];
        updatedCourses = newCourses;
        return { ...old, courses: newCourses, courseCount: newCourses.length };
      });
      
      // Update main list cache
      qc.setQueryData<import('@/types').Collection[]>(['collections'], (old) => {
        if (!old) return old;
        return old.map(col => {
          if (col.id === collectionId) {
             const newCourses = updatedCourses ?? col.courses?.filter((c: any) => c.externalId !== externalId) ?? [];
             return { ...col, courses: newCourses, courseCount: newCourses.length };
          }
          return col;
        });
      });
    },
    onError: () => toast.error(t('collections.toastUpdateError')),
  });

  const handleDeleteCourse = (externalId: string) => {
    if (!openCollectionId) return;
    removeCourseMutation.mutate({ collectionId: openCollectionId, externalId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {t('collections.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('collections.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t('collections.new')}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn('grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[2.5rem] border border-border/60 bg-background/40 p-6 h-48" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{t('collections.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('collections.emptyDesc')}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 active:scale-95 mt-2"
          >
            <Plus className="h-4 w-4" />
            {t('collections.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              progress={(collection as any).progress}
              onOpen={() => setOpenCollectionId(collection.id)}
              onEdit={() => setEditingCollection(collection)}
              onDelete={() => {
                if (confirm(t('collections.confirmDelete', { name: collection.name }))) {
                  deleteMutation.mutate(collection.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CollectionFormModal
          onClose={() => setShowCreate(false)}
          onSave={(name, description) => createMutation.mutate({ name, description: description || undefined })}
          saving={createMutation.isPending}
        />
      )}

      {/* Edit modal */}
      {editingCollection && (
        <CollectionFormModal
          initial={{ name: editingCollection.name, description: editingCollection.description }}
          onClose={() => setEditingCollection(null)}
          onSave={(name, description) =>
            updateMutation.mutate({ id: editingCollection.id, dto: { name, description: description || undefined } })
          }
          saving={updateMutation.isPending}
        />
      )}

      {/* Detail panel */}
      {openCollectionId && (
        <CollectionDetailPanel
          collectionId={openCollectionId}
          completedUrls={completedUrls}
          onClose={() => setOpenCollectionId(null)}
          onDeleteCourse={handleDeleteCourse}
        />
      )}
    </div>
  );
}

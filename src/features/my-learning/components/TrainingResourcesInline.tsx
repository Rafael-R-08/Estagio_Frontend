import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  File,
  Plus,
  Trash2,
  Paperclip,
  Pencil,
  Image,
  FileCode,
  Music,
  Video,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi } from '@/services/api';
import { toast } from '@/lib/toast-store';
import type { TrainingRecord, TrainingResource } from '@/types';

interface TrainingResourcesInlineProps {
  training: TrainingRecord;
  onClose?: () => void;
  readOnly?: boolean;
}

export function TrainingResourcesInline({ training, onClose, readOnly }: TrainingResourcesInlineProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Unified Form State: 'new' | resourceId | null
  const [activeResourceId, setActiveResourceId] = useState<string | 'new' | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [showDocs, setShowDocs] = useState(true);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const extractError = (err: any) => {
    const errorData = err.response?.data?.message;
    if (Array.isArray(errorData)) {
      return errorData.map((m: any) => {
        if (typeof m === 'string') return m;
        return Object.values(m.constraints || {}).join(', ');
      }).join('; ');
    }
    return errorData || t('myLearning.resources.unexpectedError');
  };

  // ── Mutations ────────────────────────────────────────────────────────────

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => trainingApi.createResource(training.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success(t('myLearning.resources.toastResourceAdded'));
      resetForm();
    },
    onError: (err: any) => toast.error(extractError(err)),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ resId, data }: { resId: string; data: any }) =>
      trainingApi.updateResource(training.id, resId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success(t('myLearning.resources.toastResourceUpdated'));
      setActiveResourceId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(extractError(err))
  });

  const addResourceFileMutation = useMutation({
    mutationFn: ({ resId, file }: { resId: string; file: File }) =>
      trainingApi.addResourceFile(training.id, resId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
    onError: () => toast.error(t('myLearning.resources.toastFileAddError'))
  });

  const deleteResourceFileMutation = useMutation({
    mutationFn: ({ resId, fileId }: { resId: string; fileId: string }) =>
      trainingApi.deleteResourceFile(training.id, resId, fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
    onError: () => toast.error(t('myLearning.resources.toastFileRemoveError'))
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (resId: string) => trainingApi.deleteResource(training.id, resId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success(t('myLearning.resources.toastResourceRemoved'));
    },
    onError: (err: any) => toast.error(extractError(err))
  });

  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => trainingApi.uploadDocument(training.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success(t('myLearning.resources.toastMaterialAdded'));
      setIsUploadingDoc(false);
    },
    onError: () => {
      toast.error(t('myLearning.resources.toastMaterialUploadError'));
      setIsUploadingDoc(false);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) => trainingApi.deleteDocument(training.id, docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainings'] }),
    onError: () => toast.error(t('myLearning.resources.toastMaterialDeleteError'))
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setSelectedFiles([]);
    setActiveResourceId(null);
    setIsEditing(false);
    setIsSubmitting(false);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('content', formContent.trim());

      if (activeResourceId === 'new') {
        formData.append('position', String((training.resources?.length || 0) + 1));
        selectedFiles.forEach(file => formData.append('files', file));
        createResourceMutation.mutate(formData);
      } else if (activeResourceId) {
        updateResourceMutation.mutate({
          resId: activeResourceId,
          data: { title: formTitle.trim(), content: formContent.trim() }
        });
      }
    } catch (err: any) {
      toast.error(extractError(err));
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <FileText className="h-4 w-4" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return <Image className="h-4 w-4" />;
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'go'].includes(ext || '')) return <FileCode className="h-4 w-4 text-blue-500" />;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music className="h-4 w-4" />;
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleStartView = (res: TrainingResource) => {
    setActiveResourceId(res.id);
    setIsEditing(false);
    setFormTitle(res.title);
    setFormContent(res.content || '');
    setSelectedFiles([]);
  };

  const handleStartEdit = (res: TrainingResource) => {
    setActiveResourceId(res.id);
    setIsEditing(true);
    setFormTitle(res.title);
    setFormContent(res.content || '');
    setSelectedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (activeResourceId === 'new') {
      setSelectedFiles(prev => [...prev, ...files]);
    } else if (activeResourceId) {
      files.forEach(file => addResourceFileMutation.mutate({ resId: activeResourceId, file }));
    }
    e.target.value = '';
  };

  const sortedResources = [...(training.resources || [])].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-6 border-t border-border/40 pt-6 animate-in fade-in slide-in-from-top-2 duration-500">

      {/* ── Official Documents Section ── */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-muted/30 border border-border/40">
        <button
          onClick={() => setShowDocs(!showDocs)}
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{t('myLearning.resources.documentsTitle')}</h3>
              <p className="text-[10px] text-muted-foreground opacity-60">{t('myLearning.resources.documentsSubtitle', { count: training.documents?.length || 0 })}</p>
            </div>
          </div>
          {showDocs ? <ChevronUp className="h-4 w-4 opacity-40" /> : <ChevronDown className="h-4 w-4 opacity-40" />}
        </button>

        {showDocs && (
          <div className="border-t border-border/40 p-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {training.documents?.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/20 group/doc">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    {getFileIcon(doc.fileName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1">
                        Download <Download className="h-2.5 w-2.5" />
                      </a>
                      {!readOnly && (
                        <button onClick={() => deleteDocumentMutation.mutate(doc.id)} className="text-[9px] font-bold text-muted-foreground hover:text-red-500 opacity-0 group-hover/doc:opacity-100 transition-all">
                          {t('myLearning.resources.remove')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!readOnly && (
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 p-3 text-[10px] font-bold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]">
                {isUploadingDoc ? <div className="animate-pulse">{t('myLearning.resources.uploading')}</div> : <><Plus className="h-3 w-3" /> {t('myLearning.resources.addDocument')}</>}
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploadingDoc}
                  onChange={e => e.target.files?.[0] && uploadDocMutation.mutate(e.target.files[0])}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Resources Toolbar ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{t('myLearning.resources.notesTitle')}</h3>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">{sortedResources.length}</span>
        </div>
        {(activeResourceId === null && !readOnly) && (
          <button
            onClick={() => { resetForm(); setActiveResourceId('new'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-background text-[10px] font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('myLearning.resources.newNote')}
          </button>
        )}
      </div>

      {/* ── Main Workspace ── */}
      <div className="space-y-4">
        {/* Form or View Detail */}
        {activeResourceId !== null && (
          <div className="relative rounded-2xl border-2 border-primary/20 bg-background/60 p-5 shadow-xl animate-in slide-in-from-top-4 duration-300">
            {(activeResourceId === 'new' || isEditing) ? (
              <form onSubmit={handleSaveResource} className="space-y-4">
                <input
                  autoFocus
                  placeholder={t('myLearning.resources.noteTitlePlaceholder')}
                  className="w-full bg-transparent font-bold text-lg outline-none border-b border-border/40 pb-2 placeholder:opacity-30"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                />
                <textarea
                  placeholder={t('myLearning.resources.noteContentPlaceholder')}
                  className="w-full bg-transparent text-sm min-h-[120px] outline-none resize-none border-none leading-relaxed placeholder:opacity-30"
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                />

                {/* Existing Files */}
                {activeResourceId !== 'new' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {training.resources?.find(r => r.id === activeResourceId)?.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40 text-[10px]">
                        <span className="truncate flex-1 font-bold opacity-80">{file.fileName}</span>
                        <button type="button" onClick={() => deleteResourceFileMutation.mutate({ resId: activeResourceId, fileId: file.id })} className="p-1 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer group">
                    <Paperclip className="h-4 w-4" />
                    {selectedFiles.length > 0 ? t('myLearning.resources.filesSelected', { count: selectedFiles.length }) : t('myLearning.resources.attachFiles')}
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={resetForm} className="text-[10px] font-bold px-4 py-2 hover:bg-muted rounded-lg">{t('myLearning.resources.cancelNote')}</button>
                    <button disabled={!formTitle.trim() || isSubmitting} className="text-[10px] font-bold bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm shadow-blue-600/20 disabled:opacity-50">
                      {isSubmitting ? t('myLearning.resources.savingNote') : t('myLearning.resources.saveNote')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-bold text-foreground pr-24 break-words">{formTitle}</h4>
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-muted rounded-lg text-primary"><Pencil className="h-4 w-4" /></button>
                    )}
                    <button onClick={resetForm} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[80px] break-words">{formContent}</p>
                {/* Files Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-border/40">
                  {training.resources?.find(r => r.id === activeResourceId)?.files.map(file => (
                    <a key={file.id} href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/10 text-[10px] font-bold hover:bg-primary/5 hover:text-primary transition-all">
                      {getFileIcon(file.fileName)}
                      <span className="truncate flex-1 font-medium">{file.fileName}</span>
                      <Download className="h-3 w-3 opacity-40" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources Cards Grid (only when not showing detail) */}
        {activeResourceId === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResources.map(res => (
              <div
                key={res.id}
                onClick={() => handleStartView(res)}
                className="group relative flex flex-col bg-card/40 border border-border/40 rounded-2xl p-4 cursor-pointer hover:border-primary/20 hover:bg-card hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="text-[11px] font-bold text-foreground line-clamp-1 flex-1 break-words">{res.title}</h5>
                  {!readOnly && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); handleStartEdit(res); }} className="p-1 hover:text-primary"><Pencil className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteResourceMutation.mutate(res.id); }} className="p-1 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 line-clamp-2 leading-relaxed mb-3 break-words">{res.content}</p>
                {res.files && res.files.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {res.files.map(f => (
                      <div key={f.id} className="p-1 bg-muted rounded group-hover:bg-muted/80">{getFileIcon(f.fileName)}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sortedResources.length === 0 && (
              <div className="col-span-full py-10 text-center border-2 border-dashed border-border/20 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/30">{t('myLearning.resources.emptyNotes')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onClose}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('myLearning.resources.collapseButton')}
        </button>
      </div>
    </div>
  );
}

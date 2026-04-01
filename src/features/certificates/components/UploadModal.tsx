import { useState, useRef, useEffect, type DragEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, ImageIcon, Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast-store';
import { certificatesApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { TrainingRecord, UpdateCertificateDto, Certificate } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  trainings: TrainingRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'processing' | 'completed' | 'error';

// ─── File preview component ───────────────────────────────────────────────────

function FilePreview({ file }: { file: File }) {
  const isPdf = file.type === 'application/pdf';
  const imgUrlRef = useRef<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isPdf && file) {
      const url = URL.createObjectURL(file);
      imgUrlRef.current = url;
      setImgUrl(url);
    }
    return () => {
      if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    };
  }, [file, isPdf]);

  if (isPdf) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
          <FileText className="h-6 w-6" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PDF · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border bg-muted/10">
      {imgUrl ? (
        <img src={imgUrl} alt="Preview" className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function UploadModal({ trainings, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [trainingId, setTrainingId] = useState('');
  const [meta, setMeta] = useState<UpdateCertificateDto>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Job states
  const [jobId, setJobId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [finalData, setFinalData] = useState<Certificate | null>(null);

  // ── Polling logic ───────────────────────────────────────────────────────
  useEffect(() => {
    if ((state !== 'processing' && state !== 'uploading') || !jobId) return;

    let interval: number | ReturnType<typeof setTimeout>;

    interval = setInterval(async () => {
      try {
        const res = await certificatesApi.getJobStatus(jobId);
        const { status, errorMessage, certificateId } = res.data;

        if (status === 'COMPLETED') {
          clearInterval(interval);
          // Fetch final certificate data to show the results
          if (certificateId) {
            const certRes = await certificatesApi.getById(certificateId);
            setFinalData(certRes.data);
          }
          setState('completed');
          queryClient.invalidateQueries({ queryKey: ['certificates'] });
          toast.success(t('certificates.uploadModal.states.COMPLETED'));
        } else if (status === 'FAILED') {
          clearInterval(interval);
          setErrorMsg(errorMessage || t('certificates.uploadModal.errorProcessing'));
          setState('error');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval as any);
  }, [state, jobId, queryClient, t]);

  // ── Auto-close logic ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'completed' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (state === 'completed' && countdown === 0) {
      setTimeout(onSuccess, 500);
    }
  }, [state, countdown, onSuccess]);

  // ── Upload mutation ─────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: () => certificatesApi.upload(file!, trainingId, meta),
    onSuccess: (res) => {
      setJobId(res.data.jobId);
      setState('processing');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || t('certificates.uploadModal.errorProcessing'));
      setState('error');
    },
  });

  // ── File handling ─────────────────────────────────────────────────────
  function acceptFile(f: File) {
    const valid = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!valid.includes(f.type)) {
      setErrorMsg('Invalid format. Use PDF, PNG or JPG.');
      setState('error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large (max 10MB).');
      setState('error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(f);
    setState('preview');
    setErrorMsg('');

    // Auto-extract name from filename
    const nameWithoutExt = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    setMeta(prev => ({ ...prev, courseName: nameWithoutExt }));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  function handleSubmit() {
    if (!file || !trainingId) return;
    setErrorMsg('');
    setState('uploading');
    uploadMutation.mutate();
  }

  const linkable = trainings.filter(t => !t.certificate || (t.certificate.status === 'FAILED'));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground opacity-70">{t('certificates.uploadModal.title')}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Asynchronous extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition hover:bg-foreground hover:text-background active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
          {/* ── State: Idle (Dropzone) ── */}
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex h-64 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed transition-all duration-300",
                dragOver ? "border-foreground bg-foreground/5" : "border-border/60 bg-muted/20 hover:border-foreground/20 hover:bg-muted/40"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-lg">
                <Upload className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">PDF, PNG, JPG (Max 10MB)</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />
            </div>
          )}

          {/* ── State: Preview / Form ── */}
          {(state === 'preview' || state === 'error') && file && (
            <div className="space-y-6">
              <FilePreview file={file} />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linked Training *</label>
                  <select
                    value={trainingId}
                    onChange={(e) => setTrainingId(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border/60 bg-muted/20 px-4 text-sm font-medium focus:ring-4 focus:ring-foreground/5 outline-none transition"
                  >
                    <option value="">Select a training...</option>
                    {linkable.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course Name Override</label>
                  <input
                    type="text"
                    value={meta.courseName || ''}
                    onChange={(e) => setMeta(p => ({ ...p, courseName: e.target.value }))}
                    placeholder="Auto-extracted if left empty"
                    className="h-12 w-full rounded-xl border border-border/60 bg-muted/20 px-4 text-sm font-medium focus:ring-4 focus:ring-foreground/5 outline-none transition"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-xs font-bold">{errorMsg}</p>
                </div>
              )}
            </div>
          )}

          {/* ── State: Processing (UPLOADING / PROCESSING) ── */}
          {(state === 'uploading' || state === 'processing') && (
            <div className="flex flex-col items-center justify-center gap-6 py-10">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-foreground opacity-10" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background">
                  {state === 'uploading' ? <Loader2 className="h-8 w-8 animate-spin" /> : <Sparkles className="h-8 w-8 animate-pulse text-primary" />}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black tracking-tight text-foreground">
                  {state === 'uploading' ? t('certificates.uploadModal.states.PENDING') : t('certificates.uploadModal.states.PROCESSING')}
                </h3>
                <p className="mt-2 text-xs font-medium text-muted-foreground max-w-[240px] leading-relaxed">
                  Our AI is currently reading your certificate to extract all relevant details. This usually takes a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* ── State: Completed ── */}
          {state === 'completed' && finalData && (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-background shadow-xl shadow-green-500/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">{t('certificates.uploadModal.states.COMPLETED')}</h3>
                  <p className="text-xs font-medium text-muted-foreground">{t('certificates.uploadModal.successDetail')}</p>
                </div>

                <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-muted/10">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('certificates.uploadModal.fields.courseName')}</span>
                    <span className="text-xs font-bold text-foreground text-right truncate max-w-[150px]">{finalData.courseName}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('certificates.uploadModal.fields.provider')}</span>
                    <span className="text-xs font-bold text-foreground">{finalData.provider || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('certificates.uploadModal.fields.date')}</span>
                    <span className="text-xs font-bold text-foreground">{finalData.completionDate ? new Date(finalData.completionDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('certificates.uploadModal.autoClose', { seconds: countdown })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-border/60 px-8 py-5 bg-muted/10">
          {(state === 'idle' || state === 'preview' || state === 'error') && (
            <>
              <button
                onClick={onClose}
                disabled={uploadMutation.isPending}
                className="rounded-full px-6 py-3 text-sm font-bold text-muted-foreground transition hover:bg-muted active:scale-95 disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              {state !== 'idle' && (
                <button
                  onClick={handleSubmit}
                  disabled={!trainingId || uploadMutation.isPending}
                  className="flex items-center gap-2 rounded-full bg-foreground px-8 py-3 text-sm font-black text-background shadow-xl transition hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t('certificates.uploadBtn')}
                </button>
              )}
            </>
          )}
          {state === 'completed' && (
            <button onClick={onSuccess} className="rounded-full bg-foreground px-8 py-3 text-sm font-black text-background shadow-xl transition hover:opacity-90 active:scale-95">
              {t('common.close') || 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, ImageIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { certificatesApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { TrainingRecord, UpdateCertificateDto } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  trainings: TrainingRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'error';

// ─── File preview icon ────────────────────────────────────────────────────────

function FilePreview({ file }: { file: File }) {
  const isPdf = file.type === 'application/pdf';
  const [imgUrl] = useState(() =>
    !isPdf ? URL.createObjectURL(file) : null,
  );

  if (isPdf) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 gap-3">
        <FileText className="h-10 w-10 text-red-400" />
        <div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">PDF · {(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
      {imgUrl ? (
        <img src={imgUrl} alt="Preview" className="h-32 w-full object-contain" />
      ) : (
        <div className="flex h-32 items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

// ─── UploadModal ──────────────────────────────────────────────────────────────

export function UploadModal({ trainings, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [trainingId, setTrainingId] = useState('');
  const [meta, setMeta] = useState<UpdateCertificateDto>({});
  const [errorMsg, setErrorMsg] = useState('');

  // ── Upload mutation ─────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: () => certificatesApi.upload(file!, trainingId, meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificado carregado com sucesso!');
      onSuccess();
    },
    onError: () => {
      setErrorMsg('Erro ao carregar o certificado. Tenta novamente.');
      setState('error');
    },
  });

  // ── File handling ─────────────────────────────────────────────────────
  function acceptFile(f: File) {
    const valid = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!valid.includes(f.type)) {
      setErrorMsg('Formato não suportado. Usa PDF, PNG, JPG ou WEBP.');
      setState('error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Ficheiro demasiado grande. Máximo 10 MB.');
      setState('error');
      return;
    }
    setFile(f);
    setState('preview');
    setErrorMsg('');
    // Pre-populate courseName from filename
    const nameWithoutExt = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    setMeta((m: UpdateCertificateDto) => ({ ...m, courseName: m.courseName ?? nameWithoutExt }));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function handleSubmit() {
    if (!file) return;
    if (!trainingId) { setErrorMsg('Seleciona a formação associada.'); return; }
    setErrorMsg('');
    uploadMutation.mutate();
  }

  // ── Selectable trainings (linked or completed) ─────────────────────────
  const linkable = trainings.filter((t) => !t.certificate);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Carregar Certificado</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* ── Drop zone ── */}
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30',
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Arrasta o ficheiro ou clica para selecionar</p>
                <p className="mt-0.5 text-xs text-muted-foreground">PDF, PNG, JPG ou WEBP · Máximo 10 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* ── Preview + form ── */}
          {(state === 'preview' || state === 'error') && file && (
            <>
              <FilePreview file={file} />

              {/* Training selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Formação associada *</label>
                {linkable.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    Todas as formações já têm certificado ou não há formações registadas.
                  </p>
                ) : (
                  <select
                    value={trainingId}
                    onChange={(e) => setTrainingId(e.target.value)}
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  >
                    <option value="">Seleciona a formação...</option>
                    {linkable.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Metadata fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nome do curso</label>
                  <input
                    type="text"
                    value={meta.courseName ?? ''}
                    onChange={(e) => setMeta((m: UpdateCertificateDto) => ({ ...m, courseName: e.target.value }))}
                    placeholder="Ex: AZ-900: Microsoft Azure Fundamentals"
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Plataforma / Emissor</label>
                  <input
                    type="text"
                    value={meta.provider ?? ''}
                    onChange={(e) => setMeta((m: UpdateCertificateDto) => ({ ...m, provider: e.target.value }))}
                    placeholder="Ex: Microsoft"
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Horas</label>
                  <input
                    type="number"
                    min="0"
                    value={meta.durationHours ?? ''}
                    onChange={(e) => setMeta((m: UpdateCertificateDto) => ({ ...m, durationHours: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="Ex: 8"
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Data de conclusão</label>
                  <input
                    type="date"
                    value={meta.completionDate ? meta.completionDate.slice(0, 10) : ''}
                    onChange={(e) => setMeta((m: UpdateCertificateDto) => ({ ...m, completionDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Data de expiração</label>
                  <input
                    type="date"
                    value={meta.expirationDate ? meta.expirationDate.slice(0, 10) : ''}
                    onChange={(e) => setMeta((m: UpdateCertificateDto) => ({ ...m, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    disabled={uploadMutation.isPending}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* AI note */}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                Os metadados em falta serão extraídos automaticamente por IA após o envio.
              </p>
            </>
          )}

          {/* ── Error banner ── */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={() => { setFile(null); setMeta({}); setState('idle'); setErrorMsg(''); }}
            disabled={uploadMutation.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {state === 'preview' ? 'Trocar ficheiro' : 'Cancelar'}
          </button>
          {state === 'preview' && (
            <button
              onClick={handleSubmit}
              disabled={!trainingId || linkable.length === 0 || uploadMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Carregar
                </>
              )}
            </button>
          )}
          {state === 'error' && (
            <button
              onClick={() => { setState(file ? 'preview' : 'idle'); setErrorMsg(''); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
